import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { formatHour, formatLocal, localToUtcMs, normalizeTime, normalizeTimeZone, partsIn, resolveDate, WEEKEND, weekdayIn } from "./time";

/* ------------------------------------------------------------------ queries */

/**
 * Callback slots for a team. Two modes:
 *  - With preferredDate/preferredTime/timeZone: says whether THAT time is open, why not if it
 *    isn't, and lists the nearest open alternatives. The agent must relay an unavailable
 *    request explicitly instead of substituting a slot.
 *  - Without: the next open slots from fromIso (or now).
 * Every slot carries a pre-formatted `local` string in the caller's zone.
 */
export const availableSlots = query({
  args: {
    teamId: v.string(),
    fromIso: v.optional(v.string()),
    limit: v.optional(v.number()),
    preferredDate: v.optional(v.string()), // YYYY-MM-DD in the caller's zone
    preferredTime: v.optional(v.string()), // HH:MM 24h in the caller's zone
    timeZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nowMs = Date.now();
    const limit = Math.min(args.limit ?? 4, 10);
    const tz = normalizeTimeZone(args.timeZone) ?? "America/Chicago";
    const tzNote = args.timeZone && !normalizeTimeZone(args.timeZone)
      ? `Time zone "${args.timeZone}" was not recognized; times below are in Central (America/Chicago). Confirm the caller's zone.`
      : undefined;

    const team = await ctx.db.query("teams").withIndex("by_teamId", (q) => q.eq("teamId", args.teamId)).unique();
    const hours = team?.hours ?? { timeZone: "America/Chicago", start: 9, end: 18 };

    const rows = await ctx.db
      .query("callbackSlots")
      .withIndex("by_team_start", (q) => q.eq("teamId", args.teamId).gte("startAt", new Date(nowMs).toISOString()))
      .take(1500);
    const open = rows.filter((r) => !r.reserved);
    const toSlot = (s: (typeof rows)[number]) => ({ slotId: s._id, startAt: s.startAt, endAt: s.endAt, local: formatLocal(s.startAt, tz) });

    // Team hours expressed in the caller's zone, on the relevant day.
    const resolvedDate = args.preferredDate ? resolveDate(args.preferredDate, tz, nowMs) : null;
    const refDay = resolvedDate ?? new Date(nowMs).toISOString().slice(0, 10);
    const [ry, rm, rd] = refDay.split("-").map(Number);
    const hoursStartMs = localToUtcMs(refDay, `${String(hours.start).padStart(2, "0")}:00`, hours.timeZone) ?? nowMs;
    const hoursEndMs = localToUtcMs(refDay, `${String(hours.end).padStart(2, "0")}:00`, hours.timeZone) ?? nowMs;
    const zoneName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(hoursStartMs)).find((p) => p.type === "timeZoneName")?.value ?? "";
    const hoursLocal = `${formatHour(hoursStartMs, tz)} to ${formatHour(hoursEndMs, tz)} ${zoneName}, weekdays only`;

    const base = {
      source: "simulated" as const,
      timeZone: tz,
      timeZoneNote: tzNote,
      teamHoursLocal: hoursLocal,
      now: new Date(nowMs).toISOString(),
      nowLocal: formatLocal(nowMs, tz),
    };

    // ---- Mode 1: a specific requested time
    if (args.preferredDate && args.preferredTime) {
      const wantMs = resolvedDate ? localToUtcMs(resolvedDate, normalizeTime(args.preferredTime) ?? "", tz) : null;
      if (wantMs === null) {
        return {
          ...base,
          requested: { available: false as const, reason: "unparseable" as const, detail: "preferredDate must be YYYY-MM-DD or a weekday name, preferredTime HH:MM (24h) or like '5 PM'." },
          slots: open.slice(0, limit).map(toSlot),
          instruction: "The requested time could not be parsed. Ask the caller to restate the day and time.",
        };
      }
      const wantIso = new Date(wantMs).toISOString();
      const wantLocal = formatLocal(wantMs, tz);
      const exact = rows.find((r) => r.startAt === wantIso);
      const nearest = [...open]
        .sort((a, b) => Math.abs(Date.parse(a.startAt) - wantMs) - Math.abs(Date.parse(b.startAt) - wantMs))
        .slice(0, limit)
        .map(toSlot);

      if (exact && !exact.reserved) {
        return {
          ...base,
          requested: { available: true as const, iso: wantIso, local: wantLocal, slotId: exact._id, endAt: exact.endAt },
          slots: nearest,
          instruction: `${wantLocal} is open. Read the full details back (time, zone, number) and get an explicit yes before calling reserve_callback with slotId ${exact._id}.`,
        };
      }

      let reason: "in-the-past" | "weekend" | "outside-hours" | "taken" | "no-slot";
      const localParts = partsIn(wantMs, tz);
      const teamHour = partsIn(wantMs, hours.timeZone).h;
      if (wantMs < nowMs) reason = "in-the-past";
      else if (exact?.reserved) reason = "taken";
      else if (WEEKEND.has(weekdayIn(wantMs, hours.timeZone))) reason = "weekend";
      else if (teamHour < hours.start || teamHour >= hours.end) reason = "outside-hours";
      else reason = "no-slot";

      const why: Record<typeof reason, string> = {
        "in-the-past": "that time has already passed",
        taken: "that slot is already booked",
        weekend: "the team does not take callbacks on weekends",
        "outside-hours": `that is outside the team's callback hours (${hoursLocal})`,
        "no-slot": `no slot starts at that time (slots start on the hour and half hour, ${localParts.h}:${String(localParts.mi).padStart(2, "0")} requested)`,
      };
      return {
        ...base,
        requested: { available: false as const, reason, iso: wantIso, local: wantLocal, detail: why[reason] },
        slots: nearest,
        instruction: `NOT AVAILABLE: ${wantLocal} is not open because ${why[reason]}. Tell the caller this plainly first, in those words, then offer the nearest alternatives using their 'local' strings. Never present an alternative as if it were the time they asked for.`,
      };
    }

    // ---- Mode 2: next open slots from a start time
    const from = args.fromIso && !Number.isNaN(Date.parse(args.fromIso)) ? Math.max(Date.parse(args.fromIso), nowMs) : nowMs;
    const next = open.filter((r) => Date.parse(r.startAt) >= from).slice(0, limit).map(toSlot);
    return {
      ...base,
      requested: undefined,
      slots: next,
      instruction: next.length
        ? "Offer these times using their 'local' strings. If the caller names a specific day and time, call this tool again with preferredDate, preferredTime and timeZone to check that exact time."
        : "No open slots in range. Ask the caller for a later day or offer the team's hours.",
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
    const tz = normalizeTimeZone(args.timeZone) ?? "America/Chicago";
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
          local: slot ? formatLocal(slot.startAt, tz) : undefined,
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
      local: formatLocal(slot.startAt, tz),
      source: "simulated" as const,
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("callbacks").order("desc").take(50),
});
