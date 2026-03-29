import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

import { handleSendNotification } from "@/lib/tools/send-notification";
import { handleListTemplates } from "@/lib/tools/list-templates";
import { kv } from "@vercel/kv";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("send_notification tool", () => {
  it("returns success with direct webhook_url", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    const result = await handleSendNotification({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
      template: "simple-notification",
      variables: {
        title: "Deploy Complete",
        message: "v2.1.0 deployed to production",
      },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("successfully");
  });

  it("returns success with PIN", async () => {
    vi.mocked(kv.get).mockResolvedValue("https://webhook.example.com/stored");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    const result = await handleSendNotification({
      channel: "teams",
      pin: "ABC123",
      template: "simple-notification",
      variables: {
        title: "Deploy Complete",
        message: "v2.1.0 deployed",
      },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("successfully");
  });

  it("returns error when neither pin nor webhook_url provided", async () => {
    const result = await handleSendNotification({
      channel: "teams",
      template: "simple-notification",
      variables: { title: "Test", message: "Msg" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("pin or webhook_url is required");
  });

  it("returns validation error for missing required variables", async () => {
    const result = await handleSendNotification({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
      template: "simple-notification",
      variables: { title: "No message field" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Validation error");
  });

  it("falls back to default template for unknown template name", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    const result = await handleSendNotification({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
      template: "nonexistent-template",
      variables: { title: "Test", message: "Using fallback" },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("fallback");
  });

  it("sends correct adaptive card payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    await handleSendNotification({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
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

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    const card = body.attachments[0].content;
    expect(card.type).toBe("AdaptiveCard");
    expect(card.body[0].color).toBe("warning");
    expect(card.actions[0].title).toBe("View Dashboard");
  });
});

describe("list_templates tool", () => {
  it("returns available templates", async () => {
    const result = await handleListTemplates();
    const templates = JSON.parse(result.content[0].text);
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("simple-notification");
  });
});
