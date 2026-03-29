import type { Channel, NotificationChannel, RenderedCard, ChannelConfig, SendResult } from "@/lib/types";
import { teamsChannel } from "./teams";

const registry = new Map<Channel, NotificationChannel>();

function register(channel: NotificationChannel) {
  registry.set(channel.name, channel);
}

// Register built-in channels
register(teamsChannel);

export function getChannel(name: Channel): NotificationChannel | undefined {
  return registry.get(name);
}

export async function sendToChannel(
  channelName: Channel,
  card: RenderedCard,
  config: ChannelConfig
): Promise<SendResult> {
  const channel = getChannel(channelName);
  if (!channel) {
    return {
      success: false,
      channel: channelName,
      error: `Unknown channel: ${channelName}`,
    };
  }
  return channel.send(card, config);
}
