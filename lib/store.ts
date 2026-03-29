import { kv } from "@vercel/kv";
import crypto from "crypto";

const PIN_PREFIX = "pin:";

/**
 * Generate a cryptographically random 6-character alphanumeric PIN.
 * Uppercase for readability.
 */
export function generatePIN(): string {
  return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

/**
 * Store a webhook URL keyed by PIN. No TTL — persists until deleted.
 */
export async function savePIN(pin: string, webhookUrl: string): Promise<void> {
  await kv.set(`${PIN_PREFIX}${pin}`, webhookUrl);
}

/**
 * Retrieve a webhook URL by PIN.
 */
export async function getWebhookUrl(pin: string): Promise<string | null> {
  return kv.get<string>(`${PIN_PREFIX}${pin}`);
}

/**
 * Delete a PIN.
 */
export async function deletePIN(pin: string): Promise<void> {
  await kv.del(`${PIN_PREFIX}${pin}`);
}
