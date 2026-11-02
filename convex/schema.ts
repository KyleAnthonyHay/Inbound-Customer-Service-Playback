import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * All data here is SYNTHETIC demo data. Customers, teams, slots, and bookings
 * are fictional and are not connected to MultiTracks' real systems.
 */
const plan = v.union(
  v.literal("Cloud Pro"),
  v.literal("Cloud"),
  v.literal("Premium"),
  v.literal("Rentals"),
  v.literal("Intro"),
  v.literal("none")
);
const subscriptionStatus = v.union(v.literal("active"), v.literal("past-due"), v.literal("expired"), v.literal("none"));

export default defineSchema({
  /**
   * The organization is where MultiTracks content is purchased and subscriptions
   * are shared (Playback User Guide, "Organizations vs. Users"). The six-digit
   * orgId is what Playback shows in Settings > About and is the lookup key the
   * agent asks callers for. Data in src/lib/demo/accounts.ts.
   */
  organizations: defineTable({
    orgId: v.string(),
    name: v.string(),
    plan,
    subscriptionStatus,
    renewsAt: v.optional(v.string()),
    expiredAt: v.optional(v.string()),
    pastDueSince: v.optional(v.string()),
    graceEndsAt: v.optional(v.string()),
    rentalCredits: v.optional(v.number()),
    teamSharingSeats: v.optional(v.object({ total: v.number(), used: v.number() })),
    notes: v.optional(v.string()),
    simulated: v.literal(true),
  }).index("by_orgId", ["orgId"]),

  /** A user. Subscription fields mirror the primary organization for older rows and tests. */
  customers: defineTable({
    customerId: v.string(), // e.g. "DEMO-1001"
    name: v.string(),
    email: v.string(),
    organization: v.string(),
    /** Primary organization (organizations.orgId). Optional so rows seeded before this field existed still validate. */
    orgId: v.optional(v.string()),
    memberships: v.optional(
      v.array(
        v.object({
          orgId: v.string(),
          role: v.union(v.literal("Org Admin"), v.literal("Campus Admin"), v.literal("Team Leader"), v.literal("Team Member")),
          teamSharing: v.boolean(),
          rentals: v.boolean(),
        })
      )
    ),
    plan,
    subscriptionStatus,
    renewsAt: v.optional(v.string()), // ISO date, for active plans
    expiredAt: v.optional(v.string()), // ISO date, for expired plans
    entitlements: v.array(v.string()),
    /** Demo-only notes the agent may read, e.g. reported Playback version. */
    notes: v.optional(v.string()),
  })
    .index("by_customerId", ["customerId"])
    .index("by_email", ["email"])
    .index("by_orgId", ["orgId"]),

  /** An organization's Library: purchased songs, rentals (which expire) and uploaded Cloud Songs. */
  orgSongs: defineTable({
    orgId: v.string(),
    title: v.string(),
    artist: v.string(),
    kind: v.union(v.literal("purchased"), v.literal("rental"), v.literal("cloud-song")),
    status: v.union(v.literal("active"), v.literal("expired")),
    expiresAt: v.optional(v.string()),
    simulated: v.literal(true),
  }).index("by_orgId", ["orgId"]),

  teams: defineTable({
    teamId: v.string(), // e.g. "playback-support"
    label: v.string(), // generic label, not MultiTracks' real org chart
    description: v.string(),
    /** Simulated staffing state, toggled for test scenarios. */
    status: v.union(v.literal("available"), v.literal("busy"), v.literal("offline")),
    /** Weekday hours in the team's own zone (24h start/end), e.g. 9-18 America/Chicago. */
    hours: v.object({ timeZone: v.string(), start: v.number(), end: v.number() }),
    simulated: v.literal(true),
  }).index("by_teamId", ["teamId"]),

  callbackSlots: defineTable({
    teamId: v.string(),
    startAt: v.string(), // ISO 8601 UTC
    endAt: v.string(),
    reserved: v.boolean(),
  })
    .index("by_team_start", ["teamId", "startAt"])
    .index("by_startAt", ["startAt"]),

  callbacks: defineTable({
    slotId: v.id("callbackSlots"),
    teamId: v.string(),
    customerId: v.optional(v.string()),
    callerName: v.string(),
    callbackNumber: v.string(),
    timeZone: v.string(),
    reason: v.string(),
    /** Idempotency key: the Vapi call id that created this booking. */
    callId: v.optional(v.string()),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
    createdAt: v.string(),
    simulated: v.literal(true),
  })
    .index("by_slot", ["slotId"])
    .index("by_callId", ["callId"]),

  /** One row per Vapi call, from assistant-level server messages. Feeds the "Past calls" list. */
  calls: defineTable({
    callId: v.string(),
    channel: v.union(v.literal("browser"), v.literal("phone"), v.literal("harness"), v.literal("unknown")),
    /** Caller ID (E.164) on phone calls, from Vapi's call.customer.number. */
    callerNumber: v.optional(v.string()),
    status: v.union(v.literal("in-progress"), v.literal("ended")),
    startedAt: v.number(), // epoch ms
    endedAt: v.optional(v.number()),
    endedReason: v.optional(v.string()),
    /** First thing the caller said, trimmed; the list's row title. */
    title: v.optional(v.string()),
    /** Vapi's end-of-call analysis summary, when present. */
    summary: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    toolCount: v.number(),
    transcriptCount: v.number(),
  })
    .index("by_callId", ["callId"])
    .index("by_startedAt", ["startedAt"]),

  /** Final transcript lines, so a past call can be replayed with its conversation. */
  transcripts: defineTable({
    callId: v.string(),
    at: v.number(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
  }).index("by_call", ["callId", "at"]),

  /** Activity log for the demo UI. Written by the tool webhook; read live by the call page. */
  callEvents: defineTable({
    callId: v.string(),
    at: v.number(), // epoch ms
    kind: v.union(
      v.literal("tool-start"),
      v.literal("tool-end"),
      v.literal("note")
    ),
    tool: v.optional(v.string()),
    toolCallId: v.optional(v.string()),
    label: v.string(),
    status: v.optional(v.union(v.literal("running"), v.literal("succeeded"), v.literal("failed"))),
    durationMs: v.optional(v.number()),
    /** Where the data came from: live external API, simulated company data, or app-internal. */
    source: v.union(v.literal("live"), v.literal("simulated"), v.literal("internal")),
    detail: v.optional(v.string()),
    /** Tool arguments as JSON (truncated), logged on tool-start so the UI can show the exact call. */
    args: v.optional(v.string()),
    /** Tool result as JSON (truncated), logged on tool-end. */
    output: v.optional(v.string()),
  }).index("by_call", ["callId", "at"]),
});
