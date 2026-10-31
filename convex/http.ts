import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { tools, summarize } from "./vapiTools";

/**
 * Vapi tool webhook, served straight from the Convex deployment at
 *   {CONVEX_SITE_URL}/vapi/tools
 * so no app deploy or tunnel is needed in development. Vapi POSTs
 * { message: { type: "tool-calls", toolCallList, call } } and expects
 * { results: [{ toolCallId, result | error }] } with HTTP 200.
 */
const http = httpRouter();

type ToolCall = { id: string; function?: { name?: string; arguments?: unknown }; name?: string; arguments?: unknown };

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

http.route({
  path: "/vapi/tools",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.VAPI_TOOL_SECRET;
    if (secret && request.headers.get("x-demo-secret") !== secret) return json({ error: "unauthorized" }, 401);

    const body = (await request.json().catch(() => ({}))) as { message?: { type?: string; toolCallList?: ToolCall[]; call?: { id?: string; customer?: { number?: string } } } };
    const msg = body.message;
    if (!msg || msg.type !== "tool-calls" || !Array.isArray(msg.toolCallList)) return json({ results: [] });
    const callId = msg.call?.id ?? "unknown";
    // Phone calls carry the caller's number (caller ID); browser calls do not.
    const callerNumber = msg.call?.customer?.number || undefined;

    const results = await Promise.all(
      msg.toolCallList.map(async (tc) => {
        const name = tc.function?.name ?? tc.name ?? "";
        const args = parseArgs(tc.function?.arguments ?? tc.arguments);
        const def = tools[name];
        if (!def) {
          await ctx.runMutation(api.callEvents.log, { callId, kind: "note", label: `Unknown tool: ${name}`, status: "failed", source: "internal", toolCallId: tc.id });
          return { toolCallId: tc.id, error: `Unknown tool ${name}` };
        }
        const started = Date.now();
        await ctx.runMutation(api.callEvents.log, { callId, kind: "tool-start", tool: name, toolCallId: tc.id, label: def.label, status: "running", source: def.source });
        try {
          const out = await def.run(args, ctx, { callId, callerNumber });
          const durationMs = Date.now() - started;
          const ok = !(out && typeof out === "object" && "ok" in out && (out as { ok: unknown }).ok === false);
          await ctx.runMutation(api.callEvents.log, {
            callId, kind: "tool-end", tool: name, toolCallId: tc.id, label: def.label,
            status: ok ? "succeeded" : "failed", durationMs, source: def.source, detail: summarize(out),
          });
          return { toolCallId: tc.id, result: JSON.stringify(out) };
        } catch (e) {
          const message = e instanceof Error ? e.message : "tool failed";
          await ctx.runMutation(api.callEvents.log, { callId, kind: "tool-end", tool: name, toolCallId: tc.id, label: def.label, status: "failed", durationMs: Date.now() - started, source: def.source, detail: message });
          return { toolCallId: tc.id, error: message };
        }
      })
    );
    return json({ results });
  }),
});

export default http;
