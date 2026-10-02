import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isSoftPastDue,
  packageSlots,
  reminderRecipients,
  rollup,
  slotsForCycle,
  tasksForUser,
  validateFillCycleDraft,
  type FillCycle,
} from "./fillCycle.ts";

const cycle: FillCycle = {
  id: 1,
  label: "Quarter 3",
  dueOn: "2026-10-09",
  audience: "organization",
  status: "open",
  requireGrades: true,
  requireAttendance: true,
  requireOutcomes: true,
  requirePeriodFeedback: false,
  classIds: [],
  courseIds: [],
};

test("a soft due date is urgency only", () => {
  assert.equal(isSoftPastDue("2026-10-09", "2026-10-09"), false);
  assert.equal(isSoftPastDue("2026-10-09", "2026-10-10"), true);
});

test("drafts require a name, a date, and an audience pick", () => {
  assert.equal(
    validateFillCycleDraft({
      label: "  ",
      dueOn: "2026-10-09",
      audience: "organization",
      classIds: [],
      courseIds: [],
      requireGrades: true,
      requireAttendance: true,
      requireOutcomes: true,
    }),
    "Name this fill cycle.",
  );
  assert.equal(
    validateFillCycleDraft({
      label: "Week 4",
      dueOn: "2026-10-09",
      audience: "courses",
      classIds: [],
      courseIds: [],
      requireGrades: true,
      requireAttendance: false,
      requireOutcomes: false,
    }),
    "Choose at least one course.",
  );
  assert.equal(
    validateFillCycleDraft({
      label: "Week 4",
      dueOn: "2026-10-09",
      audience: "organization",
      classIds: [],
      courseIds: [],
      requireGrades: false,
      requireAttendance: false,
      requireOutcomes: false,
    }),
    "Choose at least one package.",
  );
});

test("outcomes are skipped when a course has none, and a teacher only sees their open work", () => {
  const slots = packageSlots({
    cycle,
    courses: [
      { id: 10, title: "Biology", status: "active" },
      { id: 11, title: "Art", status: "active" },
      { id: 12, title: "Old", status: "archived" },
    ],
    classes: [{ id: 3, title: "Homeroom" }],
    classCourseIds: new Map(),
    coursesWithOutcomes: new Set([10]),
    submissions: [
      { cycleId: 1, kind: "grades", courseId: 10, classId: null },
    ],
  });
  const biologyOutcomes = slots.find(
    (item) => item.kind === "outcomes" && item.courseId === 10,
  );
  const artOutcomes = slots.find((item) => item.kind === "outcomes" && item.courseId === 11);
  assert.equal(biologyOutcomes?.submitted, false);
  assert.equal(artOutcomes, undefined);
  assert.equal(slots.some((item) => item.courseId === 12), false);
  assert.equal(slots.some((item) => item.kind === "attendance" && item.classId === 3), true);
  assert.equal(slots.some((item) => item.kind === "period_feedback"), false);

  const mine = tasksForUser(slots, { courseIds: new Set([10]), classIds: new Set() });
  assert.equal(mine.some((item) => item.kind === "grades"), false);
  assert.equal(mine.some((item) => item.kind === "outcomes" && item.courseId === 10), true);
  assert.equal(rollup(slots).finished, 1);
  assert.equal(rollup(slots).total > 1, true);
});

test("a class audience uses class attendance and courses those students take", () => {
  const slots = packageSlots({
    cycle: { ...cycle, audience: "classes", classIds: [3], courseIds: [] },
    courses: [
      { id: 10, title: "Biology", status: "active" },
      { id: 11, title: "Art", status: "active" },
    ],
    classes: [
      { id: 3, title: "Homeroom" },
      { id: 4, title: "Other" },
    ],
    classCourseIds: new Map([[3, [10]]]),
    coursesWithOutcomes: new Set([10, 11]),
    submissions: [],
  });
  assert.deepEqual(
    slots.filter((item) => item.kind === "attendance").map((item) => item.classId ?? item.courseId),
    [3],
  );
  assert.equal(slots.some((item) => item.courseId === 11), false);
  assert.equal(slots.some((item) => item.courseId === 10 && item.kind === "grades"), true);
});

test("a valid org draft is accepted", () => {
  assert.equal(
    validateFillCycleDraft({
      label: "Week 4",
      dueOn: "2026-10-09",
      audience: "organization",
      classIds: [],
      courseIds: [],
      requireGrades: true,
      requireAttendance: true,
      requireOutcomes: true,
    }),
    null,
  );
});

test("visible scope limits the packages a person counts", () => {
  const slots = slotsForCycle({
    cycle,
    courses: [
      { id: 10, title: "Biology", status: "active" },
      { id: 11, title: "Art", status: "active" },
    ],
    classes: [
      { id: 3, title: "Homeroom" },
      { id: 4, title: "Other" },
    ],
    coursesWithOutcomes: new Set([10, 11]),
    submissions: [],
    scope: [
      { cycleId: 1, courseId: 10, classId: null },
      { cycleId: 1, courseId: null, classId: 3 },
      { cycleId: 2, courseId: 11, classId: null },
    ],
  });
  assert.equal(slots.some((item) => item.courseId === 11), false);
  assert.equal(slots.some((item) => item.classId === 4), false);
  assert.equal(slots.some((item) => item.courseId === 10 && item.kind === "grades"), true);
  assert.equal(slots.some((item) => item.classId === 3 && item.kind === "attendance"), true);
  assert.deepEqual(
    reminderRecipients({
      slots,
      courseInstructors: [{ courseId: 10, userId: "teacher" }],
      classLeaders: [{ classId: 3, userId: "lead" }],
    }).sort(),
    ["lead", "teacher"],
  );
});
