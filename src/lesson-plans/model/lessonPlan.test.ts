import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysToPersist,
  emptyDaysForWeek,
  isSunday,
  lessonPlanDaysToShow,
  remapDaysToWeek,
  validateLessonPlanDraft,
  weekDates,
} from "./validate.ts";
import { toggleMaterialId } from "./materials.ts";

test("weekDates lists Sunday through Saturday", () => {
  assert.deepEqual(weekDates("2026-09-13"), [
    "2026-09-13",
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
  ]);
  assert.equal(isSunday("2026-09-13"), true);
  assert.equal(isSunday("2026-09-14"), false);
});

test("validateLessonPlanDraft requires a title and a Sunday", () => {
  assert.equal(
    validateLessonPlanDraft({
      title: "",
      weekNote: "",
      weekStart: "2026-09-13",
      days: emptyDaysForWeek("2026-09-13"),
    }),
    "Add a title so families know what this is.",
  );
  assert.equal(
    validateLessonPlanDraft({
      title: "Week 3",
      weekNote: "",
      weekStart: "2026-09-14",
      days: [],
    }),
    "Lesson plans start on Sunday.",
  );
  assert.equal(
    validateLessonPlanDraft({
      title: "Week 3",
      weekNote: "Hello",
      weekStart: "2026-09-13",
      days: emptyDaysForWeek("2026-09-13"),
    }),
    null,
  );
});

test("daysToPersist keeps days with text or materials only", () => {
  const kept = daysToPersist([
    { date: "2026-09-13", body: "  ", materialIds: [] },
    { date: "2026-09-14", body: "Lab", materialIds: [] },
    { date: "2026-09-15", body: "", materialIds: [3, 3] },
  ]);
  assert.deepEqual(kept, [
    { date: "2026-09-14", body: "Lab", materialIds: [] },
    { date: "2026-09-15", body: "", materialIds: [3] },
  ]);
});

test("lessonPlanDaysToShow omits empty days and sorts by date", () => {
  const shown = lessonPlanDaysToShow([
    { date: "2026-09-16", body: "Quiz", materials: [] },
    { date: "2026-09-14", body: "  ", materials: [] },
    { date: "2026-09-15", body: "", materials: [{ id: 3 }] },
  ]);
  assert.deepEqual(
    shown.map((day) => day.date),
    ["2026-09-15", "2026-09-16"],
  );
});

test("remapDaysToWeek keeps weekday content when the week changes", () => {
  const remapped = remapDaysToWeek(
    [{ date: "2026-09-14", body: "Monday", materialIds: [1] }],
    "2026-09-20",
  );
  assert.equal(remapped[1]?.date, "2026-09-21");
  assert.equal(remapped[1]?.body, "Monday");
  assert.deepEqual(remapped[1]?.materialIds, [1]);
});

test("toggleMaterialId adds and removes", () => {
  assert.deepEqual(toggleMaterialId([1], 2), [1, 2]);
  assert.deepEqual(toggleMaterialId([1, 2], 1), [2]);
});
