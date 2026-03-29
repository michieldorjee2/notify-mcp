import { headers } from "next/headers";

/**
 * Resolves the base URL for OAuth endpoints.
 * Uses x-forwarded-host/proto headers (set by Vercel) for production,
 * falls back to localhost for dev.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function cors(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Verify a bearer token. Accepts any token that was issued by our
 * fake token endpoint (prefix "notify_"). In a real implementation
 * you'd validate a JWT signature here.
 */
export function isValidToken(token?: string): boolean {
  return typeof token === "string" && token.startsWith("notify_");
}
