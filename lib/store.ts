import { kv } from "@vercel/kv";
import crypto from "crypto";

const PIN_PREFIX = "pin:";

/**
 * Generate a cryptographically random 6-character alphanumeric PIN.
 * Uses uppercase for readability when shared verbally.
 */
export function generatePIN(): string {
  return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

/**
 * Store a ConversationReference keyed by PIN. No TTL — PINs persist
 * until explicitly deleted or the bot is removed from the conversation.
 */
export async function savePIN(
  pin: string,
  reference: Record<string, unknown>
): Promise<void> {
  await kv.set(`${PIN_PREFIX}${pin}`, JSON.stringify(reference));
}

/**
 * Retrieve a ConversationReference by PIN.
 * Returns null if the PIN doesn't exist.
 */
export async function getReference(
  pin: string
): Promise<Record<string, unknown> | null> {
  const data = await kv.get<string>(`${PIN_PREFIX}${pin}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

/**
 * Delete a PIN (e.g. when bot is removed from conversation).
 */
export async function deletePIN(pin: string): Promise<void> {
  await kv.del(`${PIN_PREFIX}${pin}`);
}
