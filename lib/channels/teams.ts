import type {
  NotificationChannel,
  RenderedCard,
  ChannelConfig,
  SendResult,
} from "@/lib/types";
import { getWebhookUrl } from "@/lib/store";

const MAX_PAYLOAD_BYTES = 28 * 1024; // 28KB Teams limit

function buildTeamsPayload(card: RenderedCard): string {
  return JSON.stringify({
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card.adaptiveCard,
      },
    ],
  });
}

export const teamsChannel: NotificationChannel = {
  name: "teams",

  async send(card: RenderedCard, config: ChannelConfig): Promise<SendResult> {
    if (config.channel !== "teams") {
      return {
        success: false,
        channel: "teams",
        error: "Invalid channel config for Teams",
      };
    }

    // Resolve webhook URL: either directly provided or looked up via PIN
    let webhookUrl: string;
    if ("webhookUrl" in config && config.webhookUrl) {
      webhookUrl = config.webhookUrl;
    } else if ("pin" in config && config.pin) {
      const url = await getWebhookUrl(config.pin);
      if (!url) {
        return {
          success: false,
          channel: "teams",
          error: `PIN "${config.pin}" not found. Use register_webhook to register a webhook URL first.`,
        };
      }
      webhookUrl = url;
    } else {
      return {
        success: false,
        channel: "teams",
        error: "Either pin or webhook_url is required",
      };
    }

    const body = buildTeamsPayload(card);

    // Pre-flight size check
    const byteLength = new TextEncoder().encode(body).length;
    if (byteLength > MAX_PAYLOAD_BYTES) {
      return {
        success: false,
        channel: "teams",
        error: `Payload size ${byteLength} bytes exceeds Teams limit of ${MAX_PAYLOAD_BYTES} bytes`,
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const responseText = await response.text();

      if (!response.ok) {
        return {
          success: false,
          channel: "teams",
          error: `Teams webhook returned HTTP ${response.status}: ${responseText}`,
          statusCode: response.status,
        };
      }

      if (responseText.includes("429")) {
        return {
          success: false,
          channel: "teams",
          error: "Teams webhook rate limited (429)",
          statusCode: 429,
        };
      }

      return { success: true, channel: "teams", statusCode: response.status };
    } catch (err) {
      return {
        success: false,
        channel: "teams",
        error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
