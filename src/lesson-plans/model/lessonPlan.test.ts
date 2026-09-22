import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysToPersist,
  extraDatesFromDays,
  isSunday,
  lessonPlanDaysToShow,
  remainingDaysForWeek,
  remapDaysToWeek,
  validateLessonPlanDraft,
  visibleDaysForWeek,
  weekDates,
} from "./validate.ts";
import {
  filterPickerGroups,
  groupMaterialsForPicker,
  toggleMaterialId,
} from "./materials.ts";

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
      days: visibleDaysForWeek("2026-09-13"),
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
      days: visibleDaysForWeek("2026-09-13"),
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

test("visibleDaysForWeek defaults to Mon–Fri and keeps content extras", () => {
  const shown = visibleDaysForWeek("2026-09-13");
  assert.deepEqual(
    shown.map((day) => day.date),
    ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"],
  );
  const withSunday = visibleDaysForWeek("2026-09-13", [1, 2, 3, 4, 5], {
    existingDays: [{ date: "2026-09-13", body: "Sunday note", materialIds: [] }],
  });
  assert.equal(withSunday[0]?.date, "2026-09-13");
  assert.equal(withSunday[0]?.body, "Sunday note");
  const added = visibleDaysForWeek("2026-09-13", [1, 2, 3, 4, 5], {
    extraDates: ["2026-09-19"],
  });
  assert.equal(added.at(-1)?.date, "2026-09-19");
});

test("remainingDaysForWeek lists hidden weekdays", () => {
  assert.deepEqual(
    remainingDaysForWeek("2026-09-13", [
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
    ]),
    ["2026-09-13", "2026-09-19"],
  );
});

test("extraDatesFromDays remaps non-school weekdays onto a new week", () => {
  assert.deepEqual(
    extraDatesFromDays(
      [{ date: "2026-09-19", body: "", materialIds: [] }],
      "2026-09-20",
      [1, 2, 3, 4, 5],
    ),
    ["2026-09-26"],
  );
});
test("toggleMaterialId adds and removes", () => {
  assert.deepEqual(toggleMaterialId([1], 2), [1, 2]);
  assert.deepEqual(toggleMaterialId([1, 2], 1), [2]);
});

test("filterPickerGroups matches material or unit titles", () => {
  const groups = groupMaterialsForPicker(
    [
      { id: 1, title: "Lab worksheet", unitId: 10, visibility: "published" },
      { id: 2, title: "Quiz", unitId: 10, visibility: "published" },
      { id: 3, title: "Syllabus", unitId: null, visibility: "published" },
    ],
    [{ id: 10, title: "Unit 1: Cells" }],
  );

  assert.equal(filterPickerGroups(groups, "quiz")[0]?.materials.length, 1);
  assert.equal(filterPickerGroups(groups, "cells")[0]?.materials.length, 2);
  assert.equal(filterPickerGroups(groups, "syllabus")[0]?.unitId, null);
  assert.deepEqual(filterPickerGroups(groups, "  "), groups);
});
