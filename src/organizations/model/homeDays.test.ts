import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isOrgHomeDay,
  normalizeHomeDays,
  parseHomeDays,
  toggleHomeDay,
} from "./homeDays.ts";
import { weekdayOfIsoDate } from "./schoolDays.ts";

test("parseHomeDays allows empty", () => {
  assert.deepEqual(parseHomeDays([]), []);
  assert.deepEqual(parseHomeDays(null), []);
});

test("toggleHomeDay can clear all days", () => {
  assert.deepEqual(toggleHomeDay([1], 1), []);
  assert.deepEqual(toggleHomeDay([1, 2], 5), [1, 2, 5]);
});

test("isOrgHomeDay is false when home days unset", () => {
  assert.equal(isOrgHomeDay("2026-09-14", []), false);
  assert.equal(isOrgHomeDay("2026-09-14", normalizeHomeDays([1])), true);
  assert.equal(weekdayOfIsoDate("2026-09-14"), 1);
});
