import { internalMutation } from "./_generated/server";

/**
 * Seeds clearly synthetic demo data. Safe to re-run: it wipes and re-inserts.
 * Run with: npx convex run seed:run
 */

const customers = [
  {
    customerId: "DEMO-1001",
    name: "Jordan Avery",
    email: "jordan.avery@example.org",
    organization: "Riverbend Community Church (demo)",
    plan: "Cloud Pro" as const,
    subscriptionStatus: "active" as const,
    renewsAt: "2027-03-14",
    entitlements: ["cloud-sync", "playback-pro-features", "multitrack-downloads"],
    notes:
      "Active Cloud Pro subscriber. Reports a 'Cloud Pro expired' message in Playback despite an active plan. Last known Playback version 8.6.2 (iPad).",
  },
  {
    customerId: "DEMO-1002",
    name: "Priya Natarajan",
    email: "priya.n@example.org",
    organization: "Harbor Light Fellowship (demo)",
    plan: "Cloud Pro" as const,
    subscriptionStatus: "expired" as const,
    expiredAt: "2026-09-02",
    entitlements: [],
    notes:
      "Cloud Pro subscription genuinely expired on 2026-09-02. Sees 'Cloud Pro expired' message; a software update will not resolve this.",
  },
  {
    customerId: "DEMO-1003",
    name: "Marcus Bell",
    email: "marcus.bell@example.org",
    organization: "Northgate Worship Collective (demo)",
    plan: "Cloud" as const,
    subscriptionStatus: "active" as const,
    renewsAt: "2027-01-20",
    entitlements: ["cloud-sync", "multitrack-downloads"],
    notes: "Reports no audio from the right channel when using a USB interface on iPhone.",
  },
  {
    customerId: "DEMO-1004",
    name: "Elena Cruz",
    email: "elena.cruz@example.org",
    organization: "Grace Chapel (demo)",
    plan: "none" as const,
    subscriptionStatus: "none" as const,
    entitlements: [],
    notes: "No subscription on file. Uses Playback with purchased songs only.",
  },
];

const teams = [
  {
    teamId: "playback-support",
    label: "Playback Technical Support",
    description: "Song loading, audio output, device and version issues.",
    status: "available" as const,
    simulated: true as const,
  },
  {
    teamId: "billing",
    label: "Billing & Accounts",
    description: "Subscriptions, refunds, and account administration.",
    status: "available" as const,
    simulated: true as const,
  },
];

// Hours (weekdays 9am-5pm Central) and callback slots come from
// src/lib/tools/schedule.ts, so nothing time-based is seeded here.

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of ["callbacks", "callbackSlots", "teams", "customers"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    for (const c of customers) await ctx.db.insert("customers", c);
    for (const t of teams) await ctx.db.insert("teams", t);
    return { customers: customers.length, teams: teams.length };
  },
});
