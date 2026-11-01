/**
 * Turns the saved Intercom help-center article (raw/article.html) into a flat,
 * ordered list of blocks with a heading hierarchy, keeping images and videos
 * in their positions. Pure: no network, no file writes.
 *
 * Intercom markup: <article> holds one div per block, class
 * intercom-interblocks-{heading,subheading,subheading3,paragraph,image,
 * callout,ordered-nested-list,unordered-nested-list,video,horizontal-rule,
 * collapsible-section}. Collapsible sections are <details><summary>HEADING
 * </summary>…blocks…</details> and can nest, so the heading level of a block
 * inside a collapsible is at least one deeper than the summary heading.
 */
import { parse, HTMLElement, Node, NodeType } from "node-html-parser";

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string; anchor: string | null }
  | { kind: "paragraph"; text: string; links: Link[]; emphasis: boolean }
  | { kind: "list"; ordered: boolean; items: string[]; links: Link[] }
  | { kind: "callout"; text: string; links: Link[] }
  | { kind: "image"; src: string; alt: string; width: number | null; height: number | null }
  | { kind: "video"; src: string };

export type Link = { text: string; url: string };

export type ParsedArticle = {
  title: string;
  description: string;
  sourceUpdatedAt: string | null;
  author: string | null;
  blocks: Block[];
  relatedArticles: Link[];
};

const clean = (s: string) =>
  s
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

function blockClass(el: HTMLElement): string {
  const cls = (el.getAttribute("class") ?? "").split(/\s+/);
  const c = cls.find((x) => x.startsWith("intercom-interblocks-") && !x.startsWith("intercom-interblocks-align") && x !== "intercom-interblocks-");
  return c ? c.replace("intercom-interblocks-", "") : el.tagName.toLowerCase();
}

/** Inline text of an element with <br> as newline and links collected. Link URLs are kept out of the text. */
function inlineText(el: HTMLElement, links: Link[]): string {
  let out = "";
  const walk = (n: Node) => {
    if (n.nodeType === NodeType.TEXT_NODE) {
      out += n.text;
      return;
    }
    if (n.nodeType !== NodeType.ELEMENT_NODE) return;
    const e = n as HTMLElement;
    const tag = e.tagName?.toLowerCase();
    if (tag === "br") {
      out += "\n";
      return;
    }
    if (tag === "a") {
      const href = e.getAttribute("href");
      const text = clean(e.text);
      if (href && text) links.push({ text, url: href });
      out += e.text;
      return;
    }
    for (const c of e.childNodes) walk(c);
    // Block-level children (a <p> inside an <li>, stacked paragraph divs) end a line.
    if (tag === "p" || tag === "div" || tag === "li") out += "\n";
  };
  for (const c of el.childNodes) walk(c);
  return clean(out.replace(/[ \t]*\n[ \t]*/g, "\n"));
}

function listItems(list: HTMLElement, depth = 0): string[] {
  const items: string[] = [];
  for (const li of list.childNodes.filter((n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).tagName?.toLowerCase() === "li")) {
    const sublists = li.querySelectorAll(":scope > ul, :scope > ol, :scope > div > ul, :scope > div > ol");
    for (const s of sublists) s.remove();
    const text = inlineText(li, []);
    if (text) items.push(`${"  ".repeat(depth)}${text}`);
    for (const s of sublists) items.push(...listItems(s, depth + 1));
  }
  return items;
}

/** Images nested inside a text block: pulled out as their own blocks, placed right after the text. */
function extractImages(el: HTMLElement): Block[] {
  const out: Block[] = [];
  for (const img of el.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (src) {
      const w = Number(img.getAttribute("width"));
      const h = Number(img.getAttribute("height"));
      out.push({ kind: "image", src, alt: clean(img.getAttribute("alt") ?? ""), width: w || null, height: h || null });
    }
    // Drop the wrapping image block so its empty text does not leak into the paragraph.
    const wrapper = img.closest(".intercom-interblocks-image") ?? img;
    wrapper.remove();
  }
  return out;
}

function headingOf(el: HTMLElement): HTMLElement | null {
  return el.querySelector("h1, h2, h3, h4");
}

export function parseArticle(html: string): ParsedArticle {
  const root = parse(html);
  const article = root.querySelector("article");
  if (!article) throw new Error("No <article> element found; is this the help-center page?");

  const title = clean(root.querySelector("h1")?.text ?? root.querySelector("title")?.text.replace(/\s*\|.*$/, "") ?? "Untitled");
  const description = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  const sourceUpdatedAt = html.match(/"lastUpdatedDate":"([^"]+)"/)?.[1] ?? null;
  const author = html.match(/Written by\s*(?:<[^>]+>\s*)*([A-Z][\w .'-]{1,40}?)\s*</)?.[1]?.trim() ?? null;

  const blocks: Block[] = [];
  const relatedArticles: Link[] = [];

  /** minLevel: headings inside a collapsible are at least this deep. */
  const walk = (container: HTMLElement, minLevel: number) => {
    for (const node of container.childNodes) {
      if (node.nodeType !== NodeType.ELEMENT_NODE) continue;
      const el = node as HTMLElement;
      const tag = el.tagName?.toLowerCase();
      if (tag === "section") {
        // Intercom's "Related Articles" footer lives inside <article>; keep the links, skip the text.
        for (const a of el.querySelectorAll("a")) {
          const href = a.getAttribute("href");
          if (href) relatedArticles.push({ text: clean(a.text), url: href });
        }
        continue;
      }
      const cls = blockClass(el);
      switch (cls) {
        case "heading":
        case "subheading":
        case "subheading3": {
          const h = headingOf(el);
          if (!h) break;
          const tagLevel = Number(h.tagName.slice(1));
          const level = Math.min(3, Math.max(tagLevel, minLevel)) as 1 | 2 | 3;
          const text = clean(h.text);
          if (text) blocks.push({ kind: "heading", level, text, anchor: h.getAttribute("id") ?? null });
          break;
        }
        case "collapsible-section": {
          const details = el.querySelector("details") ?? el;
          const summary = details.querySelector("summary");
          let level = minLevel;
          if (summary) {
            const h = headingOf(summary);
            if (h) {
              const tagLevel = Number(h.tagName.slice(1));
              level = Math.min(3, Math.max(tagLevel, minLevel));
              const text = clean(h.text);
              if (text) blocks.push({ kind: "heading", level: level as 1 | 2 | 3, text, anchor: h.getAttribute("id") ?? null });
            }
            summary.remove();
          }
          walk(details, Math.min(3, level + 1));
          break;
        }
        case "paragraph": {
          const imgs = extractImages(el);
          const links: Link[] = [];
          const text = inlineText(el, links);
          if (!text) {
            blocks.push(...imgs);
            break;
          }
          const p = el.querySelector("p");
          const emphasis = !!p && p.childNodes.length > 0 && p.childNodes.every((n) => n.nodeType !== NodeType.ELEMENT_NODE ? !clean(n.text) : /^(i|em|b|strong)$/i.test((n as HTMLElement).tagName));
          blocks.push({ kind: "paragraph", text, links, emphasis }, ...imgs);
          break;
        }
        case "ordered-nested-list":
        case "unordered-nested-list": {
          const list = el.querySelector("ol, ul");
          if (!list) break;
          const imgs = extractImages(el);
          const links: Link[] = [];
          for (const a of el.querySelectorAll("a")) {
            const href = a.getAttribute("href");
            const t = clean(a.text);
            if (href && t) links.push({ text: t, url: href });
          }
          const items = listItems(list);
          if (items.length) blocks.push({ kind: "list", ordered: cls.startsWith("ordered"), items, links });
          blocks.push(...imgs);
          break;
        }
        case "callout": {
          const imgs = extractImages(el);
          const links: Link[] = [];
          const parts: string[] = [];
          for (const child of el.childNodes) {
            if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
            const c = child as HTMLElement;
            const ccls = blockClass(c);
            if (ccls.endsWith("nested-list")) {
              const list = c.querySelector("ol, ul");
              if (list) parts.push(listItems(list).map((i) => `- ${i}`).join("\n"));
              for (const a of c.querySelectorAll("a")) {
                const href = a.getAttribute("href");
                const t = clean(a.text);
                if (href && t) links.push({ text: t, url: href });
              }
            } else {
              const t = inlineText(c, links);
              if (t) parts.push(t);
            }
          }
          const text = clean(parts.join("\n"));
          if (text) blocks.push({ kind: "callout", text, links });
          blocks.push(...imgs);
          break;
        }
        case "image": {
          for (const img of el.querySelectorAll("img")) {
            const src = img.getAttribute("src");
            if (!src) continue;
            const w = Number(img.getAttribute("width"));
            const h = Number(img.getAttribute("height"));
            blocks.push({ kind: "image", src, alt: clean(img.getAttribute("alt") ?? ""), width: w || null, height: h || null });
          }
          break;
        }
        case "video": {
          const src = el.querySelector("iframe")?.getAttribute("src");
          if (src) blocks.push({ kind: "video", src });
          break;
        }
        case "horizontal-rule":
          break;
        default: {
          // Unknown block type: keep its text so nothing silently disappears.
          const links: Link[] = [];
          const text = inlineText(el, links);
          if (text) blocks.push({ kind: "paragraph", text, links, emphasis: false });
        }
      }
    }
  };
  walk(article, 1);

  return { title, description, sourceUpdatedAt, author, blocks, relatedArticles };
}
