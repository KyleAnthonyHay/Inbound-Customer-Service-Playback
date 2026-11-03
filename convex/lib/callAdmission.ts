import type { MutationCtx } from "../_generated/server";
import { MAX_CALL_DURATION_SECONDS } from "../../src/lib/callLimits";

export const DEV_SITE = "https://ceaseless-rhinoceros-106.convex.site";
export const ADMISSION_MESSAGE = "Development calling is temporarily unavailable to keep capacity available for production. Please try again later.";
// Longer than the enforced maximum call duration plus provider setup/join time.
export const RESERVATION_MS = (MAX_CALL_DURATION_SECONDS + 10 * 60) * 1000;
const scope = "development";

/** Convex executes the indexed read and write in one serializable transaction. */
export async function reserveDevCall(ctx: MutationCtx, token: string, now = Date.now()) {
  const row = await ctx.db.query("callAdmission").withIndex("by_scope", q => q.eq("scope", scope)).unique();
  if (row && row.expiresAt > now) return false;
  const value = { scope, token, expiresAt: now + RESERVATION_MS, callId: undefined };
  if (row) await ctx.db.patch(row._id, value);
  else await ctx.db.insert("callAdmission", value);
  return true;
}

export async function updateDevReservation(ctx: MutationCtx, args: { token?: string; callId?: string; release: boolean }) {
  const row = await ctx.db.query("callAdmission").withIndex("by_scope", q => q.eq("scope", scope)).unique();
  if (!row || !(args.token ? row.token === args.token : args.callId && row.callId === args.callId)) return null;
  if (args.release) await ctx.db.patch(row._id, { expiresAt: 0 });
  else if (args.callId) {
    // The ended webhook can win the race with the provider's create response.
    const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", args.callId!)).unique();
    await ctx.db.patch(row._id, { callId: args.callId, ...(call?.status === "ended" ? { expiresAt: 0 } : {}) });
  }
  return null;
}

type AdmissionEnv = Record<string, string | undefined>;
type AdmissionDeps = {
  env: AdmissionEnv;
  reserve: (token: string) => Promise<boolean>;
  update: (args: { token: string; callId?: string; release: boolean }) => Promise<unknown>;
  fetcher?: typeof fetch;
};

/** Never forwards caller-supplied assistants, overrides, destinations or credentials. */
export async function startDevCall(transport: "browser" | "websocket", deps: AdmissionDeps): Promise<{ status: number; body: Record<string, unknown> }> {
  const blocked = (status = 429) => ({ status, body: { message: ADMISSION_MESSAGE } });
  const env = deps.env;
  const reserved = Number(env.DEV_CALL_RESERVED_PRODUCTION_SLOTS ?? "1");
  if (env.CONVEX_SITE_URL !== DEV_SITE || !env.VAPI_PRIVATE_KEY || !env.DEV_VAPI_ASSISTANT_ID ||
    !Number.isSafeInteger(reserved) || reserved < 1) return blocked(503);

  const token = crypto.randomUUID();
  if (!await deps.reserve(token)) return blocked();
  const fetcher = deps.fetcher ?? fetch;
  const headers = { Authorization: `Bearer ${env.VAPI_PRIVATE_KEY}`, "Content-Type": "application/json" };
  let creationAttempted = false;
  try {
    // Subscription-wide, including other organizations. This is a read, not a
    // provider reservation; the remaining provider race is documented.
    const limitsResponse = await fetcher("https://api.vapi.ai/org/limits", {
      headers, redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!limitsResponse.ok) throw Error("Limits unavailable");
    const limits = (await limitsResponse.json())?.subscriptionLimits;
    if (!limits || !Number.isSafeInteger(limits.concurrencyLimit) || !Number.isSafeInteger(limits.remainingConcurrentCalls) ||
      limits.concurrencyLimit < 1 || limits.remainingConcurrentCalls < 0 || limits.remainingConcurrentCalls > limits.concurrencyLimit)
      throw Error("Invalid limits");
    if (limits.concurrencyBlocked || limits.remainingConcurrentCalls <= reserved || limits.concurrencyLimit <= reserved) {
      await deps.update({ token, release: true });
      return blocked();
    }
    // A full page is ambiguous (older active calls may be omitted): fail closed.
    // No time filter: a long-running external call must still count.
    const snapshot = await fetcher("https://api.vapi.ai/call?limit=1000", {
      headers, redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!snapshot.ok) throw Error("Snapshot unavailable");
    const calls: unknown = await snapshot.json();
    if (!Array.isArray(calls) || calls.length >= 1000 || calls.some(c => !c || typeof c.id !== "string" || typeof c.status !== "string"))
      throw Error("Incomplete snapshot");
    const active = calls.filter(c => c.status !== "ended");
    if (active.some(c => c.assistantId === env.DEV_VAPI_ASSISTANT_ID) || active.length >= limits.concurrencyLimit - reserved) {
      await deps.update({ token, release: true });
      return blocked();
    }
    creationAttempted = true;
    const response = await fetcher("https://api.vapi.ai/call", {
      method: "POST", headers, redirect: "error", signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        assistantId: env.DEV_VAPI_ASSISTANT_ID,
        assistantOverrides: { maxDurationSeconds: MAX_CALL_DURATION_SECONDS },
        transport: transport === "browser" ? { provider: "daily", roomDeleteOnUserLeaveEnabled: true } : {
          provider: "vapi.websocket", audioFormat: { format: "pcm_s16le", container: "raw", sampleRate: 24000 },
        },
      }),
    });
    if (!response.ok) {
      // 5xx/timeouts may have created a call. Keep the reservation; never retry.
      if (response.status >= 400 && response.status < 500) await deps.update({ token, release: true });
      return blocked(503);
    }
    const call = await response.json();
    if (typeof call.id !== "string") throw Error("Missing call ID");
    await deps.update({ token, callId: call.id, release: false });
    const url = transport === "browser" ? call.transport?.callUrl ?? call.webCallUrl : call.transport?.websocketCallUrl;
    if (typeof url !== "string") return blocked(503);
    // Explicit allowlist: Vapi's full response can echo webhook credentials.
    return { status: 201, body: transport === "browser" ? { id: call.id, webCallUrl: url } : {
      id: call.id, transport: { websocketCallUrl: url },
    } };
  } catch {
    if (!creationAttempted) await deps.update({ token, release: true });
    return blocked(503);
  }
}
