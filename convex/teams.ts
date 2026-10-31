import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { partsIn, WEEKEND, weekdayIn } from "./time";

/** Simulated routing/availability check. */
export const availability = query({
  args: { teamId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const teams = args.teamId
      ? await ctx.db.query("teams").withIndex("by_teamId", (q) => q.eq("teamId", args.teamId!)).collect()
      : await ctx.db.query("teams").collect();
    const nowMs = Date.now();
    return {
      source: "simulated" as const,
      teams: teams.map((t) => {
        const hours = t.hours ?? { timeZone: "America/Chicago", start: 9, end: 18 };
        const localHour = partsIn(nowMs, hours.timeZone).h;
        const withinHours = !WEEKEND.has(weekdayIn(nowMs, hours.timeZone)) && localHour >= hours.start && localHour < hours.end;
        return {
          teamId: t.teamId,
          label: t.label,
          description: t.description,
          status: t.status,
          withinHours,
          canTransferNow: t.status === "available" && withinHours,
        };
      }),
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
