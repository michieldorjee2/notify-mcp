import { z } from "zod";
import type {
  NotificationTemplate,
  RenderedCard,
  AdaptiveCardElement,
  AdaptiveCardAction,
  AdaptiveCardTextColor,
} from "@/lib/types";

const severityColorMap: Record<string, AdaptiveCardTextColor> = {
  info: "default",
  success: "good",
  warning: "warning",
  error: "attention",
};

export const variablesSchema = z.object({
  title: z.string().max(200).describe("Card title"),
  message: z.string().max(2000).describe("Card body message"),
  facts: z
    .array(
      z.object({
        title: z.string(),
        value: z.string(),
      })
    )
    .optional()
    .describe("Key-value pairs displayed as a fact table"),
  actionUrl: z.string().url().optional().describe("Button link URL"),
  actionTitle: z
    .string()
    .optional()
    .describe('Button label (defaults to "Open")'),
  severity: z
    .enum(["info", "success", "warning", "error"])
    .optional()
    .describe('Controls title color (defaults to "info")'),
});

export type SimpleNotificationVars = z.infer<typeof variablesSchema>;

function render(variables: SimpleNotificationVars): RenderedCard {
  const severity = variables.severity ?? "info";

  const body: AdaptiveCardElement[] = [
    {
      type: "TextBlock",
      text: variables.title,
      size: "large",
      weight: "bolder",
      color: severityColorMap[severity],
      wrap: true,
    },
    {
      type: "TextBlock",
      text: variables.message,
      wrap: true,
    },
  ];

  if (variables.facts && variables.facts.length > 0) {
    body.push({
      type: "FactSet",
      facts: variables.facts.map((f) => ({
        title: f.title,
        value: f.value,
      })),
      separator: true,
    });
  }

  const actions: AdaptiveCardAction[] = [];
  if (variables.actionUrl) {
    actions.push({
      type: "Action.OpenUrl",
      title: variables.actionTitle ?? "Open",
      url: variables.actionUrl,
    });
  }

  return {
    adaptiveCard: {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      fallbackText: `${variables.title}: ${variables.message}`,
      body,
      ...(actions.length > 0 ? { actions } : {}),
    },
  };
}

export const simpleNotification: NotificationTemplate<SimpleNotificationVars> =
  {
    name: "simple-notification",
    description:
      "A simple notification card with title, message, optional facts, and an optional action button.",
    supportedChannels: ["teams"],
    variablesSchema,
    variablesInfo: [
      { name: "title", type: "string", required: true, description: "Card title (max 200 chars)" },
      { name: "message", type: "string", required: true, description: "Card body message (max 2000 chars)" },
      {
        name: "facts",
        type: "array of {title, value}",
        required: false,
        description: "Key-value pairs displayed as a fact table",
      },
      { name: "actionUrl", type: "string (URL)", required: false, description: "Button link URL" },
      { name: "actionTitle", type: "string", required: false, description: 'Button label (defaults to "Open")' },
      {
        name: "severity",
        type: '"info" | "success" | "warning" | "error"',
        required: false,
        description: 'Controls title color (defaults to "info")',
      },
    ],
    render,
  };
