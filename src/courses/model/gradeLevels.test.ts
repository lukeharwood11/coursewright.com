import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allowedGradeLevels,
  formatGradeLevels,
  orderedGradeLevels,
  toggleGradeLevel,
} from "./gradeLevels.ts";

const k12 = ["K", "1", "2", "3", "4", "5", "6"];

test("orderedGradeLevels follows org label order, not selection order", () => {
  assert.deepEqual(orderedGradeLevels(["5", "3", "4"], k12), ["3", "4", "5"]);
});

test("formatGradeLevels joins one comma-separated list", () => {
  assert.equal(formatGradeLevels(["5", "3", "4"], k12), "3, 4, 5");
});

test("orderedGradeLevels keeps unknown labels after scheme labels", () => {
  assert.deepEqual(orderedGradeLevels(["Honors", "5", "3"], k12), [
    "3",
    "5",
    "Honors",
  ]);
});

test("allowedGradeLevels drops labels that are not on the org and sorts", () => {
  assert.deepEqual(allowedGradeLevels(["5", "Honors", "3"], k12), ["3", "5"]);
});

test("toggleGradeLevel adds and removes a label", () => {
  assert.deepEqual(toggleGradeLevel(["3"], "5"), ["3", "5"]);
  assert.deepEqual(toggleGradeLevel(["3", "5"], "3"), ["5"]);
});
