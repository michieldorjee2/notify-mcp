import { describe, it, expect, vi, beforeEach } from "vitest";
import { teamsChannel } from "@/lib/channels/teams";
import type { RenderedCard, TeamsChannelConfig } from "@/lib/types";

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

const config: TeamsChannelConfig = {
  channel: "teams",
  webhookUrl: "https://webhook.example.com/test",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("teams channel", () => {
  it("sends correctly formatted Teams envelope payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    await teamsChannel.send(mockCard, config);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://webhook.example.com/test");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(options?.body as string);
    expect(body.type).toBe("message");
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].contentType).toBe(
      "application/vnd.microsoft.card.adaptive"
    );
    expect(body.attachments[0].content.type).toBe("AdaptiveCard");
  });

  it("returns success on 200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    const result = await teamsChannel.send(mockCard, config);
    expect(result.success).toBe(true);
    expect(result.channel).toBe("teams");
    expect(result.statusCode).toBe(200);
  });

  it("detects rate limiting in response body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        "Microsoft Teams endpoint returned HTTP error 429",
        { status: 200 }
      )
    );

    const result = await teamsChannel.send(mockCard, config);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(429);
    expect(result.error).toContain("rate limited");
  });

  it("handles non-200 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    const result = await teamsChannel.send(mockCard, config);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.error).toContain("401");
  });

  it("rejects payloads exceeding 28KB", async () => {
    const largeCard: RenderedCard = {
      adaptiveCard: {
        ...mockCard.adaptiveCard,
        body: [
          {
            type: "TextBlock",
            text: "x".repeat(30 * 1024), // 30KB of text
          },
        ],
      },
    };

    const result = await teamsChannel.send(largeCard, config);
    expect(result.success).toBe(false);
    expect(result.error).toContain("exceeds Teams limit");
  });

  it("handles network errors gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("DNS resolution failed")
    );

    const result = await teamsChannel.send(mockCard, config);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
    expect(result.error).toContain("DNS resolution failed");
  });
});
