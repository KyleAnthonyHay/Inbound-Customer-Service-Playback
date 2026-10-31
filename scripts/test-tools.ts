import { test } from "node:test";
import assert from "node:assert/strict";
import { compareVersions, isValidVersion } from "../src/lib/tools/version";
import { searchDocs } from "../src/lib/tools/kb";
import { getCurrentPlaybackAppInfo } from "../src/lib/tools/apple";
import { getRelevantChangesSinceVersion } from "../src/lib/tools/releases";

const realFetch = globalThis.fetch;
function mockApple(result: Record<string, unknown> | null, status = 200) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ resultCount: result ? 1 : 0, results: result ? [result] : [] }), { status })) as typeof fetch;
}
const restore = () => (globalThis.fetch = realFetch);

test("compareVersions orders semver-ish strings", () => {
  assert.equal(compareVersions("8.6.2", "8.6.3"), -1);
  assert.equal(compareVersions("8.6.4", "8.6.4"), 0);
  assert.equal(compareVersions("8.10.0", "8.9.9"), 1);
  assert.equal(compareVersions("8.6", "8.6.0"), 0);
  assert.ok(isValidVersion("8.6.2"));
  assert.ok(!isValidVersion("eight"));
});

test("searchDocs returns documented song-loading steps with source URLs", () => {
  const r = searchDocs("song stuck downloading error");
  assert.ok(r.found > 0);
  assert.ok(r.results[0].url.startsWith("https://helpcenter.multitracks.com/"));
  assert.ok(r.results[0].steps.length > 0);
});

test("searchDocs returns nothing for unrelated queries and says not to invent", () => {
  const r = searchDocs("lasagna recipe");
  assert.equal(r.found, 0);
  assert.match(r.note, /Do not invent/);
});

test("older version with Cloud Pro symptom surfaces the documented 8.6.3 fix", async () => {
  mockApple({ trackName: "Playback", version: "8.6.4", releaseNotes: "Summary\n- Playback 8.6.3 is a quality release.", currentVersionReleaseDate: "2026-10-26T14:26:55Z" });
  try {
    const r = await getRelevantChangesSinceVersion({ installedVersion: "8.6.2", symptom: "Cloud Pro expired message" });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.isUpToDate, false);
    assert.deepEqual(r.documentedReleasesBetween, ["8.6.3"]);
    assert.equal(r.relevantChanges.length, 1);
    assert.ok(r.relevantChanges[0].matchingNotes.some((n) => /Cloud Pro expired/.test(n)));
    assert.match(r.guidance, /documented fix exists/);
    // Inconsistent metadata is surfaced, not hidden.
    assert.ok(r.gaps.some((g) => /8\.6\.3/.test(g)));
  } finally {
    restore();
  }
});

test("current version with the same symptom does NOT recommend updating", async () => {
  mockApple({ trackName: "Playback", version: "8.6.4", releaseNotes: "Playback 8.6.4 notes" });
  try {
    const r = await getRelevantChangesSinceVersion({ installedVersion: "8.6.4", symptom: "Cloud Pro expired message" });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.isUpToDate, true);
    assert.equal(r.relevantChanges.length, 0);
    assert.match(r.guidance, /Do not recommend updating/);
  } finally {
    restore();
  }
});

test("Apple API failure is reported as a gap, history still returned", async () => {
  mockApple(null, 503);
  try {
    const apple = await getCurrentPlaybackAppInfo();
    assert.equal(apple.ok, false);
    const r = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "MIDI" });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.current.version, null);
    assert.equal(r.isUpToDate, null);
    assert.ok(r.gaps.some((g) => /lookup failed/.test(g)));
    assert.ok(r.documentedReleasesBetween.length > 0);
  } finally {
    restore();
  }
});

test("invalid version asks for the version instead of guessing", async () => {
  const r = await getRelevantChangesSinceVersion({ installedVersion: "latest" });
  assert.equal(r.ok, false);
});

import { parseHandoffResult } from "../src/lib/handoff";

test("parseHandoffResult reads the relayed tool result string", () => {
  const ok = parseHandoffResult(JSON.stringify({ ok: true, team: "Playback Technical Support", simulated: true }));
  assert.deepEqual(ok, { ok: true, team: "Playback Technical Support" });
  const no = parseHandoffResult(JSON.stringify({ ok: false, reason: "team-unavailable", team: "Billing & Accounts" }));
  assert.deepEqual(no, { ok: false, reason: "team-unavailable", team: "Billing & Accounts" });
  assert.equal(parseHandoffResult("not json"), null);
  assert.equal(parseHandoffResult({ hello: 1 }), null);
});

import { classifyStep } from "../src/lib/tools/disruption";

test("classifyStep flags disruptive steps with a caution and leaves safe ones alone", () => {
  assert.equal(classifyStep("Check that the device has a stable internet connection.").disruptive, false);
  const upd = classifyStep("Update Playback to the latest version from the App Store.");
  assert.equal(upd.disruptive, true);
  assert.equal(upd.kind, "update");
  assert.ok(upd.caution && upd.caution.length > 10);
  assert.equal(classifyStep("As a last resort, tap Delete All Setlists from Device.").kind, "delete-content");
  assert.equal(classifyStep("Fully close and reopen Playback, then try again.").kind, "restart");
  assert.equal(classifyStep("Quick fix 1 - remove and re-add the song: tap Edit, tap the red minus icon.").kind, "delete-content");
});

test("searchDocs results carry per-step disruption tags", () => {
  const r = searchDocs("download error");
  const first = r.results[0];
  assert.ok(first.steps.length > 0);
  assert.ok("disruptive" in first.steps[0]);
  assert.equal(typeof first.hasDisruptiveSteps, "boolean");
});

import { supportSlots, isWithinSupportHours, isValidSlotStart, describeCentral, centralOffsetHours, normalizePhoneNumber } from "../src/lib/tools/schedule";

test("support hours are weekdays 9am-5pm Central, including across the DST change", () => {
  // Fri 2026-10-30 10:00 CDT = 15:00 UTC: open. Sat 2026-10-31: closed.
  assert.ok(isWithinSupportHours(new Date("2026-10-30T15:00:00Z")));
  assert.ok(!isWithinSupportHours(new Date("2026-10-31T15:00:00Z")));
  // Fri 16:59 CDT open, 17:00 CDT closed, 08:59 closed.
  assert.ok(isWithinSupportHours(new Date("2026-10-30T21:59:00Z")));
  assert.ok(!isWithinSupportHours(new Date("2026-10-30T22:00:00Z")));
  assert.ok(!isWithinSupportHours(new Date("2026-10-30T13:59:00Z")));
  // DST ends Sun 2026-11-01, so Monday 9am is 15:00 UTC.
  assert.equal(centralOffsetHours(new Date("2026-10-30T15:00:00Z")), -5);
  assert.equal(centralOffsetHours(new Date("2026-11-02T15:00:00Z")), -6);
  assert.ok(isWithinSupportHours(new Date("2026-11-02T15:00:00Z")));
  assert.ok(!isWithinSupportHours(new Date("2026-11-02T14:30:00Z")));
});

test("slots asked for on a Saturday start Monday 9am Central, 16 per day", () => {
  const slots = supportSlots(new Date("2026-10-31T15:19:00Z"), { days: 2 }); // Sat, Sun, Mon
  assert.equal(slots[0].startAt, "2026-11-02T15:00:00.000Z");
  assert.equal(describeCentral(slots[0].startAt), "Monday, Nov 2, 9:00 AM Central");
  assert.equal(slots.length, 16);
  assert.equal(slots.at(-1)!.startAt, "2026-11-02T22:30:00.000Z"); // 4:30 PM CST
  assert.ok(slots.every((s) => isValidSlotStart(s.startAt)));
  assert.ok(!isValidSlotStart("2026-11-02T15:10:00.000Z"));
  assert.ok(!isValidSlotStart("2026-11-07T15:00:00.000Z")); // Saturday
});

test("phone numbers are normalized from spoken or typed forms", () => {
  assert.equal(normalizePhoneNumber("555 010 0199"), "5550100199");
  assert.equal(normalizePhoneNumber("+1 (512) 555-0199"), "+15125550199");
  assert.equal(normalizePhoneNumber("call me"), null);
  assert.equal(normalizePhoneNumber("123"), null);
});
