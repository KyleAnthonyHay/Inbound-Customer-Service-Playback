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

const clip = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + "…" : s;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

http.route({
  path: "/vapi/tools",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.VAPI_TOOL_SECRET;
    if (secret && request.headers.get("x-demo-secret") !== secret) return json({ error: "unauthorized" }, 401);

    const body = (await request.json().catch(() => ({}))) as { message?: { type?: string; toolCallList?: ToolCall[]; call?: { id?: string } } };
    const msg = body.message;
    if (!msg || msg.type !== "tool-calls" || !Array.isArray(msg.toolCallList)) return json({ results: [] });
    const callId = msg.call?.id ?? "unknown";

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
        await ctx.runMutation(api.callEvents.log, { callId, kind: "tool-start", tool: name, toolCallId: tc.id, label: def.label, status: "running", source: def.source, args: clip(args, 800) });
        try {
          const out = await def.run(args, ctx, callId);
          const durationMs = Date.now() - started;
          const ok = !(out && typeof out === "object" && "ok" in out && (out as { ok: unknown }).ok === false);
          await ctx.runMutation(api.callEvents.log, {
            callId, kind: "tool-end", tool: name, toolCallId: tc.id, label: def.label,
            status: ok ? "succeeded" : "failed", durationMs, source: def.source, detail: summarize(out), args: clip(args, 800), output: clip(out, 2000),
          });
          return { toolCallId: tc.id, result: JSON.stringify(out) };
        } catch (e) {
          const message = e instanceof Error ? e.message : "tool failed";
          await ctx.runMutation(api.callEvents.log, { callId, kind: "tool-end", tool: name, toolCallId: tc.id, label: def.label, status: "failed", durationMs: Date.now() - started, source: def.source, detail: message, args: clip(args, 800) });
          return { toolCallId: tc.id, error: message };
        }
      })
    );
    return json({ results });
  }),
});

/**
 * Assistant-level server messages (status-update, final transcript lines, end-of-call-report),
 * configured in buildAssistant() via server.url + serverMessages. Feeds the "Past calls" history.
 */
type ServerMessage = {
  type?: string;
  status?: string;
  endedReason?: string;
  role?: "user" | "assistant" | "system";
  transcriptType?: string;
  transcript?: string;
  call?: { id?: string; type?: string; startedAt?: string };
  analysis?: { summary?: string };
  summary?: string;
  artifact?: { messages?: Array<{ role?: string; message?: string; time?: number; secondsFromStart?: number }> };
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
};

http.route({
  path: "/vapi/events",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.VAPI_TOOL_SECRET;
    if (secret && request.headers.get("x-demo-secret") !== secret) return json({ error: "unauthorized" }, 401);
    const body = (await request.json().catch(() => ({}))) as { message?: ServerMessage };
    const m = body.message;
    const callId = m?.call?.id;
    if (!m || !callId) return json({ ok: true });
    console.log(`vapi event ${m.type} call=${callId}` + (m.type === "end-of-call-report" ? ` keys=${Object.keys(m).join(",")} msgs=${m.artifact?.messages?.length ?? 0}` : ""));
    switch (m.type) {
      case "status-update":
        await ctx.runMutation(api.calls.statusUpdate, { callId, status: m.status ?? "", callType: m.call?.type, endedReason: m.endedReason, startedAt: m.call?.startedAt });
        break;
      case "transcript":
        if (m.transcriptType === "final" && (m.role === "user" || m.role === "assistant") && m.transcript)
          await ctx.runMutation(api.calls.appendTranscript, { callId, role: m.role, text: m.transcript, callType: m.call?.type });
        break;
      case "end-of-call-report":
        await ctx.runMutation(api.calls.endOfCallReport, {
          callId, callType: m.call?.type, endedReason: m.endedReason, summary: m.analysis?.summary ?? m.summary,
          durationSeconds: m.durationSeconds, startedAt: m.startedAt, endedAt: m.endedAt,
          // Fallback transcript from the report's artifact, used only if no live transcript lines were stored.
          messages: (m.artifact?.messages ?? [])
            .filter((x) => (x.role === "user" || x.role === "bot" || x.role === "assistant") && x.message)
            .map((x) => ({ role: x.role === "user" ? ("user" as const) : ("assistant" as const), text: x.message!, at: x.time ?? 0 })),
        });
        break;
    }
    return json({ ok: true });
  }),
});

export default http;
