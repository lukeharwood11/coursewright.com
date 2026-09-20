import assert from "node:assert/strict";
import { test } from "node:test";
import { FEEDBACK_MESSAGE_MAX, validateFeedbackMessage } from "./validate.ts";

test("rejects an empty note", () => {
  assert.equal(validateFeedbackMessage("   ").ok, false);
});

test("trims a valid note", () => {
  const result = validateFeedbackMessage("  Make print bigger.  ");
  assert.deepEqual(result, { ok: true, value: "Make print bigger." });
});

test("rejects a note that is too long", () => {
  const result = validateFeedbackMessage("x".repeat(FEEDBACK_MESSAGE_MAX + 1));
  assert.equal(result.ok, false);
});
