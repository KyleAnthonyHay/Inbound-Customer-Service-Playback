import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTimeZone, localToUtcMs, resolveDate, normalizeTime, formatLocal } from "../convex/time";

// Saturday 2026-10-31 18:00 UTC. US DST ends 2026-11-01, so Monday is EST (UTC-5).
const NOW = Date.UTC(2026, 9, 31, 18, 0);

test("time zones: spoken names normalize to IANA", () => {
  assert.equal(normalizeTimeZone("EST"), "America/New_York");
  assert.equal(normalizeTimeZone("Eastern time"), "America/New_York");
  assert.equal(normalizeTimeZone("central"), "America/Chicago");
  assert.equal(normalizeTimeZone("America/Denver"), "America/Denver");
  assert.equal(normalizeTimeZone("Narnia"), null);
});

test("dates: weekday names resolve from today in the caller's zone", () => {
  assert.equal(resolveDate("Monday", "America/New_York", NOW), "2026-11-02");
  assert.equal(resolveDate("tomorrow", "America/New_York", NOW), "2026-11-01");
  assert.equal(resolveDate("2026-11-05", "America/New_York", NOW), "2026-11-05");
  assert.equal(resolveDate("Nov 3", "America/New_York", NOW), "2026-11-03");
});

test("times: spoken times normalize and convert across the DST boundary", () => {
  assert.equal(normalizeTime("5 PM"), "17:00");
  assert.equal(normalizeTime("9:30am"), "09:30");
  assert.equal(normalizeTime("17:00"), "17:00");
  // Monday 5 PM Eastern after DST ends = 22:00 UTC; Saturday 5 PM Eastern (still EDT) = 21:00 UTC.
  assert.equal(new Date(localToUtcMs("2026-11-02", "17:00", "America/New_York")!).toISOString(), "2026-11-02T22:00:00.000Z");
  assert.equal(new Date(localToUtcMs("2026-10-31", "17:00", "America/New_York")!).toISOString(), "2026-10-31T21:00:00.000Z");
  assert.match(formatLocal("2026-11-02T22:00:00.000Z", "America/New_York"), /Mon, Nov 2, 5:00 PM EST/);
});
