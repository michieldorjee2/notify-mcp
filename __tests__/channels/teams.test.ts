import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RenderedCard, TeamsChannelConfig } from "@/lib/types";

// Mock @vercel/kv
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

import { teamsChannel } from "@/lib/channels/teams";
import { kv } from "@vercel/kv";

const mockCard: RenderedCard = {
  adaptiveCard: {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      { type: "TextBlock", text: "Test", size: "large", weight: "bolder" },
    ],
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("teams channel", () => {
  describe("with direct webhook_url", () => {
    const config: TeamsChannelConfig = {
      channel: "teams",
      webhookUrl: "https://webhook.example.com/test",
    };

    it("sends correctly formatted Teams envelope", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("1", { status: 200 })
      );

      await teamsChannel.send(mockCard, config);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.type).toBe("message");
      expect(body.attachments[0].contentType).toBe(
        "application/vnd.microsoft.card.adaptive"
      );
      expect(body.attachments[0].content.type).toBe("AdaptiveCard");
    });

    it("returns success on 200", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("1", { status: 200 })
      );

      const result = await teamsChannel.send(mockCard, config);
      expect(result.success).toBe(true);
    });

    it("detects rate limiting", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Microsoft Teams endpoint returned HTTP error 429", {
          status: 200,
        })
      );

      const result = await teamsChannel.send(mockCard, config);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(429);
    });

    it("handles non-200 responses", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Unauthorized", { status: 401 })
      );

      const result = await teamsChannel.send(mockCard, config);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    it("rejects payloads exceeding 28KB", async () => {
      const largeCard: RenderedCard = {
        adaptiveCard: {
          ...mockCard.adaptiveCard,
          body: [{ type: "TextBlock", text: "x".repeat(30 * 1024) }],
        },
      };

      const result = await teamsChannel.send(largeCard, config);
      expect(result.success).toBe(false);
      expect(result.error).toContain("exceeds Teams limit");
    });

    it("handles network errors", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new Error("DNS resolution failed")
      );

      const result = await teamsChannel.send(mockCard, config);
      expect(result.success).toBe(false);
      expect(result.error).toContain("DNS resolution failed");
    });
  });

  describe("with PIN", () => {
    const config: TeamsChannelConfig = {
      channel: "teams",
      pin: "ABC123",
    };

    it("looks up webhook URL by PIN and sends", async () => {
      vi.mocked(kv.get).mockResolvedValue("https://webhook.example.com/stored");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("1", { status: 200 })
      );

      const result = await teamsChannel.send(mockCard, config);

      expect(kv.get).toHaveBeenCalledWith("pin:ABC123");
      expect(result.success).toBe(true);
    });

    it("returns error when PIN not found", async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await teamsChannel.send(mockCard, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PIN "ABC123" not found');
    });
  });
});
