import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { ensureCall } from "../calls";
import { validControlUrl } from "./handoffEnding";
export { hasBrandedFarewell, isBriefSignoff } from "../../src/lib/voicePolicy";
import { hasBrandedFarewell } from "../../src/lib/voicePolicy";

export const CLOSING_GRACE_MS = 8_000;
export const CLOSING_POLL_MS = 1_500;
export const CLOSING_MAX_ATTEMPTS = 16;
/** A later endCall after this long starts a fresh closing (the earlier check has likely finished). */
const STALE_CLOSING_MS = 20_000;

export type ClosingState = {
  status: string;
  channel?: string;
  requestedAt?: number;
  assistantSpeaking?: boolean;
  assistantStoppedAt?: number;
  lastUserSpeechAt?: number;
  farewell: string;
  callerSpeaking?: boolean;
  closingInterrupted?: boolean;
  deadlineAt?: number;
  resumedAt?: number;
};

/**
 * GPT-Live phone calls deliver no speech-update/transcript webhooks, so the server cannot observe the
 * farewell. Estimate when it has been spoken: response latency, a slow speaking pace, then a quiet buffer.
 */
export function farewellDurationMs(farewell: string) {
  const words = farewell.trim().split(/\s+/).filter(Boolean).length;
  // ~2.6 words/s is slower than the recorded voice (~4), leaving room for a short handoff announcement.
  return Math.max(6_000, 1_000 + words * 380 + 1_500);
}

/** Private control capability is kept only in internal scheduler arguments. */
export async function requestCallClosing(ctx: MutationCtx, args: { callId: string; callType?: string; controlUrl: string; farewell?: string }) {
  const controlUrl = validControlUrl(args.callId, args.controlUrl);
  if (!controlUrl) return false;
  const id = await ensureCall(ctx, args.callId, { channel: args.callType });
  const call = (await ctx.db.get(id))!;
  if (call.status === "ended") return false;
  const now = Date.now();
  // Only endCall supplies the farewell it hands the speaker; that starts the timed fallback.
  const deadline = args.farewell ? { closingDeadlineAt: now + farewellDurationMs(args.farewell) } : {};
  const pending = call.closingRequestedAt;
  if (pending !== undefined && Math.max(call.lastUserSpeechAt ?? 0, call.closingResumedAt ?? 0) <= pending &&
    !(args.farewell && now - pending > STALE_CLOSING_MS)) {
    if (args.farewell && (call.closingDeadlineAt ?? 0) < pending) await ctx.db.patch(id, deadline);
    return true;
  }
  await ctx.db.patch(id, { closingRequestedAt: now, closingFarewell: "", closingInterrupted: false, closingDeadlineAt: undefined, ...deadline });
  await ctx.scheduler.runAfter(CLOSING_GRACE_MS, internal.closing.check, { callId: args.callId, controlUrl, requestedAt: now, attempt: 0 });
  return true;
}

/** True when this call has never delivered speech or transcript evidence (GPT-Live phone calls). */
const noSpeechEvidence = (s: ClosingState) => s.assistantStoppedAt === undefined && s.callerSpeaking === undefined &&
  s.lastUserSpeechAt === undefined && !s.farewell;

/**
 * Speech completion AND a farewell are required where speech events exist. Phone calls without any
 * speech events instead wait for the endCall farewell's estimated duration; the browser stops itself.
 */
export async function finishCallWhenReady(args: { callId: string; controlUrl: string; requestedAt: number }, deps: {
  getState: () => Promise<ClosingState | null>; fetcher?: typeof fetch; publicKey?: string; now?: number;
}): Promise<"waiting" | "cancelled" | "accepted" | "failed"> {
  const url = validControlUrl(args.callId, args.controlUrl);
  if (!url) return "cancelled";
  const state = await deps.getState();
  if (!state || state.status === "ended" || state.requestedAt !== args.requestedAt ||
    (state.lastUserSpeechAt ?? 0) > args.requestedAt || (state.resumedAt ?? 0) > args.requestedAt) return "cancelled";
  const now = deps.now ?? Date.now();
  const timedFarewellDone = state.channel !== "browser" && noSpeechEvidence(state) &&
    state.deadlineAt !== undefined && state.deadlineAt >= args.requestedAt && now >= state.deadlineAt;
  const observedFarewellDone = !state.callerSpeaking && !state.closingInterrupted && now >= args.requestedAt + CLOSING_GRACE_MS &&
    state.assistantSpeaking === false && (state.assistantStoppedAt ?? 0) >= args.requestedAt && hasBrandedFarewell(state.farewell);
  if (!timedFarewellDone && !observedFarewellDone) return "waiting";
  try {
    const response = await (deps.fetcher ?? fetch)(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", ...(deps.publicKey ? { Authorization: `Bearer ${deps.publicKey}` } : {}) },
      body: JSON.stringify({ type: "end-call" }),
    });
    return response.ok ? "accepted" : "failed";
  } catch { return "failed"; } // Never retry an uncertain control write.
}
