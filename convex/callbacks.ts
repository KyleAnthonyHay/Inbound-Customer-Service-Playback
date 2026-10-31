import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { SUPPORT_HOURS, supportSlots, isValidSlotStart, describeCentral, normalizePhoneNumber } from "../src/lib/tools/schedule";

/**
 * Callback slots are generated on the fly from support hours (weekdays 9am to
 * 5pm Central, 30-minute slots), so they never run out or go stale. A slot is
 * open unless a confirmed booking already holds it. The slotId is the slot's
 * ISO start time.
 */
const LEAD_MS = 30 * 60 * 1000; // earliest callback is 30 minutes from now

async function bookedStarts(ctx: QueryCtx, teamId: string, fromIso: string) {
  const rows = await ctx.db
    .query("callbacks")
    .withIndex("by_team_start", (q) => q.eq("teamId", teamId).gte("startAt", fromIso))
    .take(500);
  return new Set(rows.filter((r) => r.status === "confirmed" && r.startAt).map((r) => r.startAt as string));
}

export const availableSlots = query({
  args: {
    teamId: v.string(),
    fromIso: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const earliest = Date.now() + LEAD_MS;
    const requested = args.fromIso ? Date.parse(args.fromIso) : NaN;
    const from = new Date(Number.isNaN(requested) ? earliest : Math.max(requested, earliest));
    const limit = Math.min(args.limit ?? 6, 20);
    const booked = await bookedStarts(ctx, args.teamId, from.toISOString());
    const open = supportSlots(from, { days: 21 }).filter((s) => !booked.has(s.startAt)).slice(0, limit);
    return {
      source: "simulated" as const,
      hours: SUPPORT_HOURS.label,
      slots: open.map((s) => ({ slotId: s.startAt, startAt: s.startAt, endAt: s.endAt, spoken: describeCentral(s.startAt) })),
    };
  },
});

/**
 * Reserve a slot. Prevents double-booking (slot already held) and duplicate
 * submissions (same callId already booked). Only returns ok:true after the
 * write succeeds; the agent must not confirm before this.
 */
export const reserve = mutation({
  args: {
    slotId: v.string(),
    teamId: v.optional(v.string()),
    callerName: v.string(),
    callbackNumber: v.string(),
    timeZone: v.string(),
    reason: v.string(),
    customerId: v.optional(v.string()),
    callId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const teamId = args.teamId ?? "playback-support";
    if (args.callId) {
      const existing = await ctx.db
        .query("callbacks")
        .withIndex("by_callId", (q) => q.eq("callId", args.callId!))
        .first();
      if (existing && existing.status === "confirmed") {
        return {
          ok: true as const,
          duplicate: true as const,
          bookingId: existing._id,
          startAt: existing.startAt,
          spoken: existing.startAt ? describeCentral(existing.startAt) : undefined,
          callbackNumber: existing.callbackNumber,
          source: "simulated" as const,
        };
      }
    }
    const at = Date.parse(args.slotId);
    if (Number.isNaN(at)) return { ok: false as const, reason: "slot-not-found" as const, source: "simulated" as const };
    const startAt = new Date(at).toISOString();
    if (!isValidSlotStart(startAt))
      return { ok: false as const, reason: "outside-support-hours" as const, hours: SUPPORT_HOURS.label, source: "simulated" as const };
    if (at < Date.now() + LEAD_MS) return { ok: false as const, reason: "slot-in-past" as const, source: "simulated" as const };
    const number = normalizePhoneNumber(args.callbackNumber);
    if (!number) return { ok: false as const, reason: "invalid-number" as const, source: "simulated" as const };

    const taken = await ctx.db
      .query("callbacks")
      .withIndex("by_team_start", (q) => q.eq("teamId", teamId).eq("startAt", startAt))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .first();
    if (taken) return { ok: false as const, reason: "slot-taken" as const, source: "simulated" as const };

    const endAt = new Date(at + SUPPORT_HOURS.slotMinutes * 60 * 1000).toISOString();
    const bookingId = await ctx.db.insert("callbacks", {
      teamId,
      startAt,
      endAt,
      customerId: args.customerId,
      callerName: args.callerName,
      callbackNumber: number,
      timeZone: args.timeZone,
      reason: args.reason,
      callId: args.callId,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      simulated: true,
    });
    return {
      ok: true as const,
      duplicate: false as const,
      bookingId,
      startAt,
      endAt,
      spoken: describeCentral(startAt),
      callbackNumber: number,
      source: "simulated" as const,
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("callbacks").order("desc").take(50),
});
