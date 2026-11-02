import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArticle } from "./manual/parse-article";
import { chunkSections, sectionize } from "./manual/chunk";
import { classifySection } from "../src/lib/manual/types";
import { bodyOf, manualCategoriesFor, readManualEnv, searchManual, stepsOf } from "../src/lib/tools/manual";

const dir = path.join("docs", "source-snapshots", "playback-user-guide");
const html = readFileSync(path.join(dir, "raw", "article.html"), "utf8");
const article = parseArticle(html);
const sections = sectionize(article.blocks, article.title);
const { chunks, images } = chunkSections(sections, {
  docTitle: article.title,
  docSlug: "playback-user-guide",
  sourceUrl: "https://helpcenter.multitracks.com/en/articles/4944485-playback-user-guide",
  retrievedAt: "2026-11-01",
  sourceUpdatedAt: "2026-07-31",
  imageId: (src) => `img:${src}`,
});

test("parser keeps every article image and heading", () => {
  assert.equal(article.title, "Playback User Guide");
  assert.equal(article.sourceUpdatedAt, "2026-07-31T15:15:34Z");
  const imgTagsInArticle = (html.match(/<article[\s\S]*<\/article>/)?.[0].match(/<img\b/g) ?? []).length;
  assert.equal(article.blocks.filter((b) => b.kind === "image").length, imgTagsInArticle);
  assert.equal(images.length, imgTagsInArticle, "every image lands in a chunk");
  assert.ok(article.blocks.filter((b) => b.kind === "heading").length >= 70);
  assert.ok(article.relatedArticles.length > 0, "related-articles footer links kept out of the text but recorded");
  assert.ok(!article.blocks.some((b) => "text" in b && /Related Articles/.test(b.text)));
});

test("headings inside collapsible sections nest under the summary heading", () => {
  const paths = sections.map((s) => s.path.join(" > "));
  assert.ok(paths.includes("Playback User Guide > App Overview > Login Requirements > Organizations vs. Users"));
  assert.ok(paths.includes("Playback User Guide > Customizing Setlists > Setlist / Song Map Edit Mode > Transitions"));
});

test("chunks start with the title and heading path, stay under budget, and have stable ids", () => {
  const ids = new Set<string>();
  for (const c of chunks) {
    assert.ok(c.text.startsWith("Playback User Guide > ") || c.text.startsWith("Playback User Guide\n"), c.id);
    assert.ok(c.text.length <= 2000, `${c.id} is ${c.text.length} chars`);
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`);
    ids.add(c.id);
    assert.equal(c.section_path.split(" > ")[0], "Playback User Guide");
    if (c.parts > 1) assert.match(c.text, new RegExp(`\\(part ${c.part} of ${c.parts}\\)`));
  }
});

test("splits keep steps with their lead-in and notes with their step", () => {
  const buses = chunks.find((c) => /Tap the bus cell to open the routing menu/.test(c.text))!;
  assert.ok(buses, "bus routing steps exist");
  assert.match(buses.text, /Change Bus Routing/, "lead-in stays with its steps");
  assert.match(buses.text, /greyed-out/, "note stays with the step it qualifies");
  const audioDevice = chunks.find((c) => /Audio Device: See and set which connected Audio Device/.test(c.text))!;
  assert.ok(audioDevice.id.startsWith("playback-user-guide:playback-settings-general-settings-tab:"));
  assert.match(audioDevice.text, /for all audio output\./, "list item is never cut mid-sentence");
  assert.ok(chunks.some((c) => /Auto-Pan: When enabled, Auto Pan routes the click & guide through the left/.test(c.text)));
  // A sub-heading-like lead-in never ends a part.
  for (const c of chunks) {
    const last = c.text.trimEnd().split("\n").pop()!;
    assert.ok(!(last.length < 60 && !/[.!?)\]]$/.test(last) && c.part < c.parts), `${c.id} ends with orphan lead-in: ${last}`);
  }
});

test("ordered lists are numbered sequentially at the top level only", () => {
  const add = chunks.find((c) => c.id.includes("options-in-the-add-a-song-menu"))!;
  const nums = add.text.split("\n").filter((l) => /^\d+\. /.test(l)).map((l) => Number(l.split(".")[0]));
  assert.deepEqual(nums, nums.map((_, i) => i + 1));
});

test("scope and category tagging keeps support scope bounded", () => {
  assert.deepEqual(classifySection("Playback User Guide > Playback Settings > General Settings Tab"), { category: "audio-output", scope: "in-scope" });
  assert.deepEqual(classifySection("Playback User Guide > Building a Setlist > The Setlists Menu"), { category: "song-loading", scope: "in-scope" });
  assert.deepEqual(classifySection("Playback User Guide > Customizing Setlists > MIDI Cues Edit Mode"), { category: "advanced", scope: "out-of-scope" });
  assert.deepEqual(classifySection("Playback User Guide > Playback Settings > MIDI Settings Tab"), { category: "advanced", scope: "out-of-scope" });
  assert.deepEqual(classifySection("Playback User Guide > App Overview > Login Requirements"), { category: "setup", scope: "in-scope" });
  const inScope = chunks.filter((c) => c.scope === "in-scope");
  assert.ok(inScope.every((c) => ["setup", "song-loading", "audio-output"].includes(c.category)));
  assert.ok(chunks.filter((c) => c.scope === "out-of-scope").length > 20);
});

test("images are metadata, not text: ids on chunks, details in the manifest list", () => {
  for (const c of chunks) {
    assert.ok(!/\[Image/.test(c.text), c.id);
    assert.equal(c.image_count, c.image_ids.length);
    for (const id of c.image_ids) assert.ok(images.find((i) => i.id === id && i.chunk_ids.includes(c.id)));
  }
  for (const i of images) assert.ok(i.section_path && i.chunk_ids.length > 0 && i.source_url.startsWith("https://"));
});

test("chunk fields are Pinecone-safe (string, number, boolean, string[])", () => {
  for (const c of chunks)
    for (const [k, v] of Object.entries(c)) {
      const ok = typeof v === "string" || typeof v === "number" || typeof v === "boolean" || (Array.isArray(v) && v.every((x) => typeof x === "string"));
      assert.ok(ok, `${c.id}.${k} is ${typeof v}`);
    }
});

test("manual search shapes Pinecone hits, classifies steps and separates out-of-scope hits", async () => {
  const general = chunks.find((c) => /Audio Device: See and set/.test(c.text))!;
  const midi = chunks.find((c) => c.id.includes("midi-cues-edit-mode-add-midi-cue-menu"))!;
  const data = chunks.find((c) => c.id.includes("setlist-data-management"))!;
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    const hit = (c: typeof general, s: number) => ({ _id: c.id, _score: s, fields: c });
    return new Response(JSON.stringify({ result: { hits: [hit(midi, 0.8), hit(general, 0.7), hit(data, 0.5)] } }), { status: 200 });
  }) as unknown as typeof fetch;
  const r = await searchManual("audio device", { category: "audio-output", limit: 2, fetchImpl, env: { PINECONE_API_KEY: "k", PINECONE_INDEX_HOST: "https://x.svc.pinecone.io", PINECONE_NAMESPACE: "ns" } });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(calls[0].url, "https://x.svc.pinecone.io/records/namespaces/ns/search");
  assert.deepEqual((calls[0].body as { query: { filter: unknown } }).query.filter, { category: { $in: ["audio-output"] } });
  assert.equal(r.found, 2);
  assert.ok(r.results.every((x) => x.scope !== "out-of-scope"));
  assert.equal(r.outOfScope.length, 1);
  assert.ok(!r.results[0].text!.startsWith("Playback User Guide >"), "heading line stripped from body");
  const dataHit = r.results.find((x) => x.id === data.id)!;
  assert.ok(dataHit.hasDisruptiveSteps === false || dataHit.steps!.length >= 0);
  assert.ok(r.results[0].steps!.some((s) => /Audio Device/.test(s.text)));
});

test("manual search degrades cleanly without configuration or on failure", async () => {
  const none = await searchManual("x", { env: { PINECONE_API_KEY: "", PINECONE_INDEX_HOST: "" } });
  assert.deepEqual(none, { ok: false, source: "manual", reason: "not-configured" });
  const failing = (async () => new Response("boom", { status: 500 })) as unknown as typeof fetch;
  const bad = await searchManual("x", { fetchImpl: failing, env: { PINECONE_API_KEY: "k", PINECONE_INDEX_HOST: "https://h" } });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.reason, "request-failed");
});

test("helpers", () => {
  assert.deepEqual(manualCategoriesFor("general"), ["general", "setup"]);
  assert.deepEqual(manualCategoriesFor("requirements"), ["setup"]);
  assert.equal(manualCategoriesFor(undefined), undefined);
  assert.equal(bodyOf("Title > A\n\nbody"), "body");
  const steps = stepsOf("- Tap Restore Purchases\n- Update the app from the App Store\nplain line");
  assert.equal(steps.length, 2);
  assert.equal(steps[1].disruptive, true);
});

test("manual env is read per key, so a non-enumerable process.env (Convex) still configures the search", async () => {
  // Convex's process.env has the values but Object.keys() is empty, so a spread drops everything.
  const convexLike = new Proxy({} as Record<string, string | undefined>, {
    get: (_t, k) => ({ PINECONE_API_KEY: "k", PINECONE_INDEX_HOST: "https://h.svc.pinecone.io/" } as Record<string, string>)[String(k)],
    ownKeys: () => [],
  });
  assert.deepEqual({ ...convexLike }, {}, "spread sees nothing");
  const env = readManualEnv({}, convexLike);
  assert.equal(env.PINECONE_API_KEY, "k");
  assert.equal(env.PINECONE_INDEX_HOST, "https://h.svc.pinecone.io/");
  assert.deepEqual(readManualEnv({ PINECONE_NAMESPACE: "ns" }, convexLike).PINECONE_NAMESPACE, "ns", "override wins");
  assert.equal(readManualEnv({ PINECONE_API_KEY: "" }, convexLike).PINECONE_API_KEY, "", "an explicit empty override disables it");
});
