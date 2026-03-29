import { adapter, bot } from "@/lib/bot";

/**
 * Teams Bot messaging endpoint.
 * Azure Bot Service sends all activities (messages, installs, etc.) here.
 * Configure this as the endpoint in your Azure Bot registration:
 *   https://notify-mcp.vercel.app/api/messages
 */
export async function POST(req: Request) {
  const body = await req.json();

  // Bot Framework adapter expects a Node-style req/res.
  // We shim it with the minimal interface it needs.
  const shimReq = {
    body,
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
  };

  let responseStatus = 200;
  let responseBody = "";

  const shimRes = {
    status: (code: number) => {
      responseStatus = code;
      return shimRes;
    },
    send: (data: unknown) => {
      responseBody = typeof data === "string" ? data : JSON.stringify(data ?? "");
      return shimRes;
    },
    end: () => shimRes,
    setHeader: () => shimRes,
  };

  try {
    await adapter.processActivity(
      shimReq as never,
      shimRes as never,
      async (context) => {
        await bot.run(context);
      }
    );
  } catch (err) {
    console.error("[messages] adapter error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response(responseBody || null, { status: responseStatus });
}
