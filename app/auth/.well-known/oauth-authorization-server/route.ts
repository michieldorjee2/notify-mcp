import { getBaseUrl, json, cors } from "@/lib/auth";

export async function GET() {
  const base = await getBaseUrl();

  return json({
    issuer: `${base}/auth`,
    authorization_endpoint: `${base}/auth/authorize`,
    token_endpoint: `${base}/auth/token`,
    revocation_endpoint: `${base}/auth/revoke`,
    scopes_supported: ["notify"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    revocation_endpoint_auth_methods_supported: ["none"],
  });
}

export { cors as OPTIONS };
