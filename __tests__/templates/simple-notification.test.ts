import { describe, it, expect } from "vitest";
import {
  simpleNotification,
  variablesSchema,
} from "@/lib/templates/simple-notification";

describe("simple-notification template", () => {
  it("renders a basic card with title and message", () => {
    const result = simpleNotification.render({
      title: "Test Title",
      message: "Test message body",
    });

    const card = result.adaptiveCard;
    expect(card.type).toBe("AdaptiveCard");
    expect(card.version).toBe("1.4");
    expect(card.body).toHaveLength(2);
    expect(card.body[0]).toMatchObject({
      type: "TextBlock",
      text: "Test Title",
      size: "large",
      weight: "bolder",
    });
    expect(card.body[1]).toMatchObject({
      type: "TextBlock",
      text: "Test message body",
      wrap: true,
    });
    expect(card.actions).toBeUndefined();
  });

  it("includes FactSet when facts are provided", () => {
    const result = simpleNotification.render({
      title: "Title",
      message: "Msg",
      facts: [
        { title: "Status", value: "Active" },
        { title: "Priority", value: "High" },
      ],
    });

    expect(result.adaptiveCard.body).toHaveLength(3);
    const factSet = result.adaptiveCard.body[2];
    expect(factSet.type).toBe("FactSet");
    if (factSet.type === "FactSet") {
      expect(factSet.facts).toHaveLength(2);
      expect(factSet.facts[0]).toEqual({ title: "Status", value: "Active" });
    }
  });

  it("includes Action.OpenUrl when actionUrl is provided", () => {
    const result = simpleNotification.render({
      title: "Title",
      message: "Msg",
      actionUrl: "https://example.com",
    });

    expect(result.adaptiveCard.actions).toHaveLength(1);
    expect(result.adaptiveCard.actions![0]).toMatchObject({
      type: "Action.OpenUrl",
      title: "Open",
      url: "https://example.com",
    });
  });

  it("uses custom action title", () => {
    const result = simpleNotification.render({
      title: "Title",
      message: "Msg",
      actionUrl: "https://example.com",
      actionTitle: "View Details",
    });

    expect(result.adaptiveCard.actions![0]).toMatchObject({
      title: "View Details",
    });
  });

  it.each([
    ["info", "default"],
    ["success", "good"],
    ["warning", "warning"],
    ["error", "attention"],
  ] as const)("maps severity '%s' to color '%s'", (severity, expectedColor) => {
    const result = simpleNotification.render({
      title: "Title",
      message: "Msg",
      severity,
    });

    const titleBlock = result.adaptiveCard.body[0];
    if (titleBlock.type === "TextBlock") {
      expect(titleBlock.color).toBe(expectedColor);
    }
  });

  it("defaults severity to info (default color)", () => {
    const result = simpleNotification.render({
      title: "Title",
      message: "Msg",
    });

    const titleBlock = result.adaptiveCard.body[0];
    if (titleBlock.type === "TextBlock") {
      expect(titleBlock.color).toBe("default");
    }
  });

  describe("schema validation", () => {
    it("accepts valid minimal input", () => {
      const result = variablesSchema.safeParse({
        title: "Hello",
        message: "World",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      const result = variablesSchema.safeParse({ message: "World" });
      expect(result.success).toBe(false);
    });

    it("rejects missing message", () => {
      const result = variablesSchema.safeParse({ title: "Hello" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid actionUrl", () => {
      const result = variablesSchema.safeParse({
        title: "Hello",
        message: "World",
        actionUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("accepts full input", () => {
      const result = variablesSchema.safeParse({
        title: "Hello",
        message: "World",
        facts: [{ title: "k", value: "v" }],
        actionUrl: "https://example.com",
        actionTitle: "Go",
        severity: "error",
      });
      expect(result.success).toBe(true);
    });
  });
});
