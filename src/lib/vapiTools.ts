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
      "Search MultiTracks' official Playback support documentation for troubleshooting steps. Use before giving any troubleshooting instruction. Returns documented steps with source URLs; only give steps that appear in the results.",
      {
        query: { type: "string", description: "Symptom or topic in the caller's words, e.g. 'song stuck downloading' or 'no sound from USB interface'." },
        category: { type: "string", enum: ["song-loading", "audio-output", "requirements", "subscription", "general"], description: "Optional category filter." },
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
      "Get the next open callback slots for a team (simulated scheduling). Support hours are weekdays 9am to 5pm Central. Each slot has a 'spoken' Central-time label; convert to the caller's time zone when it differs. On phone calls the result includes callerIdNumber, the number the caller is calling from.",
      {
        teamId: { type: "string", enum: ["playback-support", "billing"] },
        fromIso: { type: "string", description: "Optional earliest time, ISO 8601." },
      },
      ["teamId"],
      "Let me check available callback times."
    ),
    fn(
      "reserve_callback",
      "Reserve a callback slot after the caller has explicitly confirmed the time, time zone, and callback number. Only say the callback is confirmed if this returns ok=true. If it fails or the slot was taken, explain and offer another slot.",
      {
        slotId: { type: "string", description: "slotId from get_callback_slots." },
        callerName: { type: "string" },
        teamId: { type: "string", enum: ["playback-support", "billing"] },
        callbackNumber: {
          type: "string",
          description: "Number to call back, digits as the caller said them. Pass 'caller-id' when the caller wants the call back on the number they are calling from.",
        },
        timeZone: { type: "string", description: "Caller's time zone, e.g. America/Chicago or 'Central'." },
        reason: { type: "string", description: "One-line summary of the issue for the team." },
        customerId: { type: "string" },
      },
      ["slotId", "callerName", "timeZone", "reason"],
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
