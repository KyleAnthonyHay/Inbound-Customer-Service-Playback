import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * All data here is SYNTHETIC demo data. Customers, teams, slots, and bookings
 * are fictional and are not connected to MultiTracks' real systems.
 */
export default defineSchema({
  customers: defineTable({
    customerId: v.string(), // e.g. "DEMO-1001"
    name: v.string(),
    email: v.string(),
    organization: v.string(),
    plan: v.union(v.literal("Cloud Pro"), v.literal("Cloud"), v.literal("none")),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("none")
    ),
    renewsAt: v.optional(v.string()), // ISO date, for active plans
    expiredAt: v.optional(v.string()), // ISO date, for expired plans
    entitlements: v.array(v.string()),
    /** Demo-only notes the agent may read, e.g. reported Playback version. */
    notes: v.optional(v.string()),
  })
    .index("by_customerId", ["customerId"])
    .index("by_email", ["email"]),

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
