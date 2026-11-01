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
      "search_playback_docs",
      "Search MultiTracks' official Playback support documentation: help-center articles (results) and sections of the Playback User Guide (manual.results). Use before giving any troubleshooting instruction. Returns documented steps with source URLs; only give steps that appear in the results. manual.outOfScope lists topics the guide documents but this line does not troubleshoot.",
      {
        query: { type: "string", description: "Symptom or topic in the caller's words, e.g. 'song stuck downloading' or 'no sound from USB interface'." },
        category: { type: "string", enum: ["song-loading", "audio-output", "setup", "requirements", "subscription", "general"], description: "Optional category filter. 'setup' covers first-time login, organizations and the main interface." },
        platform: { type: "string", description: "Caller's platform if known: iOS, iPadOS, macOS, Windows." },
      },
      ["query"],
      "Let me check the documentation on that."
    ),
    fn(
      "get_current_playback_app_info",
      "Get the current public Playback app version and release date from Apple's App Store lookup API (live data).",
      {},
      [],
      "One moment while I check the current Playback version."
    ),
    fn(
      "get_relevant_changes_since_version",
      "Given the caller's installed Playback version and symptom, find documented fixes released between their version and the current version. Tells you whether updating is a targeted fix. Use after learning the caller's version.",
      {
        installedVersion: { type: "string", description: "Caller's installed Playback version, e.g. 8.6.2." },
        symptom: { type: "string", description: "Short symptom description, e.g. 'Cloud Pro expired message'." },
      },
      ["installedVersion"],
      "Let me compare your version against recent releases."
    ),
    fn(
      "lookup_demo_customer",
      "Look up a demo customer record by customer ID, email, or name to check subscription status and entitlements. This is simulated demo data, not real MultiTracks accounts, and is not identity verification.",
      {
        customerId: { type: "string", description: "Demo customer ID like DEMO-1001." },
        email: { type: "string" },
        name: { type: "string" },
      },
      [],
      "Let me pull up that account."
    ),
    fn(
      "check_team_availability",
      "Check whether a simulated support team can take a transfer right now. Call this when the caller asks for a human or when documented steps are exhausted.",
      { teamId: { type: "string", enum: ["playback-support", "billing"], description: "Team to check. Defaults to all." } },
      [],
      "Let me see who's available."
    ),
    fn(
      "get_callback_slots",
      "Check callback availability for a team (simulated scheduling). When the caller names a day and time, pass preferredDate, preferredTime and timeZone: the result says whether THAT exact time is open (requested.available), why not if it isn't (requested.reason + detail), and lists the nearest open alternatives. Without a preferred time it returns the next open slots. Every slot has a 'local' string already in the caller's zone; speak those, never convert times yourself. If requested.available is false you must say so to the caller before offering anything else.",
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
      "Reserve a callback slot after the caller has explicitly confirmed the time, time zone, and callback number. Use the slotId that get_callback_slots returned for the time the caller agreed to. Only say the callback is confirmed if this returns ok=true; read back its 'local' time. If it fails or the slot was taken, explain and offer another slot.",
      {
        slotId: { type: "string", description: "slotId from get_callback_slots." },
        callerName: { type: "string" },
        callbackNumber: { type: "string" },
        timeZone: { type: "string", description: "Caller's time zone, e.g. America/Chicago or 'Central'." },
        reason: { type: "string", description: "One-line summary of the issue for the team." },
        customerId: { type: "string" },
      },
      ["slotId", "callerName", "callbackNumber", "timeZone", "reason"],
      "Booking that now."
    ),
    fn(
      "initiate_handoff",
      "Start the simulated handoff to a support team. Only call after check_team_availability says the team can transfer now. On success, announce the transfer, say a brief goodbye, then end the call.",
      { teamId: { type: "string", enum: ["playback-support", "billing"] } },
      ["teamId"],
      "Connecting you now."
    ),
    { type: "endCall" },
  ];
}
