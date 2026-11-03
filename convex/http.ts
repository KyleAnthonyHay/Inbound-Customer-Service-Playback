import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { DEV_SITE, startDevCall } from "./lib/callAdmission";
import { tools, summarize } from "./vapiTools";
import { callInfoOf } from "../src/lib/tools/callerId";

/**
 * Vapi tool webhook, served straight from the Convex deployment at
 *   {CONVEX_SITE_URL}/vapi/tools
 * so no app deploy or tunnel is needed in development. Vapi POSTs
 * { message: { type: "tool-calls", toolCallList, call } } and expects
 * { results: [{ toolCallId, result | error }] } with HTTP 200.
 */
const http = httpRouter();

// The SDK's apiBaseUrl points here only for the known development backend.
// Production keeps its existing direct Vapi path.
for (const [path, transport] of [["/dev-call/call/web", "browser"], ["/dev-call/websocket", "websocket"]] as const) {
  http.route({ path, method: "OPTIONS", handler: httpAction(async () => new Response(null, {
    status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type, x-demo-secret", "Access-Control-Max-Age": "600" },
  })) });
  http.route({ path, method: "POST", handler: httpAction(async (ctx, request) => {
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", "Retry-After": "30" };
    if (process.env.CONVEX_SITE_URL !== DEV_SITE) return new Response(JSON.stringify({ message: "Development calls only" }), { status: 404, headers });
    // Browser auth has the same public-key security boundary as Vapi's web SDK.
    const authorized = transport === "browser"
      ? !!process.env.VAPI_PUBLIC_KEY && request.headers.get("authorization") === `Bearer ${process.env.VAPI_PUBLIC_KEY}`
      : !!process.env.VAPI_TOOL_SECRET && request.headers.get("x-demo-secret") === process.env.VAPI_TOOL_SECRET;
    if (!authorized) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers });
    const result = await startDevCall(transport, {
      env: process.env,
      reserve: token => ctx.runMutation(internal.callAdmission.reserve, { token }),
      update: args => ctx.runMutation(internal.callAdmission.update, args),
    });
    return new Response(JSON.stringify(result.body), { status: result.status, headers });
  }) });
}

type CallFields = { id?: string; type?: string; startedAt?: string; customer?: { number?: string }; monitor?: { controlUrl?: string } };

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

    const body = (await request.json().catch(() => ({}))) as { message?: { type?: string; toolCallList?: ToolCall[]; call?: CallFields } };
    const msg = body.message;
    if (!msg || msg.type !== "tool-calls" || !Array.isArray(msg.toolCallList)) return json({ results: [] });
    // Phone calls carry the caller's number (caller ID) on every webhook; browser calls do not.
    const call = callInfoOf(msg.call);
    // The text POC has no voice call object. Keep its logs/idempotency separate per test.
    const textTestId = new URL(request.url).searchParams.get("textTestId");
    if (!msg.call?.id && textTestId && /^text-poc-[a-z0-9-]{1,80}$/.test(textTestId)) call.callId = textTestId;
    const callId = call.callId;
    if (call.callerNumber) await ctx.runMutation(api.calls.touch, { callId, callType: call.callType, callerNumber: call.callerNumber });

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
          const out = await def.run(args, ctx, call);
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
  call?: CallFields;
  analysis?: { summary?: string };
  summary?: string;
  artifact?: { messages?: Array<{ role?: string; message?: string; time?: number; secondsFromStart?: number }> };
  /** conversation-update: the running message list (Vapi sends both shapes). */
  conversation?: Array<{ role?: string; content?: string }>;
  messages?: Array<{ role?: string; message?: string; content?: string; time?: number }>;
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
    const callerNumber = callInfoOf(m.call).callerNumber;
    console.log(`vapi event ${m.type} call=${callId}` + (m.type === "end-of-call-report" ? ` keys=${Object.keys(m).join(",")} msgs=${m.artifact?.messages?.length ?? 0}` : ""));
    switch (m.type) {
      case "status-update":
        await ctx.runMutation(api.calls.statusUpdate, { callId, status: m.status ?? "", callType: m.call?.type, endedReason: m.endedReason, startedAt: m.call?.startedAt, callerNumber });
        break;
      case "transcript":
        // Browser calls are mirrored by the web client itself (ActivityPanel), so skip server copies for them.
        if (m.call?.type === "webCall") break;
        if (m.transcriptType === "final" && (m.role === "user" || m.role === "assistant") && m.transcript)
          await ctx.runMutation(api.calls.appendTranscript, { callId, role: m.role, text: m.transcript, callType: m.call?.type });
        break;
      case "speech-update":
        await ctx.runMutation(api.calls.touch, { callId, callType: m.call?.type, callerNumber, role: m.role, speechStatus: m.status });
        break;
      case "conversation-update": {
        if (m.call?.type === "webCall") break;
        const src: Array<{ role?: string; text?: string; time?: number }> = m.messages?.length
          ? m.messages.map((x) => ({ role: x.role, text: x.message ?? x.content, time: x.time }))
          : (m.conversation ?? []).map((c) => ({ role: c.role, text: c.content }));
        const lines = src
          .filter((x) => (x.role === "user" || x.role === "bot" || x.role === "assistant") && x.text)
          .map((x) => ({ role: x.role === "user" ? ("user" as const) : ("assistant" as const), text: x.text!, at: x.time ?? 0 }));
        await ctx.runMutation(api.calls.syncConversation, { callId, callType: m.call?.type, messages: lines });
        break;
      }
      case "end-of-call-report":
        await ctx.runMutation(api.calls.endOfCallReport, {
          callId, callType: m.call?.type, callerNumber, endedReason: m.endedReason, summary: m.analysis?.summary ?? m.summary,
          durationSeconds: m.durationSeconds, startedAt: m.startedAt, endedAt: m.endedAt,
          // Fallback transcript from the report's artifact, used only if no live transcript lines were stored.
          messages: (m.artifact?.messages ?? [])
            .filter((x) => (x.role === "user" || x.role === "bot" || x.role === "assistant") && x.message)
            .map((x) => ({ role: x.role === "user" ? ("user" as const) : ("assistant" as const), text: x.message!, at: x.time ?? 0 })),
        });
        break;
    }
    if (process.env.CONVEX_SITE_URL === DEV_SITE && (m.type === "end-of-call-report" || (m.type === "status-update" && m.status === "ended")))
      await ctx.runMutation(internal.callAdmission.update, { callId, release: true });
    return json({ ok: true });
  }),
});

export default http;
