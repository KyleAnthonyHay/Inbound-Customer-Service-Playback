import type { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { searchDocs } from "../src/lib/tools/kb";
import { searchManual } from "../src/lib/tools/manual";
import { getCurrentPlaybackAppInfo } from "../src/lib/tools/apple";
import { getRelevantChangesSinceVersion } from "../src/lib/tools/releases";
import { getPlanningCenterServiceContext, planningContextForAgent } from "../src/lib/tools/planningCenter";
import { TOOL_META } from "../src/lib/tools/meta";
import { lastFour, wantsCallerId, type CallInfo } from "../src/lib/tools/callerId";
import { validControlUrl } from "./lib/handoffEnding";
import { GOODBYE_MESSAGE } from "../src/lib/voicePolicy";

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

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export const tools: Record<string, ToolDef> = {
  endCall: {
    source: "internal", label: "Preparing the goodbye",
    run: async (_args, ctx, call) => {
      let speak = GOODBYE_MESSAGE;
      try {
        const booking = await ctx.runQuery(internal.callbacks.confirmationForCall, { callId: call.callId });
        if (booking?.bookingId && booking.local) speak = `Your demo callback is confirmed for ${booking.local}. ${GOODBYE_MESSAGE}`;
      } catch { /* Optional confirmation enrichment cannot break guarded call closing. */ }
      if (call.callId.startsWith("text-poc-")) return { ok: true, voiceCall: false, speak };
      const controlUrl = validControlUrl(call.callId, call.controlUrl);
      if (!controlUrl) return { ok: false, reason: "call-control-unavailable", speak,
        next: "Say the goodbye. Do not claim the call has disconnected." };
      const pending = await ctx.runMutation(internal.closing.request, {
        callId: call.callId, ...(call.callType ? { callType: call.callType } : {}), controlUrl, farewell: speak,
      });
      return { ok: pending, closingPending: pending, actionPerformed: "closing-requested", disconnected: false, speak,
        next: "Say the farewell now and let it finish. The service disconnects shortly after it; do not call another tool or ask another question. If the caller interrupts with more to discuss, continue helping." };
    },
  },
  get_planning_center_service_context: {
    source: "live",
    label: TOOL_META.get_planning_center_service_context.label,
    // Keep this server-to-server integration behind the existing saved-assistant webhook secret.
    run: async () => process.env.VAPI_TOOL_SECRET
      ? planningContextForAgent(await getPlanningCenterServiceContext())
      : { ok: false, source: "live", reason: "not-configured", next: "Planning Center requires the protected saved-assistant webhook. Continue documented Playback support without service context." },
  },
  search_playback_docs: {
    source: "internal",
    label: TOOL_META.search_playback_docs.label,
    run: async (a) => {
      const query = str(a.query) ?? "";
      const category = str(a.category);
      // Help-center articles (local keyword snapshot) and the User Guide (Pinecone) in parallel;
      // the manual degrades to { ok: false } when Pinecone is not configured or slow.
      const [docs, manual] = await Promise.all([
        Promise.resolve(searchDocs(query, { category, platform: str(a.platform), installedVersion: str(a.installedVersion), limit: 3 })),
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
    run: async (a) => getRelevantChangesSinceVersion({ installedVersion: str(a.installedVersion) ?? "", symptom: str(a.symptom), platform: str(a.platform), osVersion: str(a.osVersion) }),
  },
  lookup_demo_customer: {
    source: "simulated",
    label: TOOL_META.lookup_demo_customer.label,
    run: async (a, ctx) =>
      ctx.runQuery(api.customers.lookup, { orgId: str(a.orgId), customerId: str(a.customerId), email: str(a.email), name: str(a.name) }),
  },
  check_song_access: {
    source: "simulated",
    label: TOOL_META.check_song_access.label,
    run: async (a, ctx) => {
      const songTitle = str(a.songTitle)?.trim();
      if (!songTitle) return { ok: false, reason: "missing-songTitle", source: "simulated" };
      return ctx.runQuery(api.customers.songAccess, { orgId: str(a.orgId), customerId: str(a.customerId), email: str(a.email), name: str(a.name), songTitle });
    },
  },
  check_team_availability: {
    source: "simulated",
    label: TOOL_META.check_team_availability.label,
    run: async (a, ctx) => ({
      ...await ctx.runQuery(api.teams.availability, { teamId: str(a.teamId) }),
      handoffStarted: false,
      teamNotified: false,
      actionPerformed: "availability-lookup-only",
    }),
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
      const availability = { ...out, actionPerformed: "availability-lookup-only", bookingCreated: false, teamNotified: false,
        bookingInstruction: "These are available times, not a booking. Keep the call open. Reuse known details; if both caller name and callback number are missing, ask for them together (or missing name plus approval to use caller ID). For a partial answer, ask only the missing detail. Once complete, read back the selected date/time, time zone and number as a proposal, obtain explicit approval, then call reserve_callback. Grouping questions does not replace this consent step. Do not confirm a booking or say goodbye until reserve_callback returns ok=true with bookingId. A yes clarifying a time alone is not full booking approval." };
      // Phone callers do not have to read a number out: offer the one they are calling from.
      return call.callerNumber
        ? { ...availability, callerId: { number: call.callerNumber, lastFour: lastFour(call.callerNumber), note: "The caller is on the phone from this number. Offer to call them back on it (say only the last four digits) and pass callbackNumber 'caller-id' if they agree." } }
        : { ...availability, callbackNumberRequired: true };
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
      if (!given?.trim()) return { ok: false, bookingCreated: false, reason: "missing-number", source: "simulated", next: "Ask for the best callback number before reading back and confirming the booking." };
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
      if (!out.ok) return { ...out, bookingCreated: false, actionPerformed: "reservation-failed" };
      // A completed booking arms the same guarded farewell observer as endCall.
      // This is a fallback for omitted tool delegation, never an immediate hang-up.
      const controlUrl = validControlUrl(call.callId, call.controlUrl);
      let closingFallbackScheduled = false;
      if (controlUrl) {
        try { closingFallbackScheduled = await ctx.runMutation(internal.closing.request, { callId: call.callId, ...(call.callType ? { callType: call.callType } : {}), controlUrl }); }
        catch { console.warn("Could not prepare completed callback closing"); }
      }
      return { ...out, bookingCreated: true, actionPerformed: "callback-reserved", teamNotified: false, usedCallerId: useCallerId,
        endCallRequired: true, nextAction: "endCall", callEndingFallbackScheduled: closingFallbackScheduled,
        next: "The demo callback is reserved. Call endCall, confirm the returned local time and speak its farewell once. Guarded closing waits for the completed farewell and speech; do not claim audio disconnected." };
    },
  },
  initiate_handoff: {
    source: "simulated",
    label: TOOL_META.initiate_handoff.label,
    run: async (a, ctx, call) => {
      const teamId = str(a.teamId) ?? "playback-support";
      const avail = await ctx.runQuery(api.teams.availability, { teamId });
      const team = avail.teams[0];
      if (!team) return { ok: false, reason: "team-not-found", source: "simulated" };
      if (!team.canTransferNow)
        return { ok: false, reason: "team-unavailable", team: team.label, source: "simulated", next: "Offer a callback instead." };
      const controlUrl = validControlUrl(call.callId, call.controlUrl);
      let fallbackScheduled = false;
      if (controlUrl) {
        try {
          fallbackScheduled = await ctx.runMutation(internal.closing.request, {
            callId: call.callId, ...(call.callType ? { callType: call.callType } : {}), controlUrl,
          });
        } catch {
          // Do not turn an accepted handoff into a failed transfer or expose its private control URL.
          console.warn("Could not schedule simulated handoff call ending");
        }
      }
      return {
        ok: true,
        simulated: true,
        team: team.label,
        conversationComplete: true,
        endCallRequired: true,
        nextAction: "endCall",
        callEndingFallbackScheduled: fallbackScheduled,
        note: "Simulated handoff accepted. No real MultiTracks employee is contacted.",
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
  if (o.service && Array.isArray(o.songs)) return `${o.songs.length} demo service song(s) — actual Services API read`;
  if (typeof o.found === "number") return `${o.found} result(s)`;
  if (o.app && typeof o.app === "object") return `v${(o.app as { currentVersion?: string }).currentVersion}`;
  if (Array.isArray(o.documentedReleasesBetween)) return `${(o.relevantChanges as unknown[])?.length ?? 0} relevant change(s)`;
  if (typeof o.access === "string") return String(o.access);
  if (o.diagnosis && typeof o.diagnosis === "object") return String((o.diagnosis as { code?: string }).code ?? "found");
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
