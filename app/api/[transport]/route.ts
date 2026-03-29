import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  sendNotificationSchema,
  handleSendNotification,
} from "@/lib/tools/send-notification";
import { handleListTemplates } from "@/lib/tools/list-templates";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "send_notification",
      "Send a notification through a configured channel (e.g. MS Teams). Uses adaptive card templates that can be customized server-side. Use list_templates to discover available templates and their variables.",
      sendNotificationSchema,
      async (input) => handleSendNotification(input)
    );

    server.tool(
      "list_templates",
      "List all available notification templates with their descriptions, supported channels, and expected variables.",
      {},
      async () => handleListTemplates()
    );
  },
  {
    capabilities: {
      tools: {},
    },
  },
  {
    basePath: "/api",
    maxDuration: 30,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
