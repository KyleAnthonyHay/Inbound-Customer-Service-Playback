/**
 * Simulated support hours: 9am to 5pm, Monday to Friday, US Central time.
 * Pure functions (no Intl time-zone data needed), shared by Convex and tests.
 *
 * US Central is UTC-5 during daylight time (second Sunday of March, 2am, to
 * the first Sunday of November, 2am) and UTC-6 otherwise.
 */
export const SUPPORT_HOURS = {
  timeZone: "America/Chicago",
  label: "weekdays 9am to 5pm Central",
  startHour: 9,
  endHour: 17,
  slotMinutes: 30,
} as const;

const HOUR = 60 * 60 * 1000;

/** UTC instant of the n-th Sunday (1-based) of a month at 2am local standard/daylight boundary. */
function nthSundayUtc(year: number, month: number, n: number, utcHour: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const day = 1 + ((7 - first.getUTCDay()) % 7) + (n - 1) * 7;
  return Date.UTC(year, month, day, utcHour);
}

/** Central-time offset from UTC in hours (-5 in daylight time, -6 in standard). */
export function centralOffsetHours(at: Date): number {
  const y = at.getUTCFullYear();
  const dstStart = nthSundayUtc(y, 2, 2, 8); // 2am CST = 08:00 UTC
  const dstEnd = nthSundayUtc(y, 10, 1, 7); // 2am CDT = 07:00 UTC
  const t = at.getTime();
  return t >= dstStart && t < dstEnd ? -5 : -6;
}

/** Wall-clock parts in Central time. */
export function centralParts(at: Date) {
  const local = new Date(at.getTime() + centralOffsetHours(at) * HOUR);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    weekday: local.getUTCDay(), // 0 = Sunday
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
}

/** UTC Date for a Central wall-clock time. */
export function centralToUtc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  // Guess with standard time, then correct with the offset that applies at that instant.
  const guess = Date.UTC(year, month, day, hour, minute) + 6 * HOUR;
  const offset = centralOffsetHours(new Date(guess));
  return new Date(Date.UTC(year, month, day, hour, minute) - offset * HOUR);
}

const isWeekday = (weekday: number) => weekday >= 1 && weekday <= 5;

/** True when `at` falls inside support hours. */
export function isWithinSupportHours(at: Date): boolean {
  const p = centralParts(at);
  return isWeekday(p.weekday) && p.hour >= SUPPORT_HOURS.startHour && p.hour < SUPPORT_HOURS.endHour;
}

/**
 * Callback slots during support hours, starting at or after `from`
 * (rounded up to the next slot boundary), for up to `days` calendar days.
 */
export function supportSlots(from: Date, opts: { days?: number; limit?: number } = {}) {
  const days = opts.days ?? 14;
  const limit = opts.limit ?? 200;
  const step = SUPPORT_HOURS.slotMinutes;
  const out: { startAt: string; endAt: string }[] = [];
  const p = centralParts(from);
  for (let d = 0; d <= days && out.length < limit; d++) {
    const base = new Date(Date.UTC(p.year, p.month, p.day + d));
    if (!isWeekday(base.getUTCDay())) continue;
    for (let mins = SUPPORT_HOURS.startHour * 60; mins < SUPPORT_HOURS.endHour * 60; mins += step) {
      const start = centralToUtc(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), Math.floor(mins / 60), mins % 60);
      if (start.getTime() < from.getTime()) continue;
      out.push({ startAt: start.toISOString(), endAt: new Date(start.getTime() + step * 60 * 1000).toISOString() });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** True when `iso` is exactly a valid slot start (support hours, on the 30-minute grid). */
export function isValidSlotStart(iso: string): boolean {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return false;
  const p = centralParts(at);
  return isWithinSupportHours(at) && p.minute % SUPPORT_HOURS.slotMinutes === 0 && at.getUTCSeconds() === 0 && at.getUTCMilliseconds() === 0;
}

/** Human-readable Central time, e.g. "Monday, Nov 2, 9:00 AM Central". */
export function describeCentral(iso: string): string {
  const p = centralParts(new Date(iso));
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const ampm = p.hour < 12 ? "AM" : "PM";
  return `${dayNames[p.weekday]}, ${months[p.month]} ${p.day}, ${h12}:${String(p.minute).padStart(2, "0")} ${ampm} Central`;
}

/**
 * Normalizes a spoken or typed phone number to digits with an optional
 * leading "+". Returns null unless it has 7 to 15 digits.
 */
export function normalizePhoneNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}
