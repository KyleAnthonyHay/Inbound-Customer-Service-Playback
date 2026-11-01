/**
 * Step 4: ask the indexed manual real caller questions and record what comes
 * back, so retrieval quality is checked against expectations instead of assumed.
 *
 *   npm run manual:eval                writes docs/source-snapshots/playback-user-guide/retrieval-report.json
 *   npm run manual:eval -- "free text"  one ad-hoc query, printed
 *
 * Needs PINECONE_API_KEY and PINECONE_INDEX_HOST (from index-report.json) in .env.local.
 * Each case lists the chunk-id fragments that should appear in the top results and,
 * for scope checks, the sections that must NOT be offered as troubleshooting.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { searchManual } from "../../src/lib/tools/manual";

const dir = path.join("docs", "source-snapshots", "playback-user-guide");

type Case = { q: string; category?: string; expectAny: string[]; expectOutOfScope?: boolean; note?: string };

export const CASES: Case[] = [
  // Audio output
  { q: "How do I choose which audio device Playback uses for output?", category: "audio-output", expectAny: ["general-settings-tab:1"] },
  { q: "The click and guide are only in my left ear and the band is in the right", category: "audio-output", expectAny: ["general-settings-tab:1", "setting-up-audio-and-midi:1"], note: "Auto-Pan: click/guide left, tracks right on the stereo output" },
  { q: "How do I send the click to a different output on my USB interface?", category: "audio-output", expectAny: ["buses-settings-tab:1", "tracks-settings-tab:1"], note: "bus routing is per audio device; no fixed output1/output2 mapping" },
  { q: "I want the guide vocal cues to go to a different bus than the click", category: "audio-output", expectAny: ["tracks-settings-tab:1", "buses-settings-tab:1"] },
  { q: "An output is greyed out when I try to route a bus", category: "audio-output", expectAny: ["buses-settings-tab:1"], note: "SMPTE bus may be using the output" },
  { q: "no sound from Playback through my headphones without an interface", category: "audio-output", expectAny: ["setting-up-audio-and-midi:1", "general-settings-tab:1"] },
  { q: "Which USB audio interfaces work with Playback?", category: "audio-output", expectAny: ["choosing-an-audio-interface:1"] },
  // Song loading
  { q: "The song in my setlist won't download", category: "song-loading", expectAny: ["navigating-the-setlists-menu:1", "settings-available-when-adding-a-song:2", "setlist-data-management"] },
  { q: "How do I download all the songs in a setlist before Sunday?", category: "song-loading", expectAny: ["navigating-the-setlists-menu:1"] },
  { q: "Will deleting setlists from my iPad delete them from my account?", category: "song-loading", expectAny: ["setlist-data-management-in-playback:1"] },
  { q: "I don't see the All Songs option when adding a song", category: "song-loading", expectAny: ["options-in-the-add-a-song-menu:1"], note: "needs Playback Rentals or Cloud Pro / permissions" },
  { q: "How do I add a song to my setlist?", category: "song-loading", expectAny: ["adding-a-song-in-playback:1", "building-a-setlist-adding-a-song:1"] },
  // First-time setup (bounded)
  { q: "First time opening Playback, which organization do I pick at login?", category: "setup", expectAny: ["organizations-vs-users:1", "general-login-requirements:1"] },
  { q: "I'm logged in but can't download our purchased tracks", expectAny: ["organizational-content-permissions:1"] },
  { q: "What does the stack icon in the top right open?", expectAny: ["side-menu-settings-and-features:1", "playback-settings:1"] },
  // Subscription-adjacent
  { q: "Playback says my subscription expired but I'm paying", category: "subscription", expectAny: ["about-tab:1"], note: "Restore Purchases" },
  // Out of scope: should surface only as documented-but-out-of-scope
  { q: "How do I add MIDI cues to a song?", expectAny: [], expectOutOfScope: true },
  { q: "How do I set up SMPTE timecode out?", expectAny: [], expectOutOfScope: true },
  { q: "How do I control Playback from another iPad with Playback Remote?", expectAny: [], expectOutOfScope: true },
  // Unrelated
  { q: "What's a good lasagna recipe?", expectAny: [], note: "should return weak or no in-scope hits; the tool note says not to invent" },
];

async function main() {
  const adhoc = process.argv.slice(2).join(" ").trim();
  if (adhoc) {
    const r = await searchManual(adhoc, { limit: 5 });
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  const rows = [];
  let pass = 0;
  for (const c of CASES) {
    const r = await searchManual(c.q, { category: c.category, limit: 3 });
    if (!r.ok) {
      rows.push({ q: c.q, ok: false, reason: r.reason, detail: r.detail });
      console.log(`✗ ${c.q}: ${r.reason} ${r.detail ?? ""}`);
      continue;
    }
    const top = r.results.map((x) => ({ id: x.id, score: x.score, scope: x.scope, disruptive: x.hasDisruptiveSteps }));
    const hit = c.expectAny.length === 0 ? true : c.expectAny.some((frag) => top.some((t) => t.id.includes(frag)));
    const scopeOk = c.expectOutOfScope ? r.outOfScope.length > 0 : true;
    const unrelatedOk = c.expectAny.length === 0 && !c.expectOutOfScope ? r.results.every((x) => x.score < 0.4) || r.found === 0 : true;
    const ok = hit && scopeOk && unrelatedOk;
    if (ok) pass++;
    rows.push({ q: c.q, category: c.category, ok, top, outOfScope: r.outOfScope.map((o) => o.id), expectAny: c.expectAny, note: c.note });
    console.log(`${ok ? "✓" : "✗"} ${c.q}\n    top: ${top.map((t) => `${t.id.replace("playback-user-guide:", "")} ${t.score}`).join(" | ") || "(none)"}${r.outOfScope.length ? `\n    out-of-scope: ${r.outOfScope.map((o) => o.id.replace("playback-user-guide:", "")).join(" | ")}` : ""}`);
  }
  const summary = { ran_at: new Date().toISOString(), passed: pass, total: CASES.length, rows };
  await writeFile(path.join(dir, "retrieval-report.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(`\n${pass}/${CASES.length} passed. Wrote ${path.join(dir, "retrieval-report.json")}`);
  void readFile;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
