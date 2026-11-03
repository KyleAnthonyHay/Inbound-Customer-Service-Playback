/**
 * Vapi function-tool definitions attached to the assistant. Each one posts to
 * {CONVEX_SITE_URL}/vapi/tools (convex/http.ts), which dispatches by name (convex/vapiTools.ts).
 * Shared across the browser assistant and the phone assistant.
 */
/** How long a tool may take before its holding line is spoken. */
export const TOOL_DELAY_LINE_MS = 2500;

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
    // Omitting request-start enables Vapi's random default filler. Explicit silence
    // suppresses that extra acknowledgment; retain one delayed line for slow tools.
    messages: [
      { type: "request-start", content: "" },
      ...(startMessage ? [{ type: "request-response-delayed", content: startMessage, timingMilliseconds: TOOL_DELAY_LINE_MS }] : []),
    ],
    function: { name, description, parameters: { type: "object", properties, required } },
  });

  return [
    fn(
      "get_planning_center_service_context",
      "Use to answer service/setlist questions, or proactively when service timing or song metadata can inform in-scope support. This support conversation is a simulation, but this tool makes authenticated, read-only requests to the REAL Planning Center Services API for the connected Regal Playback Demo organization. On ok=true, treat returned service and songs as the caller's authoritative service context within the simulation, just as in real support. Fictional service content does not mean API access is simulated or unavailable. All demo callers share this configured connection. General product/hardware suitability does not depend on a song plan, and planning metadata does not verify licensing, downloads, imports or audio hardware. Reuse results; honor retryAt and report actual failures truthfully.",
      {},
      [],
      "Still checking the demo service's song list."
    ),
    fn(
      "search_playback_docs",
      "Use when a factual Playback question or support decision needs documentation, including symptoms, setup, requirements, compatibility and subscription features. Searches official help-center articles (results) and the User Guide (manual.results), returning source URLs and documented guidance. Results are product documentation: establishesCallerContext=false means they do not identify the caller's current application, equipment or control; obtain that evidence from the conversation, not from a matching article. Include known platform/setup details and reuse adequate results. Version-restricted procedures are withheld unless installedVersion, confirmed by the caller, satisfies their source-stated range; withheldArticles contains metadata only, not instructions to follow. Current applicable guidance does not require a routine version check. If account/configuration evidence and documented behavior leave a symptom unexplained, release notes are another relevant source: obtain the installed version and use get_relevant_changes_since_version to match fixes across the available history. This search itself does not retrieve release history; a missing article match does not establish that no documented fix exists. manual.outOfScope identifies topics outside this support line's scope.",
      {
        query: { type: "string", description: "The factual question, symptom or topic, including relevant device/setup details the caller provided." },
        category: { type: "string", enum: ["song-loading", "audio-output", "setup", "requirements", "subscription", "general"], description: "Optional category preference, not an exclusion filter. 'setup' covers first-time login, organizations and the main interface; stronger matches in other categories remain available." },
        platform: { type: "string", description: "Caller's platform if known: iOS, iPadOS, macOS, Windows." },
        installedVersion: { type: "string", description: "Optional caller-confirmed installed Playback version. Required only to retrieve a version-restricted procedure; do not guess from account history or the latest app release." },
      },
      ["query"],
      "Still looking that up."
    ),
    fn(
      "get_current_playback_app_info",
      "Use when current published Playback metadata answers the caller's question. Returns live Apple metadata and inconsistencies; check platform applicability. The release comparator already returns the current version and iOS/iPadOS minimum OS, so reuse it rather than duplicate that lookup. This lookup alone does not establish a symptom-specific fix.",
      {},
      [],
      "Still checking the current Playback version."
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
      "Still comparing your version with the release history."
    ),
    fn(
      "lookup_demo_customer",
      "Use when organization subscription/library status or individual membership/entitlements affect the answer. A provided six-digit Organization ID alone resolves organization-level information; email is not an additional prerequisite. A provided demo customer ID, email or unique name can resolve a person when membership matters. organizationResolution and memberResolution distinguish an organization match from a member not checked, not found, ambiguous, matched or outside that organization; identityVerified=false because these are fictional record matches, not authentication. Unresolved membership is not proof of missing permission. Reuse adequate results and identifiers; ask for another only to resolve a material information gap. Interpret diagnostic hints with caller facts rather than treating them as confirmed device causes.",
      {
        orgId: { type: "string", description: "Six-digit Organization ID from Playback Settings > About, digits only, e.g. 480113." },
        email: { type: "string", description: "Optional alternative identifier, or person identifier when individual membership matters and the provided identifiers do not resolve it. Not required in addition to a successful Organization ID subscription lookup." },
        customerId: { type: "string", description: "Demo customer ID like 111, if the caller gives one." },
        name: { type: "string" },
      },
      [],
      "Still pulling up that account."
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
      "Still checking whether that song is in your library."
    ),
    fn(
      "check_team_availability",
      "Use when the caller wants a human or specialist involvement may be appropriate because of uncertainty, support scope, unresolved symptoms or account needs. Returns simulated team availability with handoffStarted=false and teamNotified=false. This lookup never notifies, loops in or connects anyone, even when canTransferNow=true; initiate_handoff performs an accepted simulated transfer. The lookup does not establish consent.",
      { teamId: { type: "string", enum: ["playback-support", "billing"], description: "Team to check. Defaults to all." } },
      [],
      "Still checking who's available."
    ),
    fn(
      "get_callback_slots",
      "Use when exploring or arranging a callback, including a caller-requested callback. With preferredDate, preferredTime and timeZone, checks that exact requested time and returns availability, reasons and nearby alternatives; otherwise returns next open slots. Returns slot IDs and formatted local times with bookingCreated=false. This is an availability lookup, not a reservation or staff notification. Gather missing availability/time zone together and missing name/number together, reusing known details; a partial answer needs only its missing part. Complete the selected date/time, zone and callback-number readback and explicit approval, then use reserve_callback to create the demo booking. Efficient question grouping does not replace consent, and an open slot alone cannot be announced as booked.",
      {
        teamId: { type: "string", enum: ["playback-support", "billing"] },
        preferredDate: { type: "string", description: "The day the caller asked for: YYYY-MM-DD, or exactly what they said ('Monday', 'tomorrow', 'Nov 2'); the tool resolves it from today's date in their zone." },
        preferredTime: { type: "string", description: "The time the caller asked for, in their zone: HH:MM 24-hour or as said ('5 PM', '9:30am')." },
        timeZone: { type: "string", description: "Caller's zone: IANA (America/New_York) or spoken (EST, Eastern, Central)." },
        fromIso: { type: "string", description: "Optional earliest time, ISO 8601, when the caller has no specific time in mind." },
      },
      ["teamId"],
      "Still checking that time."
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
      "Still booking that."
    ),
    fn(
      "initiate_handoff",
      "Use when the caller has requested or accepted a human transfer and check_team_availability confirms the selected team can transfer now. Starts the simulated handoff and returns success or failure, rechecking availability. Success completes this demo's support workflow and returns endCallRequired=true; failure leaves the conversation open. Success must be confirmed before announcing a connection; this demo never connects to real staff.",
      { teamId: { type: "string", enum: ["playback-support", "billing"] } },
      ["teamId"],
      "Still requesting that handoff."
    ),
    fn(
      "endCall",
      "Request call closing only after the caller clearly finishes or a consented handoff/callback succeeds. This prepares a farewell; it does not disconnect immediately. Say the returned speak text and let it finish. The service ends the call only after observing the farewell and completed speech. Never use while a yes/no offer or further-help question is awaiting the caller's answer.",
      {}, [], ""
    ),
  ];
}
