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

// Mock botbuilder adapter — use a stable reference via getter
const _continueConversation = vi.fn();
vi.mock("@/lib/bot", () => ({
  get adapter() {
    return { continueConversation: _continueConversation };
  },
  bot: {},
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

const config: TeamsChannelConfig = {
  channel: "teams",
  pin: "ABC123",
};

const fakeReference = {
  activityId: "1",
  user: { id: "user1" },
  bot: { id: "bot1" },
  conversation: { id: "conv1" },
  serviceUrl: "https://smba.trafficmanager.net/teams/",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("teams channel (bot framework)", () => {
  it("looks up ConversationReference by PIN and sends card", async () => {
    vi.mocked(kv.get).mockResolvedValue(fakeReference);
    _continueConversation.mockImplementation(
      async (_ref: unknown, callback: (ctx: unknown) => Promise<void>) => {
        await callback({ sendActivity: vi.fn() });
      }
    );

    const result = await teamsChannel.send(mockCard, config);

    expect(kv.get).toHaveBeenCalledWith("pin:ABC123");
    expect(_continueConversation).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.channel).toBe("teams");
  });

  it("sends adaptive card attachment via proactive message", async () => {
    vi.mocked(kv.get).mockResolvedValue(fakeReference);
    let sentActivity: Record<string, unknown> | undefined;
    _continueConversation.mockImplementation(
      async (_ref: unknown, callback: (ctx: unknown) => Promise<void>) => {
        await callback({
          sendActivity: vi.fn((activity: Record<string, unknown>) => {
            sentActivity = activity;
          }),
        });
      }
    );

    await teamsChannel.send(mockCard, config);

    expect(sentActivity).toBeDefined();
    const attachments = sentActivity!.attachments as Array<{
      contentType: string;
      content: unknown;
    }>;
    expect(attachments[0].contentType).toBe(
      "application/vnd.microsoft.card.adaptive"
    );
    expect(attachments[0].content).toEqual(mockCard.adaptiveCard);
  });

  it("returns error when PIN not found", async () => {
    vi.mocked(kv.get).mockResolvedValue(null);

    const result = await teamsChannel.send(mockCard, config);

    expect(result.success).toBe(false);
    expect(result.error).toContain('PIN "ABC123" not found');
  });

  it("handles bot authentication errors", async () => {
    vi.mocked(kv.get).mockResolvedValue(fakeReference);
    _continueConversation.mockRejectedValue(new Error("401 Unauthorized"));

    const result = await teamsChannel.send(mockCard, config);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it("handles bot removed from conversation (403)", async () => {
    vi.mocked(kv.get).mockResolvedValue(fakeReference);
    _continueConversation.mockRejectedValue(new Error("403 Forbidden"));

    const result = await teamsChannel.send(mockCard, config);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it("handles generic errors", async () => {
    vi.mocked(kv.get).mockResolvedValue(fakeReference);
    _continueConversation.mockRejectedValue(new Error("Network timeout"));

    const result = await teamsChannel.send(mockCard, config);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network timeout");
  });
});
