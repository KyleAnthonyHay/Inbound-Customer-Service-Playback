import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { searchDocs } from "../src/lib/tools/kb";
import { getCurrentPlaybackAppInfo } from "../src/lib/tools/apple";
import { getRelevantChangesSinceVersion } from "../src/lib/tools/releases";
import { TOOL_META } from "../src/lib/tools/meta";

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

/** What the webhook knows about the live call. callerNumber is set on phone calls only. */
export type CallInfo = { callId: string; callerNumber?: string };

/** Values the model may pass to mean "call me back on the number I'm calling from". */
const CALLER_ID_WORDS = /^(caller[- ]?id|same( number)?|this number|current number|the number i'?m calling from)$/i;

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export const tools: Record<string, ToolDef> = {
  search_playback_docs: {
    source: "internal",
    label: TOOL_META.search_playback_docs.label,
    run: async (a) => searchDocs(str(a.query) ?? "", { category: str(a.category), platform: str(a.platform), limit: 3 }),
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
      const out = await ctx.runQuery(api.callbacks.availableSlots, { teamId: str(a.teamId) ?? "playback-support", fromIso: str(a.fromIso), limit: 4 });
      return call.callerNumber
        ? { ...out, callerIdNumber: call.callerNumber, callerIdNote: "The caller is on the phone from this number. Offer to call them back on it instead of asking them to read a number out." }
        : out;
    },
  },
  reserve_callback: {
    source: "simulated",
    label: TOOL_META.reserve_callback.label,
    run: async (a, ctx, call) => {
      const slotId = str(a.slotId);
      if (!slotId) return { ok: false, reason: "missing-slotId", source: "simulated" };
      const given = str(a.callbackNumber)?.trim() ?? "";
      const useCallerId = !given || CALLER_ID_WORDS.test(given);
      if (useCallerId && !call.callerNumber)
        return { ok: false, reason: "missing-number", source: "simulated", next: "Ask the caller for the best number to call them back on." };
      return ctx.runMutation(api.callbacks.reserve, {
        slotId,
        teamId: str(a.teamId),
        callerName: str(a.callerName) ?? "Caller",
        callbackNumber: useCallerId ? call.callerNumber! : given,
        timeZone: str(a.timeZone) ?? "unknown",
        reason: str(a.reason) ?? "Playback support follow-up",
        customerId: str(a.customerId),
        callId: call.callId,
      });
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
  if (Array.isArray(o.slots)) return `${(o.slots as unknown[]).length} open slot(s)`;
  if (o.bookingId) return o.duplicate ? "already booked (duplicate)" : "confirmed";
  if (o.team) return String(o.team);
  return undefined;
}
