import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_SCHOOL_DAYS,
  normalizeSchoolDays,
  parseSchoolDays,
  sameSchoolDays,
  toggleSchoolDay,
  weekdayOfIsoDate,
} from "./schoolDays.ts";

test("parseSchoolDays normalizes unique sorted weekdays", () => {
  assert.deepEqual(parseSchoolDays([5, 1, 1, 3]), [1, 3, 5]);
  assert.equal(parseSchoolDays([]), null);
  assert.equal(parseSchoolDays("nope"), null);
  assert.deepEqual(parseSchoolDays(DEFAULT_SCHOOL_DAYS), [1, 2, 3, 4, 5]);
});

test("toggleSchoolDay refuses to clear the last day", () => {
  assert.deepEqual(toggleSchoolDay([1], 1), [1]);
  assert.deepEqual(toggleSchoolDay([1, 2], 1), [2]);
  assert.deepEqual(toggleSchoolDay([1, 2], 5), [1, 2, 5]);
});

test("normalizeSchoolDays drops invalid values", () => {
  assert.deepEqual(normalizeSchoolDays([1, 9, -1, 6]), [1, 6]);
});

test("weekdayOfIsoDate matches JS getDay", () => {
  assert.equal(weekdayOfIsoDate("2026-09-13"), 0);
  assert.equal(weekdayOfIsoDate("2026-09-14"), 1);
  assert.equal(weekdayOfIsoDate("2026-09-19"), 6);
});

test("sameSchoolDays compares in order", () => {
  assert.equal(sameSchoolDays([1, 2], [1, 2]), true);
  assert.equal(sameSchoolDays([1, 2], [2, 1]), false);
});
