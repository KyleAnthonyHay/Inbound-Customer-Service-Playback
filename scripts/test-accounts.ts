import { test } from "node:test";
import assert from "node:assert/strict";
import {
  customers,
  diagnoseSubscription,
  matchSongs,
  normalizeOrgId,
  organizations,
  orgSongs,
  songAccess,
  type DemoCustomer,
} from "../src/lib/demo/accounts";
import { SYSTEM_PROMPT, SPEAKER_PROMPT } from "../src/lib/assistant";
import { buildToolDefinitions } from "../src/lib/vapiTools";
import { TOOL_META } from "../src/lib/tools/meta";

/** Mirrors what convex/customers.ts does per customer, without a database. */
function diagnose(customerId: string) {
  const c = customers.find((x) => x.customerId === customerId)!;
  const org = organizations.find((o) => o.orgId === c.orgId)!;
  const membership = c.memberships.find((m) => m.orgId === c.orgId);
  const others = c.memberships.filter((m) => m.orgId !== c.orgId).map((m) => organizations.find((o) => o.orgId === m.orgId)!);
  return { c, org, membership, diagnosis: diagnoseSubscription(org, membership, others) };
}
function access(customerId: string, title: string) {
  const { c, org, membership } = diagnose(customerId);
  return songAccess(org, membership, orgSongs.filter((s) => s.orgId === c.orgId), title);
}

test("seed data is internally consistent: every customer and song points at a real organization", () => {
  const ids = new Set(organizations.map((o) => o.orgId));
  assert.equal(ids.size, organizations.length, "org IDs are unique");
  for (const o of organizations) assert.match(o.orgId, /^\d{6}$/, `${o.name} has a six-digit org ID`);
  for (const c of customers) {
    assert.ok(ids.has(c.orgId), `${c.customerId} primary org exists`);
    assert.ok(c.memberships.some((m) => m.orgId === c.orgId), `${c.customerId} is a member of its primary org`);
    for (const m of c.memberships) assert.ok(ids.has(m.orgId), `${c.customerId} membership org exists`);
    const org = organizations.find((o) => o.orgId === c.orgId)!;
    assert.equal(c.plan, org.plan, `${c.customerId} legacy plan mirrors the org`);
    assert.equal(c.subscriptionStatus, org.subscriptionStatus, `${c.customerId} legacy status mirrors the org`);
  }
  for (const s of orgSongs) assert.ok(ids.has(s.orgId), `${s.title} belongs to a real org`);
  // The original four demo customers are still there with their original keys.
  for (const id of ["DEMO-1001", "DEMO-1002", "DEMO-1003", "DEMO-1004"]) assert.ok(customers.some((c) => c.customerId === id), id);
  assert.equal(customers.find((c) => c.customerId === "DEMO-1002")!.email, "priya.n@example.org");
  assert.equal(new Set(customers.map((c) => c.email)).size, customers.length, "emails are unique");
});

test("organization IDs normalize from spoken digits and reject anything else", () => {
  assert.equal(normalizeOrgId("480113"), "480113");
  assert.equal(normalizeOrgId("4 8 0 1 1 3"), "480113");
  assert.equal(normalizeOrgId("org 480-113"), "480113");
  assert.equal(normalizeOrgId("48011"), null);
  assert.equal(normalizeOrgId("DEMO-1001"), null);
  assert.equal(normalizeOrgId(undefined), null);
});

test("active Cloud Pro org seeing 'expired' is diagnosed as a software issue, not billing", () => {
  const { diagnosis } = diagnose("DEMO-1001");
  assert.equal(diagnosis.code, "active");
  assert.match(diagnosis.next, /software issue/);
  assert.match(diagnosis.next, /get_relevant_changes_since_version/);
  assert.match(diagnosis.next, /Restore Purchases/);
});

test("genuinely expired subscription points to billing and says purchased songs still work", () => {
  const { diagnosis } = diagnose("DEMO-1002");
  assert.equal(diagnosis.code, "expired");
  assert.match(diagnosis.summary, /expired on 2026-09-02/);
  assert.match(diagnosis.summary, /Purchased songs still download/);
  assert.match(diagnosis.next, /billing/);
  assert.match(diagnosis.next, /Do not suggest an update/);
  // Their purchased song is still accessible; a catalog song is not.
  assert.equal(access("DEMO-1002", "Way Maker").access, "purchased");
  assert.equal(access("DEMO-1002", "Goodness of God").access, "not-in-library");
});

test("past-due payment: features still work until the grace date, billing needs the card", () => {
  const { diagnosis } = diagnose("DEMO-1007");
  assert.equal(diagnosis.code, "past-due");
  assert.match(diagnosis.summary, /failed on 2026-10-28/);
  assert.match(diagnosis.summary, /until 2026-11-11/);
  assert.match(diagnosis.next, /billing/);
  assert.match(diagnosis.next, /do not troubleshoot/i);
  // Cloud Pro still counts as active for catalog access during the grace period.
  assert.equal(access("DEMO-1007", "Way Maker").access, "click-guide-only");
});

test("organization never purchased the song: no subscription means nothing to download", () => {
  const { diagnosis } = diagnose("DEMO-1004");
  assert.equal(diagnosis.code, "no-subscription");
  const r = access("DEMO-1004", "Way Maker");
  assert.equal(r.access, "not-in-library");
  assert.match(r.summary, /not in Grace Chapel/);
  assert.match(r.next, /has not purchased this song/);
  assert.match(r.next, /Do not run download troubleshooting/);
  // Their own purchase still resolves, with loose title matching.
  const own = access("DEMO-1004", "10,000 reasons");
  assert.equal(own.access, "purchased");
  assert.equal(own.song?.title, "10,000 Reasons (Bless the Lord)");
});

test("organization with Cloud Pro but no purchase of the song gets click and guide only", () => {
  const r = access("DEMO-1001", "Living Hope");
  assert.equal(r.access, "click-guide-only");
  assert.match(r.summary, /not in Riverbend/);
  assert.match(r.summary, /click and guide/);
  assert.match(r.next, /has not been purchased/);
  assert.equal(access("DEMO-1001", "goodness of god").access, "purchased");
  assert.equal(access("DEMO-1001", "Riverbend Benediction").access, "cloud-song");
});

test("expired rental with no credits left is a purchase/billing matter; active rental is fine", () => {
  const { diagnosis } = diagnose("DEMO-1006");
  assert.equal(diagnosis.code, "active");
  assert.match(diagnosis.next, /0 credit/);
  const expired = access("DEMO-1006", "Build My Life");
  assert.equal(expired.access, "rental-expired");
  assert.match(expired.summary, /expired on 2026-10-26/);
  assert.match(expired.next, /No credits remain/);
  const active = access("DEMO-1006", "Firm Foundation");
  assert.equal(active.access, "rental-active");
  assert.match(active.summary, /until 2026-11-20/);
  assert.equal(access("DEMO-1006", "Cornerstone").access, "purchased");
  // With a credit left, the hint changes to renting it again.
  const org = { ...organizations.find((o) => o.orgId === "714318")!, rentalCredits: 2 };
  const again = songAccess(org, undefined, orgSongs.filter((s) => s.orgId === "714318"), "Build My Life");
  assert.equal(again.access, "rental-expired");
  assert.match(again.next, /rent it again/);
});

test("team member without the Team Sharing permission is blocked even though the org is healthy", () => {
  const { diagnosis } = diagnose("DEMO-1005");
  assert.equal(diagnosis.code, "missing-team-sharing");
  assert.match(diagnosis.summary, /Team Member/);
  assert.match(diagnosis.next, /People page/);
  const r = access("DEMO-1005", "Goodness of God");
  assert.equal(r.access, "blocked-permission");
  assert.match(r.next, /Nothing to fix in the app/);
  // Same org, admin with the permission: fine.
  assert.equal(access("DEMO-1001", "Goodness of God").access, "purchased");
});

test("signed into the wrong (empty personal) organization is spotted from the other membership", () => {
  const { diagnosis } = diagnose("DEMO-1008");
  assert.equal(diagnosis.code, "wrong-organization");
  assert.match(diagnosis.summary, /Northgate Worship Collective/);
  assert.match(diagnosis.next, /Switch Organizations/);
  assert.equal(access("DEMO-1008", "Living Hope").access, "not-in-library");
  // Looked up as Northgate directly (orgId), the song is there.
  const northgate = organizations.find((o) => o.orgId === "362990")!;
  const asNorthgate = songAccess(northgate, customers.find((c) => c.customerId === "DEMO-1008")!.memberships[1], orgSongs.filter((s) => s.orgId === "362990"), "Living Hope");
  assert.equal(asNorthgate.access, "purchased");
});

test("song matching is forgiving about case, punctuation and partial titles, and empty input matches nothing", () => {
  const lib = orgSongs.filter((s) => s.orgId === "480113");
  assert.equal(matchSongs(lib, "GOODNESS OF GOD").length, 1);
  assert.equal(matchSongs(lib, "great are you lord!").length, 1);
  assert.equal(matchSongs(lib, "house of the lord by phil wickham").length, 1);
  assert.equal(matchSongs(lib, "").length, 0);
  assert.equal(matchSongs(lib, "Oceans").length, 0);
});

test("tool definitions and prompt expose the organization-ID lookup and song check", () => {
  const defs = buildToolDefinitions({ serverUrl: "https://example.test/vapi/tools" }) as { function?: { name: string; parameters: { properties: Record<string, unknown>; required: string[] } } }[];
  const lookup = defs.find((d) => d.function?.name === "lookup_demo_customer")!.function!;
  assert.ok("orgId" in lookup.parameters.properties);
  const song = defs.find((d) => d.function?.name === "check_song_access")!.function!;
  assert.deepEqual(song.parameters.required, ["songTitle"]);
  assert.ok(TOOL_META.check_song_access);
  assert.match(SYSTEM_PROMPT, /six-digit Organization ID/);
  assert.match(SYSTEM_PROMPT, /check_song_access/);
  assert.match(SYSTEM_PROMPT, /Do not run download troubleshooting on a song the organization cannot access/);
  assert.match(SPEAKER_PROMPT, /organization ID/);
});

// Type-level guard: the shared data shape is what the seed inserts.
const _typed: DemoCustomer[] = customers;
void _typed;
