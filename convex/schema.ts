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
    /** Legacy field from older seeds; hours now come from src/lib/tools/schedule.ts. */
    hoursUtc: v.optional(v.object({ start: v.number(), end: v.number() })),
    simulated: v.literal(true),
  }).index("by_teamId", ["teamId"]),

  /** Legacy: slots are now generated from support hours. Kept so older data still validates. */
  callbackSlots: defineTable({
    teamId: v.string(),
    startAt: v.string(), // ISO 8601 UTC
    endAt: v.string(),
    reserved: v.boolean(),
  })
    .index("by_team_start", ["teamId", "startAt"])
    .index("by_startAt", ["startAt"]),

  callbacks: defineTable({
    /** Legacy pre-seeded slot reference; new bookings use startAt instead. */
    slotId: v.optional(v.id("callbackSlots")),
    teamId: v.string(),
    startAt: v.optional(v.string()), // ISO 8601 UTC slot start
    endAt: v.optional(v.string()),
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
    .index("by_team_start", ["teamId", "startAt"])
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
  }).index("by_call", ["callId", "at"]),
});
