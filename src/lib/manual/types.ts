/**
 * Shared shapes for the Playback User Guide ingestion.
 *
 * The manual is ingested as a flat list of ManualChunk records whose `text`
 * is embedded by Pinecone (integrated inference). Every other field is plain
 * metadata (string | number | boolean | string[] only, which is what Pinecone
 * record fields accept). Screenshots are never embedded: each chunk carries
 * the ids of the images that sit inside its section, and the manifest maps
 * those ids back to the source URL, the local snapshot file and the position.
 */

export type ManualScope = "in-scope" | "adjacent" | "out-of-scope";

/** Same vocabulary as KbArticle.category plus "setup" for first-time setup. */
export type ManualCategory = "song-loading" | "audio-output" | "setup" | "subscription" | "general" | "advanced";

export type ManualChunk = {
  /** Stable id: `${docSlug}:${sectionSlug}:${part}` */
  id: string;
  /** What gets embedded: title + heading path + section text. */
  text: string;
  doc_title: string;
  doc_slug: string;
  source_url: string;
  /** Deep link to the section when the heading has an id anchor. */
  section_url: string;
  /** "Playback User Guide > Playback Settings > General Settings Tab" */
  section_path: string;
  h1: string;
  h2: string;
  h3: string;
  /** 1-based part number when a long section was split; parts = total. */
  part: number;
  parts: number;
  category: ManualCategory;
  scope: ManualScope;
  /** Section contains numbered or bulleted steps. */
  has_steps: boolean;
  /** Section contains a callout / note / warning block. */
  has_callout: boolean;
  /** Ids of screenshots positioned inside this chunk, in document order. */
  image_ids: string[];
  image_count: number;
  /** Order of the chunk within the document. */
  order: number;
  retrieved_at: string;
  source_updated_at: string;
  char_count: number;
};

export type ManualImage = {
  id: string;
  /** Source URL exactly as the page referenced it (signed Intercom URL; expires). */
  source_url: string;
  /** Path inside the snapshot folder, e.g. images/03-ab12cd34ef.png */
  file: string | null;
  alt: string;
  /** Text that captions the image in the manual, when a paragraph follows it in italics or the alt is set. */
  caption: string;
  section_path: string;
  /** Chunk ids whose text this image sits inside. */
  chunk_ids: string[];
  /** Position of the image among the document's blocks (0-based). */
  block_index: number;
  width: number | null;
  height: number | null;
  bytes: number | null;
};

export type ManualManifest = {
  kind: "manual-manifest";
  doc_title: string;
  doc_slug: string;
  source_url: string;
  source_updated_at: string;
  retrieved_at: string;
  built_at: string;
  snapshot_html: string;
  extracted_text: string;
  chunks_file: string;
  chunk_count: number;
  image_count: number;
  images: ManualImage[];
  videos: Array<{ src: string; section_path: string }>;
  related_articles: Array<{ title: string; url: string }>;
  /** Links the manual makes to other help-center articles, by section. */
  outbound_links: Array<{ text: string; url: string; section_path: string }>;
};

/** Section → support category/scope. Order matters: first match wins. */
export const SECTION_RULES: Array<{ match: RegExp; category: ManualCategory; scope: ManualScope }> = [
  { match: /^Playback User Guide > App Overview/, category: "setup", scope: "in-scope" },
  { match: /Get Started \| Video/, category: "setup", scope: "in-scope" },
  { match: /^Playback User Guide > User Interface Overview/, category: "setup", scope: "in-scope" },
  { match: /^Playback User Guide > Building a Setlist/, category: "song-loading", scope: "in-scope" },
  { match: /Setlist Data Management|Setlists Menu|Setlists menu/, category: "song-loading", scope: "in-scope" },
  { match: /About Tab/, category: "subscription", scope: "adjacent" },
  { match: /MIDI Settings Tab|Connecting MIDI Devices|MIDI Cues|MIDI & Keyboard/, category: "advanced", scope: "out-of-scope" },
  { match: /General Settings Tab|Tracks Settings Tab|Buses Settings Tab|Side Menu/, category: "audio-output", scope: "in-scope" },
  { match: /Choosing an Audio Interface|Audio Routing|Setting up Audio and MIDI/, category: "audio-output", scope: "in-scope" },
  { match: /Tracks\/Buses Mixer|Click|Tracks\/Buses\/Pad Player/, category: "audio-output", scope: "adjacent" },
  { match: /^Playback User Guide > Customizing Setlists/, category: "advanced", scope: "out-of-scope" },
  { match: /Playback Remote|Redundancy|SMPTE|Pad Player|Playback Sync|Named Arrangements/, category: "advanced", scope: "out-of-scope" },
  { match: /^Playback User Guide > Live Performance/, category: "general", scope: "adjacent" },
  { match: /Conclusion and FAQs/, category: "general", scope: "adjacent" },
];

export function classifySection(sectionPath: string): { category: ManualCategory; scope: ManualScope } {
  for (const r of SECTION_RULES) if (r.match.test(sectionPath)) return { category: r.category, scope: r.scope };
  return { category: "general", scope: "adjacent" };
}
