import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  diagnoseSubscription,
  normalizeOrgId,
  songAccess as songAccessOf,
  type DemoOrganization,
  type DemoOrgSong,
  type Membership,
} from "../src/lib/demo/accounts";

/**
 * Demo account lookup. This is NOT identity verification; it matches on a
 * fictional organization ID, customer ID, email or name only. Returns a
 * structured result so the agent can distinguish "found" from "not found"
 * from "ambiguous", plus a diagnosis of the subscription state with a `next`
 * hint (same convention as the callback tools).
 *
 * The organization ID (six digits, Playback Settings > About) is the primary
 * key: it is what callers can read off their screen and it is the record
 * that owns purchases and subscriptions. See src/lib/demo/accounts.ts.
 */
const lookupArgs = {
  orgId: v.optional(v.string()),
  customerId: v.optional(v.string()),
  email: v.optional(v.string()),
  name: v.optional(v.string()),
};

type Found = { customer: Doc<"customers"> | null; org: Doc<"organizations"> | null };
type Resolved =
  | ({ ok: true } & Found)
  | { ok: false; reason: "not-found" | "ambiguous" | "missing-input" | "invalid-orgId"; candidates?: string[] };

async function resolve(ctx: QueryCtx, args: { orgId?: string; customerId?: string; email?: string; name?: string }): Promise<Resolved> {
  if (args.orgId) {
    const id = normalizeOrgId(args.orgId);
    if (!id) return { ok: false, reason: "invalid-orgId" };
    const org = await ctx.db.query("organizations").withIndex("by_orgId", (q) => q.eq("orgId", id)).unique();
    if (!org) return { ok: false, reason: "not-found" };
    // If the caller also gave who they are, attach that member; otherwise the org's first admin-ish member.
    let customer: Doc<"customers"> | null = null;
    if (args.email || args.customerId || args.name) {
      const inner = await resolve(ctx, { customerId: args.customerId, email: args.email, name: args.name });
      if (inner.ok && inner.customer && inner.customer.memberships?.some((m) => m.orgId === id)) customer = inner.customer;
    }
    return { ok: true, customer, org };
  }
  let customer: Doc<"customers"> | null = null;
  if (args.customerId) {
    customer = await ctx.db
      .query("customers")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId!.trim().toUpperCase().replace(/\s+/g, "")))
      .unique();
  } else if (args.email) {
    customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email!.trim().toLowerCase()))
      .unique();
  } else if (args.name) {
    const needle = args.name.trim().toLowerCase();
    const all = await ctx.db.query("customers").collect();
    const matches = all.filter((c) => c.name.toLowerCase().includes(needle));
    if (matches.length > 1) return { ok: false, reason: "ambiguous", candidates: matches.map((m) => m.name) };
    customer = matches[0] ?? null;
  } else {
    return { ok: false, reason: "missing-input" };
  }
  if (!customer) return { ok: false, reason: "not-found" };
  const org = customer.orgId
    ? await ctx.db.query("organizations").withIndex("by_orgId", (q) => q.eq("orgId", customer!.orgId!)).unique()
    : null;
  return { ok: true, customer, org };
}

async function orgsOf(ctx: QueryCtx, ids: string[]) {
  const out: Doc<"organizations">[] = [];
  for (const id of ids) {
    const o = await ctx.db.query("organizations").withIndex("by_orgId", (q) => q.eq("orgId", id)).unique();
    if (o) out.push(o);
  }
  return out;
}

const SIM = { source: "simulated" as const };

export const lookup = query({
  args: lookupArgs,
  handler: async (ctx, args) => {
    const r = await resolve(ctx, args);
    if (!r.ok) {
      if (r.reason === "invalid-orgId")
        return { ok: false as const, reason: r.reason, next: "An organization ID is six digits, shown in Playback under Settings > About. Ask the caller to read it again, or use the email on the account.", ...SIM };
      return { ok: false as const, reason: r.reason, ...(r.candidates ? { candidates: r.candidates } : {}), ...SIM };
    }
    const { customer, org } = r;
    const membership: Membership | undefined = customer?.memberships?.find((m) => m.orgId === org?.orgId);
    const otherOrgs = customer ? await orgsOf(ctx, (customer.memberships ?? []).map((m) => m.orgId).filter((id) => id !== org?.orgId)) : [];
    const library = org ? await ctx.db.query("orgSongs").withIndex("by_orgId", (q) => q.eq("orgId", org.orgId)).collect() : [];
    const diagnosis = org ? diagnoseSubscription(stripOrg(org), membership, otherOrgs.map(stripOrg)) : undefined;
    return {
      ok: true as const,
      ...(customer ? { customer: strip(customer) } : {}),
      ...(org ? { organization: stripOrg(org) } : {}),
      ...(membership ? { membership } : {}),
      otherOrganizations: otherOrgs.map((o) => ({ orgId: o.orgId, name: o.name, plan: o.plan, subscriptionStatus: o.subscriptionStatus })),
      library: {
        count: library.length,
        songs: library.map((s) => ({ title: s.title, artist: s.artist, kind: s.kind, status: s.status, expiresAt: s.expiresAt })),
      },
      ...(diagnosis ? { diagnosis, next: diagnosis.next } : {}),
      ...SIM,
    };
  },
});

/** Can this organization load a specific song? Resolves the org the same way lookup does. */
export const songAccess = query({
  args: { ...lookupArgs, songTitle: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx, args);
    if (!r.ok) return { ok: false as const, reason: r.reason, ...(r.candidates ? { candidates: r.candidates } : {}), ...SIM };
    const org = r.org;
    if (!org) return { ok: false as const, reason: "no-organization" as const, ...SIM };
    const membership = r.customer?.memberships?.find((m) => m.orgId === org.orgId);
    const library = await ctx.db.query("orgSongs").withIndex("by_orgId", (q) => q.eq("orgId", org.orgId)).collect();
    const access = songAccessOf(stripOrg(org), membership, library.map(stripSong), args.songTitle);
    return {
      ok: true as const,
      organization: { orgId: org.orgId, name: org.name, plan: org.plan, subscriptionStatus: org.subscriptionStatus },
      ...access,
      ...SIM,
    };
  },
});

function strip<T extends { _id: unknown; _creationTime: unknown }>(c: T): Omit<T, "_id" | "_creationTime"> {
  const copy: Record<string, unknown> = { ...c };
  delete copy._id;
  delete copy._creationTime;
  return copy as Omit<T, "_id" | "_creationTime">;
}
const stripOrg = (o: Doc<"organizations">): DemoOrganization => strip(o) as DemoOrganization;
const stripSong = (s: Doc<"orgSongs">): DemoOrgSong => strip(s) as DemoOrgSong;
