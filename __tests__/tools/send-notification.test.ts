import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @vercel/kv
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

// Mock botbuilder adapter
const _continueConversation = vi.fn();
vi.mock("@/lib/bot", () => ({
  get adapter() {
    return { continueConversation: _continueConversation };
  },
  bot: {},
}));

import { handleSendNotification } from "@/lib/tools/send-notification";
import { handleListTemplates } from "@/lib/tools/list-templates";
import { kv } from "@vercel/kv";

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

function mockSuccessfulSend() {
  vi.mocked(kv.get).mockResolvedValue(fakeReference);
  _continueConversation.mockImplementation(
    async (_ref: unknown, cb: (ctx: unknown) => Promise<void>) => {
      await cb({ sendActivity: vi.fn() });
    }
  );
}

describe("send_notification tool", () => {
  it("returns success for valid notification", async () => {
    mockSuccessfulSend();

    const result = await handleSendNotification({
      channel: "teams",
      pin: "ABC123",
      template: "simple-notification",
      variables: {
        title: "Deploy Complete",
        message: "v2.1.0 deployed to production",
      },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("successfully");
    expect(result.content[0].text).toContain("teams");
  });

  it("returns validation error for missing required variables", async () => {
    const result = await handleSendNotification({
      channel: "teams",
      pin: "ABC123",
      template: "simple-notification",
      variables: { title: "No message field" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Validation error");
    expect(result.content[0].text).toContain("message");
  });

  it("falls back to default template for unknown template name", async () => {
    mockSuccessfulSend();

    const result = await handleSendNotification({
      channel: "teams",
      pin: "ABC123",
      template: "nonexistent-template",
      variables: {
        title: "Test",
        message: "Using fallback",
      },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("simple-notification");
    expect(result.content[0].text).toContain("fallback");
  });

  it("returns error when PIN not found", async () => {
    vi.mocked(kv.get).mockResolvedValue(null);

    const result = await handleSendNotification({
      channel: "teams",
      pin: "BADPIN",
      template: "simple-notification",
      variables: {
        title: "Test",
        message: "Will fail",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to send");
    expect(result.content[0].text).toContain("PIN");
  });

  it("sends correct adaptive card via bot framework", async () => {
    vi.mocked(kv.get).mockResolvedValue(fakeReference);
    let sentActivity: Record<string, unknown> | undefined;
    _continueConversation.mockImplementation(
      async (_ref: unknown, cb: (ctx: unknown) => Promise<void>) => {
        await cb({
          sendActivity: vi.fn((a: Record<string, unknown>) => {
            sentActivity = a;
          }),
        });
      }
    );

    await handleSendNotification({
      channel: "teams",
      pin: "ABC123",
      template: "simple-notification",
      variables: {
        title: "Alert",
        message: "Something happened",
        severity: "warning",
        facts: [{ title: "Service", value: "api" }],
        actionUrl: "https://dashboard.example.com",
        actionTitle: "View Dashboard",
      },
    });

    const card = (
      sentActivity!.attachments as Array<{ content: Record<string, unknown> }>
    )[0].content;
    expect(card.type).toBe("AdaptiveCard");
    const body = card.body as Array<Record<string, unknown>>;
    expect(body[0].text).toBe("Alert");
    expect(body[0].color).toBe("warning");
  });
});

describe("list_templates tool", () => {
  it("returns available templates", async () => {
    const result = await handleListTemplates();
    const templates = JSON.parse(result.content[0].text);

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("simple-notification");
    expect(templates[0].supportedChannels).toContain("teams");
    expect(templates[0].variables.length).toBeGreaterThan(0);
  });
});
