import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../../../convex/_generated/api";
import { tools } from "@/lib/tools/registry";

type ToolCall = { id: string; type?: string; function?: { name?: string; arguments?: unknown }; name?: string; arguments?: unknown };
type VapiToolsBody = { message?: { type?: string; toolCallList?: ToolCall[]; call?: { id?: string } } };

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

export async function POST(req: NextRequest) {
  const secret = process.env.VAPI_TOOL_SECRET;
  if (secret && req.headers.get("x-demo-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as VapiToolsBody;
  const msg = body.message;
  if (!msg || msg.type !== "tool-calls" || !Array.isArray(msg.toolCallList)) {
    // Vapi expects 200; return an empty result set for unrelated server messages.
    return NextResponse.json({ results: [] });
  }

  const callId = msg.call?.id ?? "unknown";
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

  const log = async (e: FunctionArgs<typeof api.callEvents.log>) => {
    if (!convex) return;
    try {
      await convex.mutation(api.callEvents.log, e);
    } catch (err) {
      console.error("callEvents.log failed", err);
    }
  };

  const results = await Promise.all(
    msg.toolCallList.map(async (tc) => {
      const name = tc.function?.name ?? tc.name ?? "";
      const args = parseArgs(tc.function?.arguments ?? tc.arguments);
      const def = tools[name];
      if (!def) {
        await log({ callId, kind: "note", label: `Unknown tool: ${name}`, status: "failed", source: "internal", toolCallId: tc.id });
        return { toolCallId: tc.id, error: `Unknown tool ${name}` };
      }
      const started = Date.now();
      await log({ callId, kind: "tool-start", tool: name, toolCallId: tc.id, label: def.label, status: "running", source: def.source });
      try {
        const out = await def.run(args, { callId, convex: convex ?? new ConvexHttpClient("https://unconfigured.convex.cloud") });
        const durationMs = Date.now() - started;
        const ok = !(out && typeof out === "object" && "ok" in out && (out as { ok: unknown }).ok === false);
        await log({
          callId, kind: "tool-end", tool: name, toolCallId: tc.id, label: def.label,
          status: ok ? "succeeded" : "failed", durationMs, source: def.source,
          detail: summarize(out),
        });
        return { toolCallId: tc.id, result: JSON.stringify(out) };
      } catch (e) {
        const durationMs = Date.now() - started;
        const message = e instanceof Error ? e.message : "tool failed";
        await log({ callId, kind: "tool-end", tool: name, toolCallId: tc.id, label: def.label, status: "failed", durationMs, source: def.source, detail: message });
        return { toolCallId: tc.id, error: message };
      }
    })
  );

  return NextResponse.json({ results });
}

function summarize(out: unknown): string | undefined {
  if (!out || typeof out !== "object") return undefined;
  const o = out as Record<string, unknown>;
  if (o.reason) return String(o.reason);
  if (typeof o.found === "number") return `${o.found} result(s)`;
  if (o.app && typeof o.app === "object") return `v${(o.app as { currentVersion?: string }).currentVersion}`;
  if (Array.isArray(o.documentedReleasesBetween)) return `${(o.relevantChanges as unknown[])?.length ?? 0} relevant change(s)`;
  if (o.customer && typeof o.customer === "object") return String((o.customer as { subscriptionStatus?: string }).subscriptionStatus ?? "found");
  if (Array.isArray(o.teams)) return (o.teams as { label: string; canTransferNow: boolean }[]).map((t) => `${t.label}: ${t.canTransferNow ? "available" : "unavailable"}`).join("; ");
  if (Array.isArray(o.slots)) return `${(o.slots as unknown[]).length} open slot(s)`;
  if (o.bookingId) return o.duplicate ? "already booked (duplicate)" : "confirmed";
  if (o.team) return String(o.team);
  return undefined;
}
