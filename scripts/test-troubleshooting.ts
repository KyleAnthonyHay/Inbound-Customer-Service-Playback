import { test } from "node:test";
import assert from "node:assert/strict";
import { searchDocs, inferPlatform, kb, appleKb } from "../src/lib/tools/kb";
import { checkOsCompatibility } from "../src/lib/tools/apple";
import { getRelevantChangesSinceVersion } from "../src/lib/tools/releases";

const realFetch = globalThis.fetch;
function mockApple(result: Record<string, unknown>) {
  globalThis.fetch = (async () => new Response(JSON.stringify({ resultCount: 1, results: [result] }), { status: 200 })) as typeof fetch;
}
const restore = () => (globalThis.fetch = realFetch);

test("every plan step is a real documented step with a stable id and source URL", () => {
  const all = new Map([...kb.articles, ...appleKb.articles].map((a) => [a.id, a]));
  for (const q of ["download error", "no sound from usb interface", "click in both channels", "insufficient storage", "bluetooth speaker"]) {
    for (const s of searchDocs(q, { platform: "iPadOS" }).nextSteps) {
      const [id, n] = s.stepId.split("#");
      assert.equal(all.get(id)?.steps[Number(n) - 1], s.text, s.stepId);
      assert.ok(s.url.startsWith("https://"));
    }
  }
});

test("the caller's exact message picks that branch of a multi-message article", () => {
  const r = searchDocs("my song won't download, it keeps saying download error", { platform: "iPad" });
  assert.equal(r.nextSteps[0].whenMessageIs, "Download Error");
  // Steps for other messages (e.g. Audio Files Missing) stay out of the plan.
  assert.ok(!r.nextSteps.some((s) => s.whenMessageIs && s.whenMessageIs !== "Download Error"));
});

test("a vague download symptom asks which message is on screen instead of guessing a branch", () => {
  const r = searchDocs("song stuck downloading", { platform: "iPad" });
  assert.ok(r.askWhichMessage?.some((b) => b.askWhichMessage.includes("Insufficient Storage")));
  assert.ok(!r.nextSteps.some((s) => s.whenMessageIs));
});

test("alreadyTried moves the plan forward instead of repeating a failed step", () => {
  const first = searchDocs("download error", { platform: "iPadOS" });
  const tried = first.nextSteps[0].stepId;
  const second = searchDocs("download error", { platform: "iPadOS", alreadyTried: [tried] });
  assert.ok(!second.nextSteps.some((s) => s.stepId === tried));
  assert.notEqual(second.nextSteps[0].stepId, tried);
});

test("caller wording maps onto doc wording (synonyms)", () => {
  const r = searchDocs("tracks won't load", { platform: "iPad" });
  assert.equal(r.results[0].id, "troubleshooting-playback-download-errors");
});

test("Apple Support fills device-level gaps the Playback docs don't cover", () => {
  const bt = searchDocs("bluetooth speaker not working", { platform: "iPhone" });
  assert.ok(bt.nextSteps.some((s) => s.source === "Apple Support" && s.url.startsWith("https://support.apple.com/")));
  assert.ok(bt.documentationGaps?.some((g) => /Bluetooth/.test(g)));
  const storage = searchDocs("insufficient storage", { platform: "iPad" });
  assert.equal(storage.nextSteps[0].source, "MultiTracks Help Center"); // Playback docs first
  assert.ok(storage.nextSteps.some((s) => s.stepId.startsWith("apple-check-storage-ios")));
});

test("platform filters Apple guidance and is inferred from the caller's words", () => {
  assert.equal(inferPlatform("no sound from my MacBook"), "macOS");
  const mac = searchDocs("no sound from my interface on my mac");
  assert.ok(!mac.nextSteps.some((s) => s.source === "Apple Support" && !s.appliesTo.includes("macOS")));
  assert.ok(mac.nextSteps.some((s) => s.stepId.startsWith("apple-mac-")));
});

test("live callers get safe steps before disruptive ones", () => {
  const r = searchDocs("download error", { platform: "iPad", callerTiming: "live" });
  const firstDisruptive = r.nextSteps.findIndex((s) => s.disruptive);
  const lastSafe = r.nextSteps.map((s) => s.disruptive).lastIndexOf(false);
  assert.ok(firstDisruptive === -1 || firstDisruptive > lastSafe);
});

test("contact-support lines are left to the agent's handoff, not read as steps", () => {
  const r = searchDocs("download error authorizing VPN", { platform: "iPad" });
  assert.ok(!r.nextSteps.some((s) => /^(still stuck|any other error|contact)/i.test(s.text)));
});

test("OS compatibility uses Apple's live minimum OS version", () => {
  assert.equal(checkOsCompatibility("15.2", "15.6", "iPadOS")?.compatible, false);
  assert.equal(checkOsCompatibility("iPadOS 17.5", "15.6", "iPadOS")?.compatible, true);
  assert.equal(checkOsCompatibility("14.1", "15.6", "macOS")?.compatible, null);
  assert.equal(checkOsCompatibility(undefined, "15.6"), null);
});

test("live App Store release notes are matched when the help-center history lacks the release", async () => {
  mockApple({ trackName: "Playback", version: "8.6.4", minimumOsVersion: "15.6", releaseNotes: "What's new\n- Fixed songs failing to download on slow networks.\n- Improved MIDI." });
  try {
    const r = await getRelevantChangesSinceVersion({ installedVersion: "8.6.3", symptom: "songs fail to download", deviceOsVersion: "15.1", platform: "iPadOS" });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.ok(r.liveReleaseNotes?.matchingNotes.some((n) => /download/.test(n)));
    assert.equal(r.osCompatibility?.compatible, false);
    assert.match(r.guidance, /OS is below/);
  } finally {
    restore();
  }
});
