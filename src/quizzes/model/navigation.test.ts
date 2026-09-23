import assert from "node:assert/strict";
import test from "node:test";
import {
  quizBackDestination,
  quizLocationState,
  quizOpenedFromUnit,
} from "./navigation";

test("quizLocationState only sets fromUnit when opened from the unit page", () => {
  assert.deepEqual(quizLocationState(true), { fromUnit: true });
  assert.equal(quizLocationState(false), undefined);
});

test("quizOpenedFromUnit reads location state", () => {
  assert.equal(quizOpenedFromUnit({ fromUnit: true }), true);
  assert.equal(quizOpenedFromUnit({}), false);
  assert.equal(quizOpenedFromUnit(null), false);
});

test("quizBackDestination prefers the unit only when fromUnit is set", () => {
  const unit = { id: 9, title: "Week 1" };
  assert.deepEqual(
    quizBackDestination({
      fromUnit: true,
      orgSlug: "co-op",
      courseId: 3,
      courseTitle: "Biology",
      unit,
    }),
    {
      to: "/my/co-op/courses/3/units/9",
      label: "Back to Week 1",
    },
  );
  assert.deepEqual(
    quizBackDestination({
      fromUnit: false,
      orgSlug: "co-op",
      courseId: 3,
      courseTitle: "Biology",
      unit,
    }),
    {
      to: "/my/co-op/courses/3",
      label: "Back to Biology",
    },
  );
});
