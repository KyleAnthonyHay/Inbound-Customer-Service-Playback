/**
 * Time-zone helpers shared by the scheduling tools and the seed. Plain functions, no Convex
 * runtime needed, so unit tests import them directly. All slot math happens server-side so the
 * model never converts time zones itself (US DST ends 2026-11-01, exactly the kind of thing a
 * model gets wrong).
 */

const TZ_ALIASES: Record<string, string> = {
  eastern: "America/New_York", est: "America/New_York", edt: "America/New_York", et: "America/New_York",
  central: "America/Chicago", cst: "America/Chicago", cdt: "America/Chicago", ct: "America/Chicago",
  mountain: "America/Denver", mst: "America/Denver", mdt: "America/Denver", mt: "America/Denver",
  arizona: "America/Phoenix",
  pacific: "America/Los_Angeles", pst: "America/Los_Angeles", pdt: "America/Los_Angeles", pt: "America/Los_Angeles",
  alaska: "America/Anchorage", hawaii: "Pacific/Honolulu",
  utc: "UTC", gmt: "UTC", z: "UTC",
};

/** Accepts IANA names ("America/New_York") or spoken names ("EST", "Eastern", "Central time"). */
export function normalizeTimeZone(input: string | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/\s*(time|timezone|time zone|standard time|daylight time)\s*$/i, "").trim();
  const alias = TZ_ALIASES[key] ?? TZ_ALIASES[key.replace(/^us\s*/i, "")];
  const candidate = alias ?? raw;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return null;
  }
}

export function partsIn(utcMs: number, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const x of dtf.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
}

function offsetMinutes(utcMs: number, timeZone: string): number {
  const p = partsIn(utcMs, timeZone);
  return (Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - utcMs) / 60000;
}

/** Wall-clock date + time in a zone -> epoch ms. Two passes handle DST boundaries. */
export function localToUtcMs(date: string, time: string, timeZone: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m || !t) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  let utc = guess - offsetMinutes(guess, timeZone) * 60000;
  utc = guess - offsetMinutes(utc, timeZone) * 60000;
  return utc;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_MS = 86400000;

/**
 * "2026-11-02" | "monday" | "next tuesday" | "tomorrow" | "today" | "Nov 2" -> YYYY-MM-DD in the caller's zone.
 * Resolved server-side so the model never has to know today's date.
 */
export function resolveDate(input: string, timeZone: string, nowMs: number): string | null {
  const s = input.trim().toLowerCase().replace(/,/g, "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = partsIn(nowMs, timeZone);
  const today = Date.UTC(t.y, t.mo - 1, t.d);
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  if (s === "today") return fmt(today);
  if (s === "tomorrow") return fmt(today + DAY_MS);
  const wd = /^(?:next\s+|this\s+|on\s+)?([a-z]+)$/.exec(s);
  if (wd) {
    const idx = WEEKDAYS.findIndex((d) => d.startsWith(wd[1].slice(0, 3)));
    if (idx >= 0) {
      let delta = (idx - new Date(today).getUTCDay() + 7) % 7;
      if (delta === 0) delta = 7; // "Monday" said on a Monday means next week
      return fmt(today + delta * DAY_MS);
    }
  }
  const withYear = /\d{4}/.test(s) ? s : `${s} ${t.y}`;
  const parsed = Date.parse(`${withYear} 00:00:00 UTC`);
  if (!Number.isNaN(parsed)) {
    const ms = parsed < today && !/\d{4}/.test(s) ? Date.parse(`${s} ${t.y + 1} 00:00:00 UTC`) : parsed;
    return fmt(ms);
  }
  return null;
}

/** "Mon, Nov 2, 5:00 PM EST" */
export function formatLocal(iso: string | number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(iso));
}

/** "17:00" | "5pm" | "5 PM" | "5:30 pm" | "noon" -> "HH:MM" */
export function normalizeTime(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (s === "noon") return "12:00";
  if (s === "midnight") return "00:00";
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/.exec(s);
  if (!m) return null;
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  const ap = m[3]?.replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export function formatHour(utcMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(utcMs));
}


export const WEEKEND = new Set([0, 6]);

/** Local weekday (0 = Sunday) of an instant in a zone. */
export function weekdayIn(utcMs: number, timeZone: string): number {
  const p = partsIn(utcMs, timeZone);
  return new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
}
