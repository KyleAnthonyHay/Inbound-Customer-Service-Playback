/** Temporary authenticated text-only proxy: local release code, other tools on development.
 * Tunnel this loopback listener explicitly; use a fresh TEXT_POC_TOOL_SECRET, never the saved webhook secret.
 */
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { getRelevantChangesSinceVersion } from "../src/lib/tools/releases";
import { getCurrentPlaybackAppInfo } from "../src/lib/tools/apple";

const incomingSecret = process.env.TEXT_POC_TOOL_SECRET;
const backendSecret = process.env.VAPI_TOOL_SECRET;
const backend = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
if (!incomingSecret || !backendSecret || incomingSecret === backendSecret || backend !== "https://ceaseless-rhinoceros-106.convex.site" || process.env.CONVEX_DEPLOYMENT !== "dev:ceaseless-rhinoceros-106")
  throw Error("Requires development target and a separate temporary text-only secret.");

const forwardable = new Set(["search_playback_docs", "get_planning_center_service_context", "lookup_demo_customer", "check_team_availability", "get_callback_slots", "initiate_handoff"]);
type ToolCall = { id: string; function?: { name?: string; arguments?: unknown }; name?: string; arguments?: unknown };
const str = (value: unknown) => typeof value === "string" ? value : undefined;
function argsOf(call: ToolCall): Record<string, unknown> {
  const value = call.function?.arguments ?? call.arguments;
  return (typeof value === "string" ? JSON.parse(value) : value) as Record<string, unknown> ?? {};
}

const server = createServer(async (request, response) => {
  const send = (status: number, body: unknown) => { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(body)); };
  try {
    const supplied = Buffer.from(String(request.headers["x-demo-secret"] ?? ""));
    const expected = Buffer.from(incomingSecret);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return send(401, { error: "unauthorized" });
    const url = new URL(request.url ?? "", "http://127.0.0.1");
    const testId = url.searchParams.get("textTestId");
    if (request.method !== "POST" || url.pathname !== "/vapi/tools" || !testId || !/^text-poc-[a-z0-9-]{1,80}$/.test(testId)) return send(400, { error: "text test request required" });
    let raw = "";
    for await (const chunk of request) { raw += chunk.toString(); if (raw.length > 128000) return send(413, { error: "request too large" }); }
    const body = JSON.parse(raw) as { message?: { type?: string; call?: { id?: string }; toolCallList?: ToolCall[] } };
    const message = body.message;
    if (message?.type !== "tool-calls" || message.call?.id || !Array.isArray(message.toolCallList) || message.toolCallList.length > 12) return send(400, { error: "text tool calls only; voice calls refused" });
    const results = await Promise.all(message.toolCallList.map(async call => {
      const name = call.function?.name ?? call.name ?? "";
      if (name === "get_relevant_changes_since_version") {
        const a = argsOf(call);
        return { toolCallId: call.id, result: JSON.stringify(await getRelevantChangesSinceVersion({ installedVersion: str(a.installedVersion) ?? "", symptom: str(a.symptom), platform: str(a.platform), osVersion: str(a.osVersion) })) };
      }
      if (name === "get_current_playback_app_info") return { toolCallId: call.id, result: JSON.stringify(await getCurrentPlaybackAppInfo()) };
      if (!forwardable.has(name)) return { toolCallId: call.id, error: "Tool disabled in local text verification; no reservations or voice actions allowed." };
      const result = await fetch(`${backend}/vapi/tools?textTestId=${testId}`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(20000),
        headers: { "content-type": "application/json", "x-demo-secret": backendSecret },
        body: JSON.stringify({ message: { ...message, toolCallList: [call] } }),
      });
      if (!result.ok) return { toolCallId: call.id, error: `Development tool returned HTTP ${result.status}` };
      const parsed = await result.json() as { results?: Array<{ toolCallId: string; result?: string; error?: string }> };
      return parsed.results?.[0] ?? { toolCallId: call.id, error: "Incomplete development tool result" };
    }));
    send(200, { results });
  } catch { send(500, { error: "Local text tool request failed; no response or credential details logged." }); }
});
server.listen(8787, "127.0.0.1", () => console.log("Local text-only tool listener ready. Release code runs locally; saved agents/backends are untouched."));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => server.close(() => process.exit(0)));
