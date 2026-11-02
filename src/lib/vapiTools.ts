/**
 * Vapi function-tool definitions attached to the assistant. Each one posts to
 * {CONVEX_SITE_URL}/vapi/tools (convex/http.ts), which dispatches by name (convex/vapiTools.ts).
 * Shared across the browser assistant and the phone assistant.
 */
export function buildToolDefinitions(opts: { serverUrl: string; secret?: string }) {
  const server = {
    url: opts.serverUrl,
    timeoutSeconds: 20,
    ...(opts.secret ? { headers: { "x-demo-secret": opts.secret } } : {}),
  };
  const fn = (
    name: string,
    description: string,
    properties: Record<string, unknown>,
    required: string[],
    startMessage: string
  ) => ({
    type: "function",
    async: false,
    server,
    messages: [{ type: "request-start", content: startMessage }],
    function: { name, description, parameters: { type: "object", properties, required } },
  });

  return [
    fn(
      "get_planning_center_service_context",
      "Use to answer questions about the demo service/setlist, or proactively when service timing or song metadata can inform the next in-scope support decision. The caller need not request the lookup, but general product or hardware suitability does not depend on a song plan. Reads one shared fictional demo organization's upcoming service and songs from the real Planning Center Services API, never a caller's church. Planning metadata does not verify licensing, downloads, imports or audio hardware. Reuse retrieved context; honor retryAt if rate limited.",
      {},
      [],
      "Let me check the demo service's song list."
    ),
    fn(
      "search_playback_docs",
      "Use when a factual Playback question or support decision needs documentation, including symptoms, setup, requirements, compatibility and subscription features. Searches official help-center articles (results) and the User Guide (manual.results), returning source URLs and documented guidance. Include known platform/setup details and reuse adequate results. If account/configuration evidence and documented behavior leave a symptom unexplained, release notes are another relevant source: obtain the installed version and use get_relevant_changes_since_version to match fixes across the available history, not just the latest three releases. This search itself does not retrieve release history; a missing article match does not establish that no documented fix exists. Follow clear direct evidence first rather than checking versions routinely. manual.outOfScope identifies topics outside this support line's scope.",
      {
        query: { type: "string", description: "The factual question, symptom or topic, including relevant device/setup details the caller provided." },
        category: { type: "string", enum: ["song-loading", "audio-output", "setup", "requirements", "subscription", "general"], description: "Optional category filter. 'setup' covers first-time login, organizations and the main interface." },
        platform: { type: "string", description: "Caller's platform if known: iOS, iPadOS, macOS, Windows." },
      },
      ["query"],
      "Absolutely, let me pull that up. One moment please."
    ),
    fn(
      "get_current_playback_app_info",
      "Use when current published Playback metadata answers the caller's question. Returns live Apple metadata and inconsistencies; check platform applicability. The release comparator already returns the current version and iOS/iPadOS minimum OS, so reuse it rather than duplicate that lookup. This lookup alone does not establish a symptom-specific fix.",
      {},
      [],
      "One moment while I check the current Playback version."
    ),
    fn(
      "get_relevant_changes_since_version",
      "Use when release evidence could explain an otherwise unexplained symptom or answer a version question. Requires the installed version confirmed by the caller, not a historical account note. Searches all available newer release history, not only the latest three releases. Returns candidate notes, live current-version/OS metadata, coverage gaps and updateAssessment: missingInformation, blockers and prerequisitesComplete. Known platform/OS details enable the assessment; missing details can be supplied in a later comparison. Candidate keyword matches need review for actual applicability. No match is not proof that no defect exists. Clear account/configuration evidence and direct human requests do not require a version lookup.",
      {
        installedVersion: { type: "string", description: "Caller's installed Playback version, e.g. 8.6.2." },
        symptom: { type: "string", description: "Optional symptom or change topic to focus the comparison; omit for all documented changes since the installed version." },
        platform: { type: "string", description: "Caller-confirmed platform, e.g. iPadOS, iOS or macOS. iOS requirements must not be used for macOS." },
        osVersion: { type: "string", description: "Caller-confirmed operating-system version, e.g. 18. Omit if unknown; the assessment will identify it as missing." },
      },
      ["installedVersion"],
      "Let me compare your version with the documented release history."
    ),
    fn(
      "lookup_demo_customer",
      "Use when account-specific status, membership or entitlements affect the answer. Prefer a provided six-digit Organization ID; a provided demo customer ID, email or name can also resolve the account. Returns simulated organization, membership, library and diagnostic hints, not identity verification. Interpret hints with caller facts and shared policy rather than treating them as confirmed device causes.",
      {
        orgId: { type: "string", description: "Six-digit Organization ID from Playback Settings > About, digits only, e.g. 480113." },
        email: { type: "string", description: "Email on the MultiTracks account, if the caller does not have the app open." },
        customerId: { type: "string", description: "Demo customer ID like DEMO-1001, if the caller gives one." },
        name: { type: "string" },
      },
      [],
      "Let me pull up that account."
    ),
    fn(
      "check_song_access",
      "Use when the organization's access to a specific song could determine the next support step. Requires a song title and an account identifier to resolve the organization. Returns simulated purchase/rental status and permission restrictions, plus diagnostic hints. It cannot grant access or complete a purchase; a failed lookup is not evidence that the song is unowned.",
      {
        songTitle: { type: "string", description: "Song title in the caller's words, e.g. 'Way Maker'." },
        orgId: { type: "string", description: "Six-digit Organization ID, if known." },
        email: { type: "string", description: "Account email, if the organization ID is not known." },
        customerId: { type: "string" },
      },
      ["songTitle"],
      "Let me check whether that song is in your library."
    ),
    fn(
      "check_team_availability",
      "Use when the caller wants a human or specialist involvement may be appropriate because of uncertainty, support scope, unresolved symptoms or account needs. Returns simulated team availability with handoffStarted=false. This lookup never connects anyone, even when canTransferNow=true; initiate_handoff performs an accepted transfer. The lookup does not establish consent.",
      { teamId: { type: "string", enum: ["playback-support", "billing"], description: "Team to check. Defaults to all." } },
      [],
      "Of course. Let me see who's available. One moment please."
    ),
    fn(
      "get_callback_slots",
      "Use when exploring or arranging a callback, including a caller-requested callback. With preferredDate, preferredTime and timeZone, checks that exact requested time and returns availability, reasons and nearby alternatives; otherwise returns next open slots. Returns slot IDs and formatted local times. This is simulated scheduling and does not reserve a slot.",
      {
        teamId: { type: "string", enum: ["playback-support", "billing"] },
        preferredDate: { type: "string", description: "The day the caller asked for: YYYY-MM-DD, or exactly what they said ('Monday', 'tomorrow', 'Nov 2'); the tool resolves it from today's date in their zone." },
        preferredTime: { type: "string", description: "The time the caller asked for, in their zone: HH:MM 24-hour or as said ('5 PM', '9:30am')." },
        timeZone: { type: "string", description: "Caller's zone: IANA (America/New_York) or spoken (EST, Eastern, Central)." },
        fromIso: { type: "string", description: "Optional earliest time, ISO 8601, when the caller has no specific time in mind." },
      },
      ["teamId"],
      "Let me check that time."
    ),
    fn(
      "reserve_callback",
      "Use to book a simulated callback only after the caller explicitly confirms the selected time, time zone and callback number. Requires the agreed slotId returned by get_callback_slots and the caller details. Writes a demo booking and returns confirmation or failure; the booking is confirmed only when ok=true. Does not contact real staff or customers.",
      {
        slotId: { type: "string", description: "slotId from get_callback_slots." },
        callerName: { type: "string" },
        callbackNumber: { type: "string", description: "The number to call back, or exactly 'caller-id' to use the number the caller is calling from (phone calls only; get_callback_slots returns callerId when it is known)." },
        timeZone: { type: "string", description: "Caller's time zone, e.g. America/Chicago or 'Central'." },
        reason: { type: "string", description: "One-line summary of the issue for the team." },
        customerId: { type: "string" },
      },
      ["slotId", "callerName", "callbackNumber", "timeZone", "reason"],
      "Booking that now."
    ),
    fn(
      "initiate_handoff",
      "Use when the caller has requested or accepted a human transfer and check_team_availability confirms the selected team can transfer now. Starts the simulated handoff and returns success or failure, rechecking availability. Success must be confirmed before announcing a connection; this demo never connects to real staff.",
      { teamId: { type: "string", enum: ["playback-support", "billing"] } },
      ["teamId"],
      "Let me request that handoff."
    ),
    { type: "endCall" },
  ];
}
