import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  sendNotificationSchema,
  handleSendNotification,
} from "@/lib/tools/send-notification";
import { handleListTemplates } from "@/lib/tools/list-templates";
import { isValidToken } from "@/lib/auth";

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

const verifyToken = async (
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!isValidToken(bearerToken)) return undefined;
  return {
    token: bearerToken!,
    scopes: ["notify"],
    clientId: "mcp-client",
  };
};

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
