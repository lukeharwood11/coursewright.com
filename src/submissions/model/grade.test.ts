import assert from "node:assert/strict";
import { test } from "node:test";
import {
  feedbackTextIsValid,
  materialPointsAreValid,
  parseMaterialPoints,
  submissionWaitingForGrade,
} from "./grade.ts";

test("possible points match quiz fractions", () => {
  assert.equal(materialPointsAreValid(10), true);
  assert.equal(materialPointsAreValid(4.5), true);
  assert.equal(materialPointsAreValid(0), false);
  assert.equal(parseMaterialPoints("4.50"), 4.5);
  assert.equal(parseMaterialPoints(""), null);
});

test("feedback is required only when the material is not gradable", () => {
  assert.equal(feedbackTextIsValid("  ", false), false);
  assert.equal(feedbackTextIsValid("Nice work", false), true);
  assert.equal(feedbackTextIsValid("", true), true);
});

test("a turn-in without a saved grade is waiting", () => {
  assert.equal(submissionWaitingForGrade({ versions: [{}], gradedAt: null }), true);
  assert.equal(
    submissionWaitingForGrade({ versions: [{}], gradedAt: "2026-01-01T00:00:00Z" }),
    false,
  );
  assert.equal(submissionWaitingForGrade({ versions: [], gradedAt: null }), false);
});
