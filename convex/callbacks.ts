import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** List open callback slots for a team, from a given time, capped. */
export const availableSlots = query({
  args: {
    teamId: v.string(),
    fromIso: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const from = args.fromIso ?? new Date().toISOString();
    const limit = Math.min(args.limit ?? 6, 20);
    const rows = await ctx.db
      .query("callbackSlots")
      .withIndex("by_team_start", (q) => q.eq("teamId", args.teamId).gte("startAt", from))
      .take(200);
    const open = rows.filter((r) => !r.reserved).slice(0, limit);
    return {
      source: "simulated" as const,
      slots: open.map((s) => ({ slotId: s._id, startAt: s.startAt, endAt: s.endAt })),
    };
  },
});

/**
 * Reserve a slot. Prevents double-booking (slot already reserved) and
 * duplicate submissions (same callId already booked). Only returns ok:true
 * after the write succeeds; the agent must not confirm before this.
 */
export const reserve = mutation({
  args: {
    slotId: v.id("callbackSlots"),
    callerName: v.string(),
    callbackNumber: v.string(),
    timeZone: v.string(),
    reason: v.string(),
    customerId: v.optional(v.string()),
    callId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.callId) {
      const existing = await ctx.db
        .query("callbacks")
        .withIndex("by_callId", (q) => q.eq("callId", args.callId!))
        .first();
      if (existing && existing.status === "confirmed") {
        const slot = await ctx.db.get(existing.slotId);
        return {
          ok: true as const,
          duplicate: true as const,
          bookingId: existing._id,
          startAt: slot?.startAt,
          source: "simulated" as const,
        };
      }
    }
    const slot = await ctx.db.get(args.slotId);
    if (!slot) return { ok: false as const, reason: "slot-not-found" as const, source: "simulated" as const };
    if (slot.reserved) return { ok: false as const, reason: "slot-taken" as const, source: "simulated" as const };
    if (!/^\+?[\d\s().-]{7,}$/.test(args.callbackNumber))
      return { ok: false as const, reason: "invalid-number" as const, source: "simulated" as const };

    await ctx.db.patch(slot._id, { reserved: true });
    const bookingId = await ctx.db.insert("callbacks", {
      slotId: slot._id,
      teamId: slot.teamId,
      customerId: args.customerId,
      callerName: args.callerName,
      callbackNumber: args.callbackNumber,
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
      startAt: slot.startAt,
      endAt: slot.endAt,
      source: "simulated" as const,
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("callbacks").order("desc").take(50),
});
