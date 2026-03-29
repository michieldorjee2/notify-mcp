import {
  ActivityHandler,
  BotFrameworkAdapter,
  CardFactory,
  TurnContext,
} from "botbuilder";
import type { Activity, ConversationReference } from "botbuilder";
import { generatePIN, savePIN } from "@/lib/store";

// ── Shared adapter (singleton across warm invocations) ──────────────
export const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_APP_ID ?? "",
  appPassword: process.env.BOT_APP_PASSWORD ?? "",
});

adapter.onTurnError = async (context, error) => {
  console.error("[bot] unhandled error:", error);
  await context.sendActivity("Something went wrong. Please try again later.");
};

// ── Bot logic ───────────────────────────────────────────────────────
class NotifyBot extends ActivityHandler {
  constructor() {
    super();

    this.onMembersAdded(async (context, next) => {
      for (const member of context.activity.membersAdded ?? []) {
        // Only act when the bot itself is added, not other members
        if (member.id === context.activity.recipient.id) {
          await this.handleBotInstalled(context);
        }
      }
      await next();
    });

    this.onMessage(async (context, next) => {
      const text = (context.activity.text ?? "").trim().toLowerCase();

      if (text === "regenerate" || text === "new pin") {
        await this.handleBotInstalled(context);
      } else {
        await context.sendActivity(
          'This bot sends notifications from connected tools. ' +
            'Type **regenerate** to get a new PIN.'
        );
      }
      await next();
    });
  }

  private async handleBotInstalled(context: TurnContext) {
    const reference = TurnContext.getConversationReference(
      context.activity as Activity
    ) as Partial<ConversationReference>;

    const pin = generatePIN();
    await savePIN(pin, reference as Record<string, unknown>);

    // Send welcome card with PIN
    const card = CardFactory.adaptiveCard({
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Notification Bot Connected",
          size: "large",
          weight: "bolder",
          color: "good",
        },
        {
          type: "TextBlock",
          text: "Use the PIN below when sending notifications to this conversation.",
          wrap: true,
        },
        {
          type: "TextBlock",
          text: pin,
          size: "extraLarge",
          weight: "bolder",
          horizontalAlignment: "center",
          fontType: "monospace",
        },
        {
          type: "TextBlock",
          text: "Type **regenerate** at any time to get a new PIN (the old one will stop working).",
          wrap: true,
          isSubtle: true,
          size: "small",
        },
      ],
    });

    await context.sendActivity({ attachments: [card] });
  }
}

export const bot = new NotifyBot();
