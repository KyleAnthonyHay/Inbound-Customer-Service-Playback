/** Client-safe metadata for every tool the assistant can call. */
export type ToolSource = "live" | "simulated" | "internal" | "model";

export const TOOL_META: Record<string, { label: string; source: ToolSource }> = {
  search_playback_docs: { label: "Searching support documentation", source: "internal" },
  get_current_playback_app_info: { label: "Checking current Playback version", source: "live" },
  get_relevant_changes_since_version: { label: "Finding relevant release history", source: "live" },
  lookup_demo_customer: { label: "Looking up demo customer", source: "simulated" },
  check_team_availability: { label: "Checking team availability", source: "simulated" },
  get_callback_slots: { label: "Retrieving callback slots", source: "simulated" },
  reserve_callback: { label: "Reserving callback", source: "simulated" },
  initiate_handoff: { label: "Transferring to support team", source: "simulated" },
  endCall: { label: "Ending the call", source: "model" },
  /** GPT-Live internal: the speaker delegates to the reasoner. Shown as thinking. */
  delegate: { label: "Thinking", source: "model" },
};

export function toolMeta(name: string) {
  return TOOL_META[name] ?? { label: name.replace(/_/g, " "), source: "model" as const };
}
