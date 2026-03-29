import { z } from "zod";
import { CHANNELS } from "@/lib/types";
import { generatePIN, savePIN } from "@/lib/store";

export const registerWebhookSchema = {
  channel: z
    .enum(CHANNELS)
    .describe("Channel this webhook belongs to (e.g. 'teams')"),
  webhook_url: z
    .string()
    .url()
    .describe(
      "The webhook URL to register (e.g. a Power Automate Workflow URL for Teams)"
    ),
};

export async function handleRegisterWebhook(input: {
  channel: (typeof CHANNELS)[number];
  webhook_url: string;
}) {
  const pin = generatePIN();

  try {
    await savePIN(pin, input.webhook_url);
  } catch (err) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to store webhook: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Webhook registered for ${input.channel}. Your PIN is: ${pin}\n\nUse this PIN with send_notification instead of the full webhook URL. Keep it safe — anyone with the PIN can send notifications to this channel.`,
      },
    ],
  };
}
