import { getBaseUrl, json, cors } from "@/lib/auth";

export async function GET() {
  const base = await getBaseUrl();

  return json({
    resource: `${base}/api/mcp`,
    authorization_servers: [`${base}/auth`],
    scopes_supported: ["notify"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${base}`,
  });
}

export { cors as OPTIONS };
