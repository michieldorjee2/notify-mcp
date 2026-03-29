import { z } from "zod";
import { CHANNELS } from "@/lib/types";
import { getTemplate, hasTemplate } from "@/lib/templates";
import { sendToChannel } from "@/lib/channels";

export const sendNotificationSchema = {
  channel: z
    .enum(CHANNELS)
    .describe("Notification channel to send through (e.g. 'teams')"),
  pin: z
    .string()
    .min(1)
    .optional()
    .describe(
      "PIN from register_webhook. Use this OR webhook_url — not both."
    ),
  webhook_url: z
    .string()
    .url()
    .optional()
    .describe(
      "Direct webhook URL (Power Automate Workflow URL). Use this OR pin — not both."
    ),
  template: z
    .string()
    .default("simple-notification")
    .describe(
      'Template name to use. Defaults to "simple-notification". Use list_templates tool to see available templates and their variables.'
    ),
  variables: z
    .record(z.string(), z.unknown())
    .describe(
      "Template variables as key-value pairs. For the default simple-notification template: title (required string), message (required string), facts (optional array of {title, value}), actionUrl (optional URL), actionTitle (optional string), severity (optional: info|success|warning|error)"
    ),
};

export async function handleSendNotification(input: {
  channel: (typeof CHANNELS)[number];
  pin?: string;
  webhook_url?: string;
  template: string;
  variables: Record<string, unknown>;
}) {
  if (!input.pin && !input.webhook_url) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Either pin or webhook_url is required. Use register_webhook to store a URL and get a PIN, or pass webhook_url directly.",
        },
      ],
      isError: true,
    };
  }

  const template = getTemplate(input.template);
  const usedFallback = !hasTemplate(input.template);

  // Validate variables against the template's own schema
  const parsed = template.variablesSchema.safeParse(input.variables);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return {
      content: [
        {
          type: "text" as const,
          text: `Validation error for template "${template.name}": ${issues}`,
        },
      ],
      isError: true,
    };
  }

  // Check template supports the requested channel
  if (!template.supportedChannels.includes(input.channel)) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Template "${template.name}" does not support channel "${input.channel}". Supported: ${template.supportedChannels.join(", ")}`,
        },
      ],
      isError: true,
    };
  }

  // Render the card
  const card = template.render(parsed.data);

  // Send via channel
  const result = await sendToChannel(input.channel, card, {
    channel: input.channel,
    pin: input.pin,
    webhookUrl: input.webhook_url,
  } as never);

  if (!result.success) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to send notification via ${result.channel}: ${result.error}`,
        },
      ],
      isError: true,
    };
  }

  const fallbackNote = usedFallback
    ? ` (template "${input.template}" not found, used fallback "${template.name}")`
    : "";

  return {
    content: [
      {
        type: "text" as const,
        text: `Notification sent successfully via ${result.channel} using template "${template.name}"${fallbackNote}`,
      },
    ],
  };
}
