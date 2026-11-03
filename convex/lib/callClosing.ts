import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { ensureCall } from "../calls";
import { validControlUrl } from "./handoffEnding";
export { hasBrandedFarewell, isBriefSignoff } from "../../src/lib/voicePolicy";
import { hasBrandedFarewell } from "../../src/lib/voicePolicy";

export const CLOSING_GRACE_MS = 8_000;
export type ClosingState = {
  status: string;
  requestedAt?: number;
  assistantSpeaking?: boolean;
  assistantStoppedAt?: number;
  lastUserSpeechAt?: number;
  farewell: string;
  callerSpeaking?: boolean;
  closingInterrupted?: boolean;
};

/** Private control capability is kept only in internal scheduler arguments. */
export async function requestCallClosing(ctx: MutationCtx, args: { callId: string; callType?: string; controlUrl: string }) {
  const controlUrl = validControlUrl(args.callId, args.controlUrl);
  if (!controlUrl) return false;
  const id = await ensureCall(ctx, args.callId, { channel: args.callType });
  const call = (await ctx.db.get(id))!;
  if (call.status === "ended") return false;
  if (call.closingRequestedAt !== undefined && (call.lastUserSpeechAt ?? 0) <= call.closingRequestedAt) return true;
  const requestedAt = Date.now();
  await ctx.db.patch(id, { closingRequestedAt: requestedAt, closingFarewell: "", closingInterrupted: false });
  await ctx.scheduler.runAfter(CLOSING_GRACE_MS, internal.closing.check, { callId: args.callId, controlUrl, requestedAt, attempt: 0 });
  return true;
}

/** Speech completion AND a farewell are required; elapsed time alone never authorizes hang-up. */
export async function finishCallWhenReady(args: { callId: string; controlUrl: string; requestedAt: number }, deps: {
  getState: () => Promise<ClosingState | null>; fetcher?: typeof fetch; publicKey?: string; now?: number;
}): Promise<"waiting" | "cancelled" | "accepted" | "failed"> {
  const url = validControlUrl(args.callId, args.controlUrl);
  if (!url) return "cancelled";
  const state = await deps.getState();
  if (!state || state.status === "ended" || state.requestedAt !== args.requestedAt ||
    (state.lastUserSpeechAt ?? 0) > args.requestedAt) return "cancelled";
  if (state.callerSpeaking || state.closingInterrupted || (deps.now ?? Date.now()) < args.requestedAt + CLOSING_GRACE_MS ||
    state.assistantSpeaking !== false || (state.assistantStoppedAt ?? 0) < args.requestedAt ||
    !hasBrandedFarewell(state.farewell)) return "waiting";
  try {
    const response = await (deps.fetcher ?? fetch)(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", ...(deps.publicKey ? { Authorization: `Bearer ${deps.publicKey}` } : {}) },
      body: JSON.stringify({ type: "end-call" }),
    });
    return response.ok ? "accepted" : "failed";
  } catch { return "failed"; } // Never retry an uncertain control write.
}
