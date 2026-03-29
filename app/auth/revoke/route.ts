import { json, cors } from "@/lib/auth";

/**
 * Fake OAuth2 revocation endpoint. Always succeeds (RFC 7009).
 */
export async function POST() {
  return json({});
}

export { cors as OPTIONS };
