import type { MutationCtx } from "../_generated/server";
import { customers, organizations, orgSongs } from "../../src/lib/demo/accounts";

/** Add/update only known fictional accounts. Preserve IDs, bookings and history. */
export async function upsertDemoAccounts(ctx: Pick<MutationCtx, "db">) {
  let created = 0;
  let updated = 0;
  for (const org of organizations) {
    const row = await ctx.db.query("organizations").withIndex("by_orgId", q => q.eq("orgId", org.orgId)).unique();
    if (row) { await ctx.db.replace(row._id, org); updated++; }
    else { await ctx.db.insert("organizations", org); created++; }
  }
  for (const customer of customers) {
    const row = await ctx.db.query("customers").withIndex("by_customerId", q => q.eq("customerId", customer.customerId)).unique();
    if (row) { await ctx.db.replace(row._id, customer); updated++; }
    else { await ctx.db.insert("customers", customer); created++; }
  }
  for (const song of orgSongs) {
    const library = await ctx.db.query("orgSongs").withIndex("by_orgId", q => q.eq("orgId", song.orgId)).take(201);
    if (library.length > 200) throw new Error("Demo library exceeds the bounded account migration limit.");
    const row = library.find(s => s.title === song.title && s.kind === song.kind);
    if (row) { await ctx.db.replace(row._id, song); updated++; }
    else { await ctx.db.insert("orgSongs", song); created++; }
  }
  return { created, updated, organizations: organizations.length, customers: customers.length, songs: orgSongs.length };
}
