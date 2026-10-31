import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { searchDocs } from "./kb";
import { getCurrentPlaybackAppInfo } from "./apple";
import { getRelevantChangesSinceVersion } from "./releases";

import { TOOL_META } from "./meta";

export type ToolSource = "live" | "simulated" | "internal";

export type ToolDef = {
  name: string;
  source: ToolSource;
  label: string; // shown in the activity panel
  run: (args: Record<string, unknown>, ctx: { callId: string; convex: ConvexHttpClient }) => Promise<unknown>;
};

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export const tools: Record<string, ToolDef> = {
  search_playback_docs: {
    name: "search_playback_docs",
    source: "internal",
    label: TOOL_META.search_playback_docs.label,
    run: async (a) => searchDocs(str(a.query) ?? "", { category: str(a.category), platform: str(a.platform), limit: 3 }),
  },
  get_current_playback_app_info: {
    name: "get_current_playback_app_info",
    source: "live",
    label: TOOL_META.get_current_playback_app_info.label,
    run: async () => getCurrentPlaybackAppInfo(),
  },
  get_relevant_changes_since_version: {
    name: "get_relevant_changes_since_version",
    source: "live",
    label: TOOL_META.get_relevant_changes_since_version.label,
    run: async (a) => getRelevantChangesSinceVersion({ installedVersion: str(a.installedVersion) ?? "", symptom: str(a.symptom) }),
  },
  lookup_demo_customer: {
    name: "lookup_demo_customer",
    source: "simulated",
    label: TOOL_META.lookup_demo_customer.label,
    run: async (a, { convex }) =>
      convex.query(api.customers.lookup, { customerId: str(a.customerId), email: str(a.email), name: str(a.name) }),
  },
  check_team_availability: {
    name: "check_team_availability",
    source: "simulated",
    label: TOOL_META.check_team_availability.label,
    run: async (a, { convex }) => convex.query(api.teams.availability, { teamId: str(a.teamId) }),
  },
  get_callback_slots: {
    name: "get_callback_slots",
    source: "simulated",
    label: TOOL_META.get_callback_slots.label,
    run: async (a, { convex }) =>
      convex.query(api.callbacks.availableSlots, { teamId: str(a.teamId) ?? "playback-support", fromIso: str(a.fromIso), limit: 4 }),
  },
  reserve_callback: {
    name: "reserve_callback",
    source: "simulated",
    label: TOOL_META.reserve_callback.label,
    run: async (a, { convex, callId }) => {
      const slotId = str(a.slotId);
      if (!slotId) return { ok: false, reason: "missing-slotId", source: "simulated" };
      return convex.mutation(api.callbacks.reserve, {
        slotId: slotId as Id<"callbackSlots">,
        callerName: str(a.callerName) ?? "Caller",
        callbackNumber: str(a.callbackNumber) ?? "",
        timeZone: str(a.timeZone) ?? "unknown",
        reason: str(a.reason) ?? "Playback support follow-up",
        customerId: str(a.customerId),
        callId,
      });
    },
  },
  initiate_handoff: {
    name: "initiate_handoff",
    source: "simulated",
    label: TOOL_META.initiate_handoff.label,
    run: async (a, { convex }) => {
      const teamId = str(a.teamId) ?? "playback-support";
      const avail = await convex.query(api.teams.availability, { teamId });
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
