import { internalMutation } from "./_generated/server";
import { localToUtcMs, partsIn, WEEKEND, weekdayIn } from "./time";
import { customers, organizations, orgSongs } from "../src/lib/demo/accounts";

/**
 * Seeds clearly synthetic demo data. Safe to re-run: it wipes and re-inserts.
 * Run with: npx convex run seed:run
 *
 * Organizations, customers and their song libraries live in
 * src/lib/demo/accounts.ts so the lookup logic can be unit-tested on the same data.
 */

const teams = [
  {
    teamId: "playback-support",
    label: "Playback Technical Support",
    description: "Song loading, audio output, device and version issues.",
    status: "available" as const,
    hours: { timeZone: "America/Chicago", start: 9, end: 18 }, // 9am-6pm US Central
    simulated: true as const,
  },
  {
    teamId: "billing",
    label: "Billing & Accounts",
    description: "Subscriptions, refunds, and account administration.",
    status: "busy" as const,
    hours: { timeZone: "America/Chicago", start: 9, end: 17 },
    simulated: true as const,
  },
];

/** 30-minute slots on weekdays within each team's local hours for the next 30 days. */
function buildSlots(now: Date) {
  const slots: { teamId: string; startAt: string; endAt: string; reserved: boolean }[] = [];
  for (const team of teams) {
    const tz = team.hours.timeZone;
    const today = partsIn(now.getTime(), tz);
    const todayUtc = Date.UTC(today.y, today.mo - 1, today.d);
    for (let day = 1; day <= 30; day++) {
      const dayMs = todayUtc + day * 86400000;
      if (WEEKEND.has(weekdayIn(dayMs + 12 * 3600000, "UTC"))) continue; // weekdays only
      const date = new Date(dayMs).toISOString().slice(0, 10);
      for (let hour = team.hours.start; hour < team.hours.end; hour++) {
        for (const minute of [0, 30]) {
          const startMs = localToUtcMs(date, `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, tz);
          if (startMs === null) continue;
          const end = new Date(startMs + 30 * 60 * 1000);
          // Pre-reserve a few slots so "slot unavailable" scenarios are testable.
          const reserved = (day * 7 + hour + minute / 30) % 11 === 0;
          slots.push({ teamId: team.teamId, startAt: new Date(startMs).toISOString(), endAt: end.toISOString(), reserved });
        }
      }
    }
  }
  return slots;
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of ["callbacks", "callbackSlots", "teams", "customers", "organizations", "orgSongs"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    for (const o of organizations) await ctx.db.insert("organizations", o);
    for (const c of customers) await ctx.db.insert("customers", c);
    for (const s of orgSongs) await ctx.db.insert("orgSongs", s);
    for (const t of teams) await ctx.db.insert("teams", t);
    const slots = buildSlots(new Date());
    for (const s of slots) await ctx.db.insert("callbackSlots", s);
    return { organizations: organizations.length, customers: customers.length, songs: orgSongs.length, teams: teams.length, slots: slots.length };
  },
});
