import assert from "node:assert/strict";
import { test } from "node:test";
import { groupPeriodFeedback, periodFeedbackBody, periodFeedbackError } from "./periodFeedback.ts";

test("a blank comment clears the row and a long one is rejected", () => {
  assert.equal(periodFeedbackBody("   "), null);
  assert.equal(periodFeedbackError("   "), null);
  assert.equal(periodFeedbackBody("  Keep going.  "), "Keep going.");
  assert.equal(periodFeedbackBody("Line one.\nLine two."), "Line one.\nLine two.");
  assert.equal(periodFeedbackError("x".repeat(4001)), "Use 4000 characters or fewer.");
  assert.equal(periodFeedbackBody("x".repeat(4001)), null);
});

test("family comments group by course", () => {
  const groups = groupPeriodFeedback([
    {
      courseId: 2,
      courseTitle: "Art",
      cycleId: 9,
      cycleLabel: "Quarter 3",
      body: "Careful with the brush.",
    },
    {
      courseId: 1,
      courseTitle: "Biology",
      cycleId: 9,
      cycleLabel: "Quarter 3",
      body: "Strong lab notes.",
    },
  ]);
  assert.deepEqual(
    groups.map((group) => group.courseTitle),
    ["Art", "Biology"],
  );
  assert.equal(groups[1]?.comments[0]?.body, "Strong lab notes.");
});
