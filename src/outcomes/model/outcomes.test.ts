import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeOutcomes,
  groupFamilyRatings,
  nextSortOrder,
  ratingForCell,
  ratingTargets,
  sortOrdersForIds,
  validateOutcomeStatement,
  validateRatingLabel,
  type CourseOutcome,
} from "./outcomes.ts";

test("rating labels reject blanks, length, and duplicates", () => {
  const existing = [{ id: 1, label: "Mastered" }];
  assert.equal(validateRatingLabel("  ", existing), "Enter a label.");
  assert.equal(validateRatingLabel("Mastered", existing), "That label is already in the list.");
  assert.equal(validateRatingLabel("Mastered", existing, 1), null);
  assert.equal(validateRatingLabel("x".repeat(81), existing)?.includes("80"), true);
  assert.equal(validateRatingLabel(" In progress ", existing), null);
});

test("outcome statements are required and capped", () => {
  assert.equal(
    validateOutcomeStatement("   "),
    "Write what students should be able to do.",
  );
  assert.equal(validateOutcomeStatement("Explain cells"), null);
  assert.equal(validateOutcomeStatement("a".repeat(501))?.includes("500"), true);
});

test("active outcomes stay in sort order and archived ones drop out", () => {
  const outcomes: CourseOutcome[] = [
    {
      id: 2,
      courseId: 1,
      statement: "Second",
      sortOrder: 1,
      archivedAt: null,
      criteria: [],
    },
    {
      id: 1,
      courseId: 1,
      statement: "First",
      sortOrder: 0,
      archivedAt: null,
      criteria: [],
    },
    {
      id: 3,
      courseId: 1,
      statement: "Old",
      sortOrder: 2,
      archivedAt: "2026-01-01T00:00:00Z",
      criteria: [],
    },
  ];
  assert.deepEqual(
    activeOutcomes(outcomes).map((outcome) => outcome.id),
    [1, 2],
  );
});

test("criteria are rated one by one and a bare outcome is rated directly", () => {
  const outcomes: CourseOutcome[] = [
    {
      id: 1,
      courseId: 9,
      statement: "Explain energy",
      sortOrder: 0,
      archivedAt: null,
      criteria: [
        { id: 11, outcomeId: 1, statement: "Mitochondria", sortOrder: 0 },
        { id: 12, outcomeId: 1, statement: "Aerobic vs anaerobic", sortOrder: 1 },
      ],
    },
    {
      id: 2,
      courseId: 9,
      statement: "Use a microscope",
      sortOrder: 1,
      archivedAt: null,
      criteria: [],
    },
    {
      id: 3,
      courseId: 9,
      statement: "Archived",
      sortOrder: 2,
      archivedAt: "2026-01-01",
      criteria: [],
    },
  ];
  const targets = ratingTargets(outcomes);
  assert.deepEqual(
    targets.map((target) => [target.outcomeId, target.criterionId]),
    [
      [1, 11],
      [1, 12],
      [2, null],
    ],
  );
  assert.equal(
    ratingForCell(
      [{ id: 1, studentId: 4, outcomeId: 2, criterionId: null, ratingOptionId: 7 }],
      4,
      targets[2],
    )?.ratingOptionId,
    7,
  );
});

test("family ratings group by course", () => {
  const groups = groupFamilyRatings([
    {
      courseId: 1,
      courseTitle: "Biology",
      outcomeStatement: "Explain energy",
      criterionStatement: "Mitochondria",
      label: "Mastered",
    },
    {
      courseId: 1,
      courseTitle: "Biology",
      outcomeStatement: "Use a microscope",
      criterionStatement: null,
      label: "In progress",
    },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.lines[0]?.text, "Explain energy — Mitochondria");
  assert.equal(groups[0]?.lines[1]?.label, "In progress");
});

test("sort helpers append and rewrite order", () => {
  assert.equal(nextSortOrder([]), 0);
  assert.equal(nextSortOrder([{ sortOrder: 0 }, { sortOrder: 4 }]), 5);
  assert.deepEqual(sortOrdersForIds([8, 3]), [
    { id: 8, sortOrder: 0 },
    { id: 3, sortOrder: 1 },
  ]);
});
