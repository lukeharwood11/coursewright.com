import assert from "node:assert/strict";
import { test } from "node:test";
import { dueInstantIso, formatDueDeadline, formatTimeRemaining, wallTimeInZone } from "./dueInstant";

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

test("time remaining names days, hours, and minutes plainly", () => {
  const due = new Date("2026-09-25T18:00:00.000Z");
  assert.equal(
    formatTimeRemaining(due.toISOString(), new Date("2026-09-23T18:00:00.000Z")),
    "2 days left",
  );
  assert.equal(
    formatTimeRemaining(due.toISOString(), new Date("2026-09-25T15:00:00.000Z")),
    "3 hours left",
  );
  assert.equal(
    formatTimeRemaining(due.toISOString(), new Date("2026-09-25T17:40:00.000Z")),
    "20 minutes left",
  );
  assert.equal(
    formatTimeRemaining(due.toISOString(), new Date("2026-09-25T18:00:00.000Z")),
    null,
  );
});
