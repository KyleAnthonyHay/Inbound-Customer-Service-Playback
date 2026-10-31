import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { SUPPORT_HOURS, isWithinSupportHours, supportSlots, describeCentral } from "../src/lib/tools/schedule";

/** Simulated routing/availability check. Every team keeps weekday 9am-5pm Central hours. */
export const availability = query({
  args: { teamId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const teams = args.teamId
      ? await ctx.db.query("teams").withIndex("by_teamId", (q) => q.eq("teamId", args.teamId!)).collect()
      : await ctx.db.query("teams").collect();
    const now = new Date();
    const withinHours = isWithinSupportHours(now);
    const nextOpen = withinHours ? undefined : supportSlots(now, { limit: 1 })[0]?.startAt;
    return {
      source: "simulated" as const,
      hours: SUPPORT_HOURS.label,
      withinHours,
      ...(nextOpen ? { nextOpenAt: nextOpen, nextOpenSpoken: describeCentral(nextOpen) } : {}),
      teams: teams.map((t) => ({
        teamId: t.teamId,
        label: t.label,
        description: t.description,
        status: t.status,
        withinHours,
        canTransferNow: t.status === "available" && withinHours,
      })),
      ...(withinHours ? {} : { next: "Outside support hours: offer a callback during support hours instead." }),
    };
  },
});

/** Demo control: flip a team's simulated staffing state for test scenarios. */
export const setStatus = mutation({
  args: {
    teamId: v.string(),
    status: v.union(v.literal("available"), v.literal("busy"), v.literal("offline")),
  },
  handler: async (ctx, args) => {
    const t = await ctx.db.query("teams").withIndex("by_teamId", (q) => q.eq("teamId", args.teamId)).unique();
    if (!t) return { ok: false as const, reason: "not-found" as const };
    await ctx.db.patch(t._id, { status: args.status });
    return { ok: true as const };
  },
});
