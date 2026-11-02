import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { ensureCall } from "../calls";

export const HANDOFF_END_GRACE_MS = 15_000;

/** The signed webhook supplies this private, per-call Vapi capability. Never construct it. */
export function validControlUrl(callId: string, value?: string): string | null {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(callId) || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vapi.ai") || url.port ||
      url.username || url.password || url.search || url.hash || url.pathname !== `/${callId}/control`) return null;
    return url.href;
  } catch { return null; }
}

/** Called only after a successful, availability-rechecked simulated handoff. Atomic deduplication. */
export async function scheduleHandoffEnd(ctx: MutationCtx, args: { callId: string; callType?: string; controlUrl: string }) {
  const controlUrl = validControlUrl(args.callId, args.controlUrl);
  if (!controlUrl) return false;
  const id = await ensureCall(ctx, args.callId, { channel: args.callType });
  const call = (await ctx.db.get(id))!;
  if (call.status === "ended") return false;
  if (call.handoffEndScheduledAt !== undefined) return true;
  // The URL stays in internal scheduler arguments; it is not stored in call history or model results.
  await ctx.scheduler.runAfter(HANDOFF_END_GRACE_MS, internal.handoff.endAfterHandoff, { callId: args.callId, controlUrl });
  await ctx.db.patch(id, { handoffEndScheduledAt: Date.now() });
  return true;
}

export type HandoffEndState = { status: string; handoffEndScheduledAt?: number } | null;

/** One documented HTTP end-call command; never retry an uncertain control write. */
export async function endHandoffCall(args: { callId: string; controlUrl: string }, deps: {
  getState: () => Promise<HandoffEndState>; fetcher?: typeof fetch; publicKey?: string;
}): Promise<{ status: "skipped" | "accepted" | "failed"; httpStatus?: number }> {
  const url = validControlUrl(args.callId, args.controlUrl);
  if (!url) return { status: "skipped" };
  const state = await deps.getState();
  if (!state || state.status === "ended" || state.handoffEndScheduledAt === undefined) return { status: "skipped" };
  try {
    const response = await (deps.fetcher ?? fetch)(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", ...(deps.publicKey ? { Authorization: `Bearer ${deps.publicKey}` } : {}) },
      body: JSON.stringify({ type: "end-call" }),
    });
    // Acceptance is not proof of disconnect; status/end-of-call webhooks remain authoritative.
    return { status: response.ok ? "accepted" : "failed", httpStatus: response.status };
  } catch { return { status: "failed" }; }
}
