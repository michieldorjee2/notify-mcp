# notify-mcp

A universal notification MCP server deployed on Vercel. Send adaptive cards to MS Teams (and more channels coming soon) via a single `send_notification` tool.

## Features

- **Template-driven**: Add new notification templates server-side without clients needing to rediscover tools
- **Channel-agnostic**: Starts with MS Teams, designed for easy expansion to email, Slack, etc.
- **Serverless**: Runs on Vercel with Streamable HTTP transport
- **Adaptive Card support**: Full Teams-compatible adaptive card rendering (spec v1.5)

## MCP Tools

### `send_notification`

Send a notification through a channel using a template.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | `"teams"` | Yes | Channel to send through |
| `webhook_url` | string (URL) | Yes | Webhook URL for the channel |
| `template` | string | No | Template name (default: `"simple-notification"`) |
| `variables` | object | Yes | Template-specific variables |

**Default template variables** (`simple-notification`):

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | Yes | Card title (max 200 chars) |
| `message` | string | Yes | Card body (max 2000 chars) |
| `facts` | `[{title, value}]` | No | Key-value fact table |
| `actionUrl` | string (URL) | No | Button link |
| `actionTitle` | string | No | Button label (default: "Open") |
| `severity` | `info\|success\|warning\|error` | No | Title color (default: "info") |

### `list_templates`

List all available templates with their descriptions and expected variables.

## Setup

### 1. MS Teams Webhook

Create an incoming webhook in your Teams channel:
- In Teams, go to the channel > Manage channel > Connectors > Incoming Webhook
- Or use Power Automate: create a flow with "When a Teams webhook request is received" trigger

### 2. Connect your MCP client

For Streamable HTTP clients (Claude Code, Cursor, etc.):

```json
{
  "mcpServers": {
    "notify": {
      "url": "https://your-deployment.vercel.app/api/mcp"
    }
  }
}
```

## Development

```bash
npm install
npm run dev     # Start dev server on :3000
npm test        # Run tests
npm run build   # Production build
```

## Adding Templates

1. Create `lib/templates/my-template.ts` implementing `NotificationTemplate`
2. Import and register it in `lib/templates/index.ts`
3. Deploy. Clients use it via `template: "my-template"` — no tool rediscovery needed.

## Adding Channels

1. Add the channel name to `CHANNELS` in `lib/types.ts`
2. Add a `ChannelConfig` variant
3. Create `lib/channels/my-channel.ts` implementing `NotificationChannel`
4. Register in `lib/channels/index.ts`
5. Deploy. Clients see the new channel on next tool discovery.

## Architecture

```
app/api/[transport]/route.ts  ─── MCP handler (mcp-handler)
                                     │
                              lib/tools/send-notification.ts
                                     │
                    ┌────────────────┼────────────────┐
              lib/templates/     lib/channels/
              (render card)      (deliver card)
```
