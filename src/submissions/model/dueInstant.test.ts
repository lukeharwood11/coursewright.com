import assert from "node:assert/strict";
import { test } from "node:test";
import { dueInstantIso, formatDueDeadline, wallTimeInZone } from "./dueInstant";

test("11:59 PM in New York is the next UTC day in winter", () => {
  const iso = dueInstantIso("2026-01-15", "23:59", "America/New_York");
  assert.equal(iso, "2026-01-16T04:59:00.000Z");
  assert.equal(wallTimeInZone(iso, "America/New_York"), "23:59");
});

test("11:59 PM in Los Angeles during daylight time stays 11:59 in that zone", () => {
  const iso = dueInstantIso("2026-07-15", "23:59", "America/Los_Angeles");
  assert.equal(iso, "2026-07-16T06:59:00.000Z");
  assert.match(formatDueDeadline(iso, "America/Los_Angeles"), /11:59 PM/);
  assert.match(formatDueDeadline(iso, "America/Los_Angeles"), /PDT/);
});
