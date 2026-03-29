import { z } from "zod";

// ── Supported channels ──────────────────────────────────────────────
export const CHANNELS = ["teams"] as const;
export type Channel = (typeof CHANNELS)[number];

// ── Adaptive Card types (spec v1.5, Teams-compatible subset) ────────
export type AdaptiveCardTextColor =
  | "default"
  | "dark"
  | "light"
  | "accent"
  | "good"
  | "warning"
  | "attention";

export type AdaptiveCardTextSize =
  | "small"
  | "default"
  | "medium"
  | "large"
  | "extraLarge";

export type AdaptiveCardTextWeight = "lighter" | "default" | "bolder";

export interface AdaptiveCardTextBlock {
  type: "TextBlock";
  text: string;
  size?: AdaptiveCardTextSize;
  weight?: AdaptiveCardTextWeight;
  color?: AdaptiveCardTextColor;
  wrap?: boolean;
  isSubtle?: boolean;
  separator?: boolean;
}

export interface AdaptiveCardFact {
  title: string;
  value: string;
}

export interface AdaptiveCardFactSet {
  type: "FactSet";
  facts: AdaptiveCardFact[];
  separator?: boolean;
}

export interface AdaptiveCardImage {
  type: "Image";
  url: string;
  size?: "auto" | "stretch" | "small" | "medium" | "large";
  altText?: string;
  separator?: boolean;
}

export interface AdaptiveCardColumn {
  type: "Column";
  width?: string | number;
  items: AdaptiveCardElement[];
}

export interface AdaptiveCardColumnSet {
  type: "ColumnSet";
  columns: AdaptiveCardColumn[];
  separator?: boolean;
}

export interface AdaptiveCardContainer {
  type: "Container";
  items: AdaptiveCardElement[];
  separator?: boolean;
}

export type AdaptiveCardElement =
  | AdaptiveCardTextBlock
  | AdaptiveCardFactSet
  | AdaptiveCardImage
  | AdaptiveCardColumnSet
  | AdaptiveCardContainer;

export interface AdaptiveCardActionOpenUrl {
  type: "Action.OpenUrl";
  title: string;
  url: string;
}

export interface AdaptiveCardActionShowCard {
  type: "Action.ShowCard";
  title: string;
  card: AdaptiveCard;
}

export interface AdaptiveCardActionToggleVisibility {
  type: "Action.ToggleVisibility";
  title: string;
  targetElements: string[];
}

export type AdaptiveCardAction =
  | AdaptiveCardActionOpenUrl
  | AdaptiveCardActionShowCard
  | AdaptiveCardActionToggleVisibility;

export interface AdaptiveCard {
  $schema: string;
  type: "AdaptiveCard";
  version: string;
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

// ── Template system ─────────────────────────────────────────────────
export interface RenderedCard {
  adaptiveCard: AdaptiveCard;
}

export interface TemplateVariableInfo {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface NotificationTemplate<TVars = unknown> {
  name: string;
  description: string;
  supportedChannels: Channel[];
  variablesSchema: z.ZodType<TVars>;
  variablesInfo: TemplateVariableInfo[];
  render(variables: TVars): RenderedCard;
}

// ── Channel system ──────────────────────────────────────────────────
export interface SendResult {
  success: boolean;
  channel: Channel;
  error?: string;
  statusCode?: number;
}

export interface TeamsChannelConfig {
  channel: "teams";
  pin?: string;
  webhookUrl?: string;
}

// Add more channel configs here as discriminated union members
export type ChannelConfig = TeamsChannelConfig;

export interface NotificationChannel {
  name: Channel;
  send(card: RenderedCard, config: ChannelConfig): Promise<SendResult>;
}
