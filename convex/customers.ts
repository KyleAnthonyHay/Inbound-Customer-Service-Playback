import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Demo customer lookup. This is NOT identity verification; it matches on a
 * fictional customer ID or email only. Returns a structured result so the
 * agent can distinguish "found" from "not found" from "ambiguous".
 */
export const lookup = query({
  args: {
    customerId: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.customerId) {
      const c = await ctx.db
        .query("customers")
        .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId!.trim().toUpperCase()))
        .unique();
      return c ? { ok: true as const, customer: strip(c), source: "simulated" as const } : notFound();
    }
    if (args.email) {
      const c = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", args.email!.trim().toLowerCase()))
        .unique();
      return c ? { ok: true as const, customer: strip(c), source: "simulated" as const } : notFound();
    }
    if (args.name) {
      const needle = args.name.trim().toLowerCase();
      const all = await ctx.db.query("customers").collect();
      const matches = all.filter((c) => c.name.toLowerCase().includes(needle));
      if (matches.length === 1) return { ok: true as const, customer: strip(matches[0]), source: "simulated" as const };
      if (matches.length > 1)
        return { ok: false as const, reason: "ambiguous" as const, candidates: matches.map((m) => m.name), source: "simulated" as const };
      return notFound();
    }
    return { ok: false as const, reason: "missing-input" as const, source: "simulated" as const };
  },
});

function notFound() {
  return { ok: false as const, reason: "not-found" as const, source: "simulated" as const };
}

function strip<T extends { _id: unknown; _creationTime: unknown }>(c: T) {
  const { _id: _ignoredId, _creationTime: _ignoredTime, ...rest } = c;
  return rest;
}
