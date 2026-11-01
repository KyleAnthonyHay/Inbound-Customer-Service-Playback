/**
 * Groups parsed blocks into sections (one per leaf heading) and splits long
 * sections into chunks without separating steps from their lead-in, notes from
 * the step they qualify, or list items from each other unless a single list is
 * itself longer than the budget. Pure and deterministic.
 */
import type { Block } from "./parse-article";
import { classifySection, type ManualChunk, type ManualImage } from "../../src/lib/manual/types";

export type Section = {
  path: string[]; // [docTitle, h1, h2?, h3?]
  anchor: string | null;
  blocks: Block[];
  /** Index of the first block of this section in the document block list. */
  startIndex: number;
};

export type ChunkOptions = {
  docTitle: string;
  docSlug: string;
  sourceUrl: string;
  retrievedAt: string;
  sourceUpdatedAt: string;
  /** Soft maximum characters of body text per chunk (heading line excluded). */
  maxChars?: number;
  /** Resolve an image src to its manifest id. */
  imageId: (src: string) => string;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";

/** Split blocks into sections at headings. Media-only sections are folded into the next section. */
export function sectionize(blocks: Block[], docTitle: string): Section[] {
  const sections: Section[] = [];
  let path: string[] = [docTitle];
  let current: Section | null = null;
  let pendingMedia: Block[] = [];

  const hasText = (s: Section) => s.blocks.some((b) => b.kind !== "image" && b.kind !== "video");

  const close = () => {
    if (!current) return;
    if (hasText(current)) sections.push(current);
    else pendingMedia.push(...current.blocks);
    current = null;
  };

  blocks.forEach((b, i) => {
    if (b.kind === "heading") {
      close();
      path = [...path.slice(0, b.level), b.text];
      // A heading at level L sits at path index L (index 0 is the document title).
      while (path.length < b.level + 1) path.splice(path.length - 1, 0, "");
      current = { path: [...path], anchor: b.anchor, blocks: [...pendingMedia], startIndex: i };
      pendingMedia = [];
      return;
    }
    if (!current) current = { path: [...path], anchor: null, blocks: [...pendingMedia], startIndex: i };
    current.blocks.push(b);
  });
  close();
  if (pendingMedia.length && sections.length) sections[sections.length - 1].blocks.push(...pendingMedia);
  return sections.map((s) => ({ ...s, path: s.path.filter((p) => p !== "") }));
}

function renderBlock(b: Block): string {
  switch (b.kind) {
    case "paragraph":
      return b.text;
    case "list":
      return renderItems(b.items, b.ordered).join("\n");
    case "callout":
      return /^(note|tip|reminder|warning|important)\b/i.test(b.text) ? b.text : `Note: ${b.text}`;
    default:
      return "";
  }
}

/** Numbers only top-level items of an ordered list; nested items stay bulleted. Multi-line items are indented. */
export function renderItems(items: string[], ordered: boolean): string[] {
  let n = 0;
  return items.map((item) => {
    const indent = item.match(/^ */)?.[0].length ?? 0;
    const body = item
      .trimStart()
      .replace(/\n\s*\n/g, "\n")
      .replace(/\n/g, `\n${" ".repeat(indent + 3)}`);
    const marker = ordered && indent === 0 ? `${++n}. ` : "- ";
    return `${" ".repeat(indent)}${marker}${body}`;
  });
}

/** A short paragraph with no end punctuation acts as a sub-heading and belongs with what follows. */
const isLeadIn = (b: Block) => b.kind === "paragraph" && (/[:：]\s*$/.test(b.text) || (b.text.length < 80 && !/\n/.test(b.text) && !/[.!?)]$/.test(b.text)));

/** Groups of blocks that must stay together when splitting. */
function cohesiveGroups(blocks: Block[]): Block[][] {
  const groups: Block[][] = [];
  let open = false; // previous group ended with a lead-in ("...:") and wants the next block
  for (const b of blocks) {
    const last = groups[groups.length - 1];
    const attachToPrev =
      last && (open || b.kind === "callout" || b.kind === "image" || b.kind === "video" || (b.kind === "paragraph" && b.emphasis && last.some((x) => x.kind === "image")));
    if (attachToPrev) last.push(b);
    else groups.push([b]);
    open = isLeadIn(b);
  }
  return groups;
}

const textLen = (blocks: Block[]) => blocks.map(renderBlock).filter(Boolean).join("\n\n").length;

/** Splits a single oversized list into runs of items, repeating the lead-in paragraph on each run. */
function splitLongGroup(group: Block[], maxChars: number): Block[][] {
  const list = group.find((b) => b.kind === "list");
  if (!list || list.kind !== "list") return [group];
  const lead = group.slice(0, group.indexOf(list));
  const tail = group.slice(group.indexOf(list) + 1);
  const runs: Block[][] = [];
  let items: string[] = [];
  let offset = 0;
  const flush = () => {
    if (!items.length) return;
    const sub: Block = { ...list, items, ordered: list.ordered };
    // Keep original numbering for ordered lists by prefixing explicit numbers.
    if (list.ordered) {
      let k = offset;
      sub.items = items.map((it) => (it.startsWith(" ") ? it : `${++k}) ${it}`));
      offset = k;
    }
    runs.push([...lead, { ...sub, ordered: false }]);
    items = [];
  };
  for (const it of list.items) {
    if (textLen([...lead, { ...list, items: [...items, it] }]) > maxChars && items.length) flush();
    items.push(it);
  }
  flush();
  if (tail.length) runs[runs.length - 1].push(...tail);
  return runs;
}

export function chunkSections(sections: Section[], opts: ChunkOptions): { chunks: ManualChunk[]; images: ManualImage[] } {
  const maxChars = opts.maxChars ?? 1000;
  const chunks: ManualChunk[] = [];
  const images = new Map<string, ManualImage>();
  const usedSlugs = new Map<string, number>();
  let order = 0;
  let blockCursor = 0;

  for (const section of sections) {
    const sectionPath = section.path.join(" > ");
    const [, h1 = "", h2 = "", h3 = ""] = section.path;
    const { category, scope } = classifySection(sectionPath);
    const base = slugify(section.path.slice(-2).join(" "));
    const n = (usedSlugs.get(base) ?? 0) + 1;
    usedSlugs.set(base, n);
    const sectionSlug = n > 1 ? `${base}-${n}` : base;
    const sectionUrl = section.anchor ? `${opts.sourceUrl}#${section.anchor}` : opts.sourceUrl;

    // Pack cohesive groups into parts under the budget.
    const groups = cohesiveGroups(section.blocks).flatMap((g) => (textLen(g) > maxChars ? splitLongGroup(g, maxChars) : [g]));
    const parts: Block[][] = [];
    let cur: Block[] = [];
    for (const g of groups) {
      if (cur.length && textLen([...cur, ...g]) > maxChars) {
        parts.push(cur);
        cur = [];
      }
      cur.push(...g);
    }
    if (cur.length) parts.push(cur);

    parts.forEach((blocks, i) => {
      const id = `${opts.docSlug}:${sectionSlug}:${i + 1}`;
      const heading = parts.length > 1 ? `${sectionPath} (part ${i + 1} of ${parts.length})` : sectionPath;
      const body = blocks.map(renderBlock).filter(Boolean).join("\n\n");
      const text = `${heading}\n\n${body}`;
      const imageIds: string[] = [];
      for (const b of blocks) {
        if (b.kind !== "image") continue;
        const imgId = opts.imageId(b.src);
        imageIds.push(imgId);
        const existing = images.get(imgId);
        if (existing) existing.chunk_ids.push(id);
        else
          images.set(imgId, {
            id: imgId,
            source_url: b.src,
            file: null,
            alt: b.alt,
            caption: captionFor(b, blocks),
            section_path: sectionPath,
            chunk_ids: [id],
            block_index: section.startIndex + section.blocks.indexOf(b),
            width: b.width,
            height: b.height,
            bytes: null,
          });
      }
      chunks.push({
        id,
        text,
        doc_title: opts.docTitle,
        doc_slug: opts.docSlug,
        source_url: opts.sourceUrl,
        section_url: sectionUrl,
        section_path: sectionPath,
        h1,
        h2,
        h3,
        part: i + 1,
        parts: parts.length,
        category,
        scope,
        has_steps: blocks.some((b) => b.kind === "list"),
        has_callout: blocks.some((b) => b.kind === "callout"),
        image_ids: imageIds,
        image_count: imageIds.length,
        order: order++,
        retrieved_at: opts.retrievedAt,
        source_updated_at: opts.sourceUpdatedAt,
        char_count: text.length,
      });
      blockCursor += blocks.length;
    });
  }
  void blockCursor;
  return { chunks, images: [...images.values()] };
}

/** An italic/bold-only paragraph right after an image is its caption; otherwise fall back to alt text. */
function captionFor(img: Block, blocks: Block[]): string {
  const i = blocks.indexOf(img);
  const next = blocks[i + 1];
  if (next && next.kind === "paragraph" && next.emphasis && next.text.length < 200) return next.text;
  return img.kind === "image" ? img.alt : "";
}
