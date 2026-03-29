import { NextRequest } from "next/server";

/**
 * Fake OAuth2 authorization endpoint.
 * Immediately redirects back with an authorization code — no login screen.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");

  if (!redirectUri) {
    return new Response("Missing redirect_uri", { status: 400 });
  }

  // Generate a one-time authorization code
  const code =
    "notify_code_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);

  const callback = new URL(redirectUri);
  callback.searchParams.set("code", code);
  if (state) callback.searchParams.set("state", state);

  return Response.redirect(callback.toString(), 302);
}
