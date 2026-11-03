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

test("download quick fixes retain their generic-error section instead of becoming universal recovery steps", () => {
  const result = searchDocs("Audio Files Missing", { category: "song-loading" });
  const article = result.results.find(a => a.id === "troubleshooting-playback-download-errors");
  assert.ok(article);
  const quick = article.steps.filter(s => /Quick fix/.test(s.text));
  assert.equal(quick.length, 3);
  for (const step of quick) assert.match(step.text, /^'Download Error' \(generic section/);
  assert.match(result.note, /named error/);
});

test("searchDocs returns nothing for unrelated queries and says not to invent", () => {
  const r = searchDocs("lasagna recipe");
  assert.equal(r.found, 0);
  assert.match(r.note, /Do not invent/);
});

test("a matched product guide does not establish the caller's application or control context", () => {
  const r = searchDocs("switch organization wrong account", { category: "setup" });
  assert.ok(r.found > 0);
  assert.equal(r.evidenceScope, "product-documentation");
  assert.equal(r.establishesCallerContext, false);
  assert.match(r.note, /does not establish caller context/);
  assert.equal(searchDocs("unrelated lasagna recipe").establishesCallerContext, false);
});

test("category preferences retain stronger organization navigation evidence from the master guide", () => {
  for (const category of ["setup", "song-loading"]) {
    const r = searchDocs("Switch Organizations", { category });
    assert.equal(r.results[0].id, "playback-user-guide");
    assert.ok(r.results[0].steps.some(s => /Side menu.*Switch Organizations/.test(s.text)));
  }
  const reported = searchDocs("Playback check selected organization when organization Library is empty and purchased songs missing; Settings About organization", { category: "setup" });
  assert.equal(reported.results[0].id, "playback-user-guide");
});

test("category preference only breaks lexical ties and cannot invent relevance", () => {
  for (const query of ["lasagna recipe", ""]) {
    assert.equal(searchDocs(query, { category: "audio-output" }).found, 0);
  }
  const preferred = searchDocs("Playback", { category: "audio-output", limit: 5 });
  assert.equal(preferred.results[0].category, "audio-output");
  // Soft categories must not weaken the independent platform restriction.
  const mac = searchDocs("USB iPad interface powered hub", { category: "audio-output", platform: "macOS", limit: 5 });
  assert.ok(mac.found > 0);
  assert.ok(mac.results.every(a => !a.appliesTo.length || a.appliesTo.some(p => /macOS/i.test(p))));
});

test("routing retrieval withholds obsolete bus-creation steps for unknown/current versions", () => {
  for (const installedVersion of [undefined, "7.6", "8.6.2", "unknown 7.5", "latest"]) {
    const result = searchDocs("click guide separate buses outputs Aux tracks", { category: "audio-output", installedVersion });
    assert.ok(result.results.some(a => a.id === "track-and-bus-routing-in-playback"));
    assert.equal(result.results.some(a => a.id === "route-click-guide-to-separate-busses"), false);
    const historical = result.withheldArticles.find(a => a.id === "route-click-guide-to-separate-busses");
    assert.ok(historical); assert.equal("steps" in historical, false); assert.equal("summary" in historical, false);
    assert.equal(JSON.stringify(result.results).includes("Free up a bus"), false);
  }
});

test("a caller-confirmed older version can retrieve its applicable historical procedure", () => {
  const result = searchDocs("click guide separate buses outputs Aux tracks", { category: "audio-output", installedVersion: "7.5.9" });
  assert.ok(result.results.find(a => a.id === "route-click-guide-to-separate-busses")?.steps.some(s => s.text.includes("Free up a bus")));
  assert.equal(result.withheldArticles.length, 0);
});

test("shared output symptom retrieves current routing guidance without requiring a routine version lookup", () => {
  const result = searchDocs("Playback spoken guide and click get quieter together when guide volume is turned down; audio output routing buses", { category: "audio-output", platform: "macOS" });
  assert.equal(result.results[0].id, "track-and-bus-routing-in-playback");
  assert.match(result.results[0].summary, /Separate buses assigned to the same output/);
});

test("interface advice carries linked MultiOut feature requirements without making every two-feed goal Premium-only", () => {
  const result = searchDocs("Focusrite 4i4 tested interface", { category: "audio-output" });
  const article = result.results.find(a => a.id === "playback-supported-audio-interfaces");
  assert.ok(article?.requirements?.some(r => /MultiOuts.*Premium/.test(r.text) && r.sourceUrl.includes("4439220")));
  assert.ok(article?.requirements?.some(r => /not every basic two-feed Auto-Pan/.test(r.text)));
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
    assert.match(r.guidance, /Candidate release notes/);
    assert.equal(r.updateAssessment.prerequisitesComplete, false);
    assert.deepEqual(r.updateAssessment.missingInformation, ["platform", "osVersion"]);
    // Inconsistent metadata is surfaced, not hidden.
    assert.ok(r.gaps.some((g) => /8\.6\.3/.test(g)));
  } finally {
    restore();
  }
});

test("release matching retains a historical fix older than the newest three releases", async () => {
  mockApple({ trackName: "Playback", version: "8.6.4", releaseNotes: "Playback 8.6.4 notes" });
  try {
    const r = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "download bar stuck at completion" });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.ok(!r.documentedReleasesBetween.slice(-3).includes("8.5.2"));
    const fix = r.relevantChanges.find(change => change.version === "8.5.2");
    assert.ok(fix, "Historical fixes must remain searchable beyond the newest three releases");
    assert.ok(fix.matchingNotes.some(note => /download.*bar.*stuck|stuck.*download/i.test(note)));
    assert.ok(r.history.coverage.includes("8.4.1"));
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

test("update assessment separates candidate matches from complete OS prerequisites", async () => {
  mockApple({ trackName: "Playback", version: "8.6.4", minimumOsVersion: "15.6" });
  try {
    const ready = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "download bar stuck", platform: "iPadOS", osVersion: "18" });
    assert.ok(ready.ok);
    if (!ready.ok) return;
    assert.equal(ready.updateAssessment.prerequisitesComplete, true);
    assert.equal(ready.updateAssessment.candidateMatchNeedsReview, true);
    assert.equal(ready.current.minimumOsVersion, "15.6");
    const oldOS = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "download bar stuck", platform: "iPadOS", osVersion: "14.8" });
    assert.ok(oldOS.ok);
    if (!oldOS.ok) return;
    assert.equal(oldOS.updateAssessment.prerequisitesComplete, false);
    assert.ok(oldOS.updateAssessment.blockers.includes("installed-os-below-current-app-minimum"));
    const noOs = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "download bar stuck", platform: "iPadOS" });
    assert.ok(noOs.ok);
    if (!noOs.ok) return;
    assert.equal(noOs.updateAssessment.prerequisitesComplete, true);
    assert.deepEqual(noOs.updateAssessment.missingInformation, []);
    assert.match(noOs.updateAssessment.osCheck ?? "", /App Store/);
    const mac = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "download bar stuck", platform: "macOS", osVersion: "15" });
    assert.ok(mac.ok);
    if (!mac.ok) return;
    assert.equal(mac.updateAssessment.osRequirementMet, null);
    assert.equal(mac.updateAssessment.prerequisitesComplete, false);
    assert.ok(mac.updateAssessment.missingInformation.includes("applicablePlatformRequirements"));
  } finally { restore(); }
});

test("unknown current version, absent candidates and current installation cannot authorize an update", async () => {
  mockApple(null, 503);
  try {
    const failed = await getRelevantChangesSinceVersion({ installedVersion: "8.5.0", symptom: "download", platform: "iPadOS", osVersion: "18" });
    assert.ok(failed.ok);
    if (!failed.ok) return;
    assert.equal(failed.updateAssessment.prerequisitesComplete, false);
    assert.ok(failed.updateAssessment.missingInformation.includes("currentVersion"));
    mockApple({ version: "8.6.4", minimumOsVersion: "15.6" });
    for (const args of [{ installedVersion: "8.6.4", symptom: "download" }, { installedVersion: "8.5.0", symptom: "unrecognizable-zebra" }]) {
      const result = await getRelevantChangesSinceVersion({ ...args, platform: "iPadOS", osVersion: "18" });
      assert.ok(result.ok);
      if (!result.ok) return;
      assert.equal(result.updateAssessment.prerequisitesComplete, false);
      assert.ok(result.updateAssessment.blockers.length > 0);
    }
  } finally { restore(); }
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

test("searchDocs: a Mac on a USB-to-Ethernet (Cat 6) adapter finds the Dante Virtual Soundcard article first", () => {
  const r = searchDocs("Mac no audio device showing up USB to ethernet Cat 6 adapter dongle");
  assert.ok(r.found > 0);
  assert.equal(r.results[0].id, "connect-playback-to-a-dante-network");
  assert.ok(r.results[0].steps.some((s) => /Settings > General.*Audio Device/.test(s.text)));
  assert.ok(r.results[0].steps.some((s) => /Dante Via/.test(s.text)));
});

test("searchDocs: FAQ questions are answerable from documented sources", () => {
  const devices = searchDocs("how many devices can I log into Playback on");
  assert.ok(devices.results.some((a) => a.id === "playback-product-page-faq"));
  const lyrics = searchDocs("does Playback show lyrics or chords");
  assert.equal(lyrics.results[0].id, "playback-faqs");
  const ram = searchDocs("RAM memory warning");
  assert.equal(ram.results[0].id, "ram-memory-warning");
  assert.ok(ram.results[0].hasDisruptiveSteps);
});

test("Vapi error events always become readable strings and remote hang-ups are recognised", async () => {
  const { errorText, isRemoteHangup, friendlyEndedReason } = await import("../src/lib/useVapiCall");
  const daily = { type: "daily-error", error: { type: "ejected", msg: "Meeting ended due to ejection: Meeting has ended", details: {} } };
  assert.equal(errorText(daily), "Meeting ended due to ejection: Meeting has ended");
  assert.ok(isRemoteHangup(errorText(daily)));
  assert.equal(errorText("plain"), "plain");
  assert.equal(errorText(new Error("boom")), "boom");
  assert.equal(typeof errorText({ weird: 1 }), "string");
  assert.match(friendlyEndedReason("silence-timed-out"), /silence/);
});

import { callInfoOf, formatCallerNumber, lastFour, wantsCallerId } from "../src/lib/tools/callerId";

test("caller ID: phone calls expose the caller's number to tools, browser calls do not", () => {
  const phone = callInfoOf({ id: "c1", type: "inboundPhoneCall", customer: { number: "+19294044992" } });
  assert.deepEqual(phone, { callId: "c1", callType: "inboundPhoneCall", callerNumber: "+19294044992" });
  const web = callInfoOf({ id: "c2", type: "webCall" });
  assert.equal(web.callerNumber, undefined);
  assert.equal(callInfoOf(undefined).callId, "unknown");
  assert.equal(callInfoOf({ id: "c3", customer: { number: "  " } }).callerNumber, undefined);
});

test("caller ID: 'caller-id' and friends mean the number the caller is on; real numbers do not", () => {
  for (const w of ["caller-id", "caller id", "callerid", "same number", "this number", "the number I'm calling from", "", undefined]) assert.equal(wantsCallerId(w), true, String(w));
  for (const w of ["929-404-4992", "+1 929 404 4992", "(929) 404-4992"]) assert.equal(wantsCallerId(w), false, w);
  assert.equal(lastFour("+19294044992"), "4992");
  assert.equal(formatCallerNumber("+19294044992"), "+1 (929) 404-4992");
  assert.equal(formatCallerNumber("9294044992"), "(929) 404-4992");
  assert.equal(formatCallerNumber("+442071234567"), "+442071234567");
});

import { assistantSpeakingAfter, isLiveStatus, phoneStatusOf, REMOTE_STALE_MS, storedStatusOf } from "../src/lib/tools/callState";

test("call state: Vapi statuses map to stored statuses; the web phone derives its display state from the row", () => {
  assert.equal(storedStatusOf("queued"), "ringing");
  assert.equal(storedStatusOf("ringing"), "ringing");
  assert.equal(storedStatusOf("in-progress"), "in-progress");
  assert.equal(storedStatusOf("forwarding"), "in-progress");
  assert.equal(storedStatusOf("ended"), "ended");
  assert.equal(storedStatusOf("something-new"), null);
  assert.equal(storedStatusOf(undefined), null);
  assert.equal(isLiveStatus("ringing"), true);
  assert.equal(isLiveStatus("in-progress"), true);
  assert.equal(isLiveStatus("ended"), false);

  const now = 1_800_000_000_000;
  assert.equal(phoneStatusOf(null, now), "idle");
  assert.equal(phoneStatusOf({ status: "ringing", startedAt: now - 5_000 }, now), "connecting");
  assert.equal(phoneStatusOf({ status: "in-progress", startedAt: now - 60_000 }, now), "active");
  assert.equal(phoneStatusOf({ status: "ended", startedAt: now - 60_000 }, now), "ended");
  // A live row whose end event never arrived stops reading as live.
  assert.equal(phoneStatusOf({ status: "in-progress", startedAt: now - REMOTE_STALE_MS - 1 }, now), "ended");

  assert.equal(assistantSpeakingAfter("assistant", "started"), true);
  assert.equal(assistantSpeakingAfter("assistant", "stopped"), false);
  assert.equal(assistantSpeakingAfter("user", "started"), false);
  assert.equal(assistantSpeakingAfter("user", "stopped"), undefined);
  assert.equal(assistantSpeakingAfter(undefined, undefined), undefined);
});

import { SYSTEM_PROMPT } from "../src/lib/assistant";

test("prompt: the reasoner sees the caller ID variable and wraps up after a booked callback", () => {
  assert.match(SYSTEM_PROMPT, /Caller ID: \{\{customer\.number\}\}/);
  assert.match(SYSTEM_PROMPT, /callbackNumber "caller-id"/);
  assert.match(SYSTEM_PROMPT, /After reserve_callback returns ok=true[^\n]*call endCall/);
  assert.match(SYSTEM_PROMPT, /After initiate_handoff succeeds[^\n]*call endCall/);
});
