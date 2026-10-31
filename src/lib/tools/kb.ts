import kbJson from "../../knowledge/playback-kb.json";
import appleJson from "../../knowledge/apple-support-kb.json";
import { classifyStep, type Disruption } from "./disruption";

export type KbArticle = {
  id: string;
  category: string;
  title: string;
  url: string;
  retrievedAt?: string;
  summary: string;
  steps: string[];
  appliesTo?: string[];
  keywords?: string[];
};

export type KbRelease = {
  version: string;
  date: string | null;
  url: string;
  notes: string[];
  keywords?: string[];
};

export type KnowledgeBase = {
  retrievedAt: string;
  articles: KbArticle[];
  releases: KbRelease[];
  requirements?: { url: string; summary: string; details: string[] };
  gaps?: string[];
};

export type AppleSupportKb = { retrievedAt: string; provider: string; note: string; articles: KbArticle[] };

export const kb = kbJson as unknown as KnowledgeBase;
export const appleKb = appleJson as unknown as AppleSupportKb;

const PLAYBACK_PROVIDER = "MultiTracks Help Center";
const APPLE_PROVIDER = "Apple Support";

/* ------------------------------------------------------------------ */
/* Text normalization                                                  */
/* ------------------------------------------------------------------ */

const STOP = new Set([
  "the", "a", "an", "to", "of", "in", "on", "and", "or", "is", "my", "it", "for", "with", "i", "me", "it's", "its",
  "keeps", "keep", "says", "saying", "say", "just", "can", "get", "got", "this", "that", "when", "from", "be", "are",
  "was", "do", "does", "did", "have", "has", "at", "as", "but", "so", "any", "all", "out", "up", "your", "you", "our",
  "we", "there", "what", "how", "why", "playback", "app", "still", "again", "try", "tried", "no", "more", "than",
  "one", "only", "very", "really", "some", "like", "now", "then", "if", "will", "would", "should", "could",
]);

/**
 * Callers describe symptoms in their own words; the docs use product words.
 * Each group maps every variant to one canonical token so "won't load",
 * "not downloading" and "download error" meet the same articles.
 */
const SYNONYMS: string[][] = [
  ["download", "downloading", "downloaded", "load", "loading", "loaded", "loads"],
  ["audio", "sound", "sounds", "hear", "hearing", "silent", "silence", "volume"],
  ["output", "outputs", "out", "routing", "route", "routed", "channel", "channels", "bus", "buses", "busses"],
  ["interface", "interfaces", "mixer", "soundcard"],
  ["usb", "usb-c", "lightning", "dongle", "adapter", "adaptor", "hub"],
  ["network", "wifi", "wi-fi", "internet", "connection", "online", "offline", "router", "vpn"],
  ["crash", "crashes", "crashing", "freeze", "freezes", "frozen", "hang", "hangs", "unresponsive", "responding", "spinning"],
  ["storage", "space", "full"],
  ["headphone", "headphones", "earbuds", "in-ear", "in-ears", "iem", "iems", "jack"],
  ["click", "metronome"],
  ["setlist", "setlists"],
  ["song", "songs", "track", "tracks"],
  ["bluetooth", "airpods", "wireless", "pair", "pairing"],
  ["subscription", "subscribed", "subscriber", "membership", "plan"],
  ["expired", "expire", "expires", "expiring", "lapsed"],
  ["error", "errors", "fail", "fails", "failed", "failing", "failure"],
  ["stuck", "stalled", "stall", "forever"],
  ["mac", "macos", "macbook", "imac", "osx"],
  ["ipad", "ipados"],
  ["iphone", "ios"],
  ["dropout", "dropouts", "cutting", "cuts", "stutter", "stuttering", "glitch", "glitches", "crackling", "pops"],
  ["authorizing", "authorization", "unauthorized", "authorize"],
  ["missing", "gone"],
  ["mono"],
];
const CANON = new Map<string, string>();
for (const group of SYNONYMS) for (const word of group) CANON.set(word, group[0]);

function stem(t: string): string {
  if (CANON.has(t)) return CANON.get(t)!;
  for (const suffix of ["ing", "ed", "es", "s"]) {
    if (t.length > suffix.length + 3 && t.endsWith(suffix)) {
      const base = t.slice(0, -suffix.length);
      if (CANON.has(base)) return CANON.get(base)!;
      return base;
    }
  }
  return t;
}

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.\- ]+/g, " ")
    .split(/[\s.]+/)
    .map((t) => t.replace(/^-+|-+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);
}

/* ------------------------------------------------------------------ */
/* Step analysis                                                       */
/* ------------------------------------------------------------------ */

/** A step that only applies when the caller sees a specific message, e.g. "'Insufficient Storage': ...". */
function stepCondition(text: string): string | undefined {
  return text.match(/^['"‘“]([^'"’”]{3,60})['"’”]/)?.[1];
}

/** Steps that only say "contact support"; the agent's own handoff covers these. */
const isEscalation = (text: string) => /^(still stuck|any other error|if issues persist|further problems|get service|contact)\b/i.test(text);
const isLastResort = (text: string) => /\blast resort\b/i.test(text);
const isAdvanced = (text: string) => /^advanced\b/i.test(text);

export type PlanStep = {
  stepId: string;
  text: string;
  source: string;
  articleTitle: string;
  url: string;
  appliesTo: string[];
  whenMessageIs?: string;
  lastResort: boolean;
} & Disruption;

/** Platform words filter articles (see platformMatches) but don't make an article relevant on their own. */
const PLATFORM_TOKENS = new Set(["mac", "ipad", "iphone", "windows", "device"]);
/** Too common in the docs to say a step is about the caller's symptom. */
const GENERIC_TOKENS = new Set(["song", "error", "audio", "problem", "issue", "work", "working", "help", "not", "wont", "dont", "cant"]);

/** Infers the platform from the caller's words when the model didn't pass one. */
export function inferPlatform(query: string): string | undefined {
  const t = new Set(tokens(query));
  if (t.has("ipad")) return "iPadOS";
  if (t.has("iphone")) return "iOS";
  if (t.has("mac")) return "macOS";
  return undefined;
}

type Scored = { a: KbArticle; provider: string; tier: 1 | 2; score: number };

function scoreArticle(a: KbArticle, q: string[]): number {
  const titleHay = new Set(tokens(a.title + " " + (a.keywords ?? []).join(" ")));
  const hay = new Set(tokens([a.title, a.summary, ...(a.keywords ?? []), ...a.steps].join(" ")));
  let score = 0;
  for (const t of new Set(q)) {
    if (PLATFORM_TOKENS.has(t)) continue;
    if (titleHay.has(t)) score += 3;
    else if (hay.has(t)) score += 1;
  }
  return score;
}

const platformMatches = (a: KbArticle, platform?: string) => {
  if (!platform || !a.appliesTo?.length) return true;
  const p = platform.toLowerCase().replace(/\s+/g, "");
  return a.appliesTo.some((x) => {
    const y = x.toLowerCase();
    return y.includes(p) || p.includes(y) || (p.includes("ipad") && y === "ipados") || (p.includes("iphone") && y === "ios") || (p.includes("mac") && y === "macos");
  });
};

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export type SearchOptions = {
  category?: string;
  platform?: string;
  limit?: number;
  /** stepIds the caller has already tried; they are left out of the plan. */
  alreadyTried?: string[];
  /** "live" moves disruptive steps after safe ones. */
  callerTiming?: "live" | "has-time" | "unknown";
};

/**
 * Searches the bounded MultiTracks help-center snapshot first and Apple's
 * device-level support articles second, then turns the matching articles into
 * an ordered troubleshooting plan of untried steps with stable stepIds.
 */
export function searchDocs(query: string, opts: SearchOptions = {}) {
  const q = tokens(query);
  const platform = opts.platform || inferPlatform(query);
  const limit = Math.min(opts.limit ?? 3, 5);
  const tried = new Set((opts.alreadyTried ?? []).map((s) => s.trim()).filter(Boolean));

  const candidates = (articles: KbArticle[], provider: string, tier: 1 | 2): Scored[] =>
    articles
      .filter((a) => !opts.category || a.category === opts.category || (tier === 2 && a.category === "general"))
      .filter((a) => platformMatches(a, platform))
      .map((a) => ({ a, provider, tier, score: scoreArticle(a, q) }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score);

  let playback = candidates(kb.articles, PLAYBACK_PROVIDER, 1);
  // A category guess that's too narrow shouldn't hide the right article.
  if (!playback.length && opts.category) playback = searchWithoutCategory(kb.articles, q, platform, PLAYBACK_PROVIDER, 1);
  const apple = candidates(appleKb.articles, APPLE_PROVIDER, 2);

  // Keep articles that are close to the best match, so one stray keyword doesn't add noise.
  const near = (list: Scored[], minScore: number) => {
    const top = list[0]?.score ?? 0;
    return list.filter((x) => x.score >= Math.max(minScore, Math.ceil(top * 0.5)));
  };
  const playbackTop = near(playback, 1).slice(0, limit);
  const appleTop = near(apple, 3).slice(0, 2);

  const branches: { articleTitle: string; url: string; askWhichMessage: string[] }[] = [];
  const plan: PlanStep[] = [];
  const queryText = ` ${q.join(" ")} `;

  const symptomTokens = new Set(q.filter((t) => !PLATFORM_TOKENS.has(t) && !GENERIC_TOKENS.has(t)));
  const topScore = playbackTop[0]?.score ?? 0;
  const topAppleId = appleTop[0]?.a.id;
  const stepBucket = new Map<string, number>();

  for (const { a, provider, tier, score } of [...playbackTop, ...appleTop]) {
    const isTopArticle = tier === 1 && score === topScore;
    const conditions = [...new Set(a.steps.map(stepCondition).filter((c): c is string => !!c))];
    const matched = conditions.filter((c) => tokens(c).every((t) => queryText.includes(` ${t} `)));
    if (conditions.length > 1 && matched.length === 0) branches.push({ articleTitle: a.title, url: a.url, askWhichMessage: conditions });

    a.steps.forEach((text, i) => {
      const stepId = `${a.id}#${i + 1}`;
      if (tried.has(stepId)) return;
      if (isEscalation(text) || isAdvanced(text)) return;
      const cond = stepCondition(text);
      if (cond && !matched.includes(cond)) return; // waits until the caller names that message
      const relevant = !!cond || tokens(text).some((t) => symptomTokens.has(t));
      // Steps that mention the symptom come first: Playback's, then Apple's device-level ones.
      // The rest of the best-matching Playback article follows, then the best Apple article;
      // other articles contribute only relevant steps.
      let bucket: number;
      if (relevant) bucket = tier === 1 ? 0 : 1;
      else if (isTopArticle) bucket = 2;
      else if (a.id === topAppleId) bucket = 3;
      else return;
      stepBucket.set(stepId, bucket);
      plan.push({
        stepId,
        text,
        source: provider,
        articleTitle: a.title,
        url: a.url,
        appliesTo: a.appliesTo ?? [],
        ...(cond ? { whenMessageIs: cond } : {}),
        lastResort: isLastResort(text),
        ...classifyStep(text),
      });
    });
  }

  // Stable ordering: relevance bucket, then last-resort steps last, and when the
  // caller is live, steps that interrupt playback after the safe ones.
  const rank = (s: PlanStep) => (s.lastResort ? 100 : 0) + (opts.callerTiming === "live" && s.disruptive ? 10 : 0) + (stepBucket.get(s.stepId) ?? 0);
  const ordered = plan.map((s, i) => ({ s, i })).sort((x, y) => rank(x.s) - rank(y.s) || x.i - y.i).map((x) => x.s);
  // Keep the best device-level (Apple) step in view even when many Playback steps match,
  // so the agent can reach for it once the app-level steps run out.
  const nextSteps = ordered.slice(0, 5);
  const firstApple = ordered.find((s) => s.source === APPLE_PROVIDER && stepBucket.get(s.stepId) === 1);
  if (firstApple && !nextSteps.includes(firstApple)) nextSteps.push(firstApple);

  const results = [...playbackTop, ...appleTop].map(({ a, provider, score }) => {
    const steps = a.steps.map((text, i) => ({ stepId: `${a.id}#${i + 1}`, n: i + 1, text, tried: tried.has(`${a.id}#${i + 1}`), ...classifyStep(text) }));
    return {
      id: a.id,
      title: a.title,
      source: provider,
      category: a.category,
      url: a.url,
      retrievedAt: a.retrievedAt ?? (provider === APPLE_PROVIDER ? appleKb.retrievedAt : kb.retrievedAt),
      appliesTo: a.appliesTo ?? [],
      summary: a.summary,
      steps,
      hasDisruptiveSteps: steps.some((s) => s.disruptive),
      relevance: score,
    };
  });

  const found = results.length;
  const relatedGaps = (kb.gaps ?? []).filter((g) => {
    const gt = new Set(tokens(g));
    return q.filter((t) => gt.has(t)).length >= 2;
  });

  let note: string;
  if (found === 0) note = "No documented article matched. Do not invent steps; ask what exactly they see on screen, or offer a handoff.";
  else if (branches.length && !nextSteps.length)
    note = "The documentation branches on the exact message shown. Ask the caller which message they see, then search again with it.";
  else if (!nextSteps.length)
    note = "Every documented step for this symptom has been tried. Do not repeat steps or invent new ones; summarize what was tried and offer a handoff or callback.";
  else
    note =
      "Give nextSteps[0] (one step per turn) unless the caller already did it, then ask if it worked. Only give steps from these results. Pass the stepIds the caller has tried in alreadyTried on your next search. Playback documentation comes first; Apple Support steps cover the device itself, so say they're Apple's general guidance.";

  return {
    ok: true as const,
    source: "documentation" as const,
    provider: `${PLAYBACK_PROVIDER} (bounded snapshot) + ${APPLE_PROVIDER}`,
    snapshotRetrievedAt: kb.retrievedAt,
    query,
    ...(platform ? { platform } : {}),
    found,
    nextSteps,
    remainingSteps: Math.max(ordered.length - nextSteps.length, 0),
    alreadyTried: [...tried],
    ...(branches.length ? { askWhichMessage: branches } : {}),
    ...(relatedGaps.length ? { documentationGaps: relatedGaps } : {}),
    results,
    note,
  };
}

function searchWithoutCategory(articles: KbArticle[], q: string[], platform: string | undefined, provider: string, tier: 1 | 2): Scored[] {
  return articles
    .filter((a) => platformMatches(a, platform))
    .map((a) => ({ a, provider, tier, score: scoreArticle(a, q) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);
}
