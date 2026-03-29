import { json, cors } from "@/lib/auth";

/**
 * Fake OAuth2 token endpoint.
 * Accepts any authorization code or refresh token and returns an access token.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const grantType = params.get("grant_type");

  if (grantType !== "authorization_code" && grantType !== "refresh_token") {
    return json({ error: "unsupported_grant_type" }, 400);
  }

  const accessToken =
    "notify_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);

  const refreshToken =
    "notify_refresh_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);

  return json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 86400,
    refresh_token: refreshToken,
    scope: "notify",
  });
}

export { cors as OPTIONS };
