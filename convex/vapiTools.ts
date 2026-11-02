import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { searchDocs } from "../src/lib/tools/kb";
import { searchManual } from "../src/lib/tools/manual";
import { getCurrentPlaybackAppInfo } from "../src/lib/tools/apple";
import { getRelevantChangesSinceVersion } from "../src/lib/tools/releases";
import { TOOL_META } from "../src/lib/tools/meta";
import { lastFour, wantsCallerId, type CallInfo } from "../src/lib/tools/callerId";

/**
 * Server-side tool implementations, dispatched by the Vapi webhook in http.ts.
 * Convex-backed tools run in-process via ctx.runQuery / ctx.runMutation.
 */
export type ToolSource = "live" | "simulated" | "internal";

export type ToolDef = {
  source: ToolSource;
  label: string;
  run: (args: Record<string, unknown>, ctx: ActionCtx, call: CallInfo) => Promise<unknown>;
};

/** Appended to reserve_callback's success so the reasoner wraps the call up instead of lingering. */
const CALLBACK_WRAP_UP = "Confirm the callback in one sentence, wish the caller a good day, then call endCall.";

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export const tools: Record<string, ToolDef> = {
  search_playback_docs: {
    source: "internal",
    label: TOOL_META.search_playback_docs.label,
    run: async (a) => {
      const query = str(a.query) ?? "";
      const category = str(a.category);
      // Help-center articles (local keyword snapshot) and the User Guide (Pinecone) in parallel;
      // the manual degrades to { ok: false } when Pinecone is not configured or slow.
      const [docs, manual] = await Promise.all([
        Promise.resolve(searchDocs(query, { category, platform: str(a.platform), limit: 3 })),
        searchManual(query, { category, limit: 3 }),
      ]);
      return { ...docs, found: docs.found + (manual.ok ? manual.found : 0), manual };
    },
  },
  get_current_playback_app_info: {
    source: "live",
    label: TOOL_META.get_current_playback_app_info.label,
    run: async () => getCurrentPlaybackAppInfo(),
  },
  get_relevant_changes_since_version: {
    source: "live",
    label: TOOL_META.get_relevant_changes_since_version.label,
    run: async (a) => getRelevantChangesSinceVersion({ installedVersion: str(a.installedVersion) ?? "", symptom: str(a.symptom) }),
  },
  lookup_demo_customer: {
    source: "simulated",
    label: TOOL_META.lookup_demo_customer.label,
    run: async (a, ctx) => ctx.runQuery(api.customers.lookup, { customerId: str(a.customerId), email: str(a.email), name: str(a.name) }),
  },
  check_team_availability: {
    source: "simulated",
    label: TOOL_META.check_team_availability.label,
    run: async (a, ctx) => ctx.runQuery(api.teams.availability, { teamId: str(a.teamId) }),
  },
  get_callback_slots: {
    source: "simulated",
    label: TOOL_META.get_callback_slots.label,
    run: async (a, ctx, call) => {
      const out = await ctx.runQuery(api.callbacks.availableSlots, {
        teamId: str(a.teamId) ?? "playback-support",
        fromIso: str(a.fromIso),
        preferredDate: str(a.preferredDate),
        preferredTime: str(a.preferredTime),
        timeZone: str(a.timeZone),
        limit: 4,
      });
      // Phone callers do not have to read a number out: offer the one they are calling from.
      return call.callerNumber
        ? { ...out, callerId: { number: call.callerNumber, lastFour: lastFour(call.callerNumber), note: "The caller is on the phone from this number. Offer to call them back on it (say only the last four digits) and pass callbackNumber 'caller-id' if they agree." } }
        : out;
    },
  },
  reserve_callback: {
    source: "simulated",
    label: TOOL_META.reserve_callback.label,
    run: async (a, ctx, call) => {
      const slotId = str(a.slotId);
      if (!slotId) return { ok: false, reason: "missing-slotId", source: "simulated" };
      const given = str(a.callbackNumber);
      const useCallerId = wantsCallerId(given);
      if (useCallerId && !call.callerNumber)
        return { ok: false, reason: "missing-number", source: "simulated", next: "This call has no caller ID (browser call). Ask the caller for the best number to reach them." };
      const out = await ctx.runMutation(api.callbacks.reserve, {
        slotId: slotId as Id<"callbackSlots">,
        callerName: str(a.callerName) ?? "Caller",
        callbackNumber: useCallerId ? call.callerNumber! : given!.trim(),
        timeZone: str(a.timeZone) ?? "unknown",
        reason: str(a.reason) ?? "Playback support follow-up",
        customerId: str(a.customerId),
        callId: call.callId,
      });
      return out.ok ? { ...out, usedCallerId: useCallerId, next: CALLBACK_WRAP_UP } : out;
    },
  },
  initiate_handoff: {
    source: "simulated",
    label: TOOL_META.initiate_handoff.label,
    run: async (a, ctx) => {
      const teamId = str(a.teamId) ?? "playback-support";
      const avail = await ctx.runQuery(api.teams.availability, { teamId });
      const team = avail.teams[0];
      if (!team) return { ok: false, reason: "team-not-found", source: "simulated" };
      if (!team.canTransferNow)
        return { ok: false, reason: "team-unavailable", team: team.label, source: "simulated", next: "Offer a callback instead." };
      return {
        ok: true,
        simulated: true,
        team: team.label,
        instruction:
          "Tell the caller you are connecting them to the team now, say goodbye briefly, then call endCall. This demo does not reach a real MultiTracks employee.",
        source: "simulated",
      };
    },
  },
};

/** One-line summary for the activity panel. */
export function summarize(out: unknown): string | undefined {
  if (!out || typeof out !== "object") return undefined;
  const o = out as Record<string, unknown>;
  if (o.reason) return String(o.reason);
  if (typeof o.found === "number") return `${o.found} result(s)`;
  if (o.app && typeof o.app === "object") return `v${(o.app as { currentVersion?: string }).currentVersion}`;
  if (Array.isArray(o.documentedReleasesBetween)) return `${(o.relevantChanges as unknown[])?.length ?? 0} relevant change(s)`;
  if (o.customer && typeof o.customer === "object") return String((o.customer as { subscriptionStatus?: string }).subscriptionStatus ?? "found");
  if (Array.isArray(o.teams)) return (o.teams as { label: string; canTransferNow: boolean }[]).map((t) => `${t.label}: ${t.canTransferNow ? "available" : "unavailable"}`).join("; ");
  if (Array.isArray(o.slots)) {
    const req = o.requested as { available?: boolean; local?: string; reason?: string } | undefined;
    if (req && req.available === true) return `${req.local} is open`;
    if (req && req.available === false) return `${req.local ?? "requested time"} not available (${req.reason})`;
    return `${(o.slots as unknown[]).length} open slot(s)`;
  }
  if (o.bookingId) return o.duplicate ? "already booked (duplicate)" : "confirmed";
  if (o.team) return String(o.team);
  return undefined;
}
