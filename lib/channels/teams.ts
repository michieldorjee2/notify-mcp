import type {
  NotificationChannel,
  RenderedCard,
  ChannelConfig,
  SendResult,
} from "@/lib/types";
import type { ConversationReference } from "botbuilder";
import { adapter } from "@/lib/bot";
import { getReference } from "@/lib/store";

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

    // Look up ConversationReference by PIN
    const reference = await getReference(config.pin);
    if (!reference) {
      return {
        success: false,
        channel: "teams",
        error: `PIN "${config.pin}" not found. Install the bot in Teams first to get a PIN.`,
      };
    }

    try {
      await adapter.continueConversation(
        reference as Partial<ConversationReference>,
        async (context) => {
          await context.sendActivity({
            attachments: [
              {
                contentType: "application/vnd.microsoft.card.adaptive",
                content: card.adaptiveCard,
              },
            ],
          });
        }
      );

      return { success: true, channel: "teams" };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      // Detect common errors
      if (message.includes("401") || message.includes("Unauthorized")) {
        return {
          success: false,
          channel: "teams",
          error: "Bot authentication failed. Check BOT_APP_ID and BOT_APP_PASSWORD.",
          statusCode: 401,
        };
      }

      if (message.includes("403") || message.includes("Forbidden")) {
        return {
          success: false,
          channel: "teams",
          error: "Bot was removed from the conversation. Ask the user to reinstall and get a new PIN.",
          statusCode: 403,
        };
      }

      return {
        success: false,
        channel: "teams",
        error: `Proactive message failed: ${message}`,
      };
    }
  },
};
