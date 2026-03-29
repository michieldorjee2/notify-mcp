import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSendNotification } from "@/lib/tools/send-notification";
import { handleListTemplates } from "@/lib/tools/list-templates";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("send_notification tool", () => {
  it("returns success for valid notification", async () => {
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
    expect(result.content[0].text).toContain("teams");
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
    expect(result.content[0].text).toContain("message");
  });

  it("falls back to default template for unknown template name", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1", { status: 200 })
    );

    const result = await handleSendNotification({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
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

  it("returns error when channel send fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    const result = await handleSendNotification({
      channel: "teams",
      webhook_url: "https://webhook.example.com/test",
      template: "simple-notification",
      variables: {
        title: "Test",
        message: "Will fail",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to send");
  });

  it("sends correct adaptive card payload to Teams", async () => {
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
    expect(card.body[0].text).toBe("Alert");
    expect(card.body[0].color).toBe("warning");
    expect(card.body[2].type).toBe("FactSet");
    expect(card.actions[0]).toMatchObject({
      type: "Action.OpenUrl",
      title: "View Dashboard",
      url: "https://dashboard.example.com",
    });
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
