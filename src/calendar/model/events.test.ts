import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chipsForMaterials,
  dayHasCalendarContent,
  filterCourses,
  leftoverChips,
  mergeDayMaterials,
  toggleHiddenCourse,
  weekDatesToShow,
} from "./events.ts";
import { addIsoDays, monthContaining } from "./dates.ts";

test("assigned uses scheduled_date, else unit start", () => {
  const chips = chipsForMaterials([
    {
      id: 1,
      title: "Lab",
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss",
      scheduledDate: "2026-09-15",
      dueDate: "2026-09-17",
      unitId: null,
      unitStart: null,
      unitEnd: null,
      unpublished: false,
    },
    {
      id: 2,
      title: "Packet",
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss",
      scheduledDate: null,
      dueDate: null,
      unitId: 3,
      unitStart: "2026-09-14",
      unitEnd: "2026-09-18",
      unpublished: false,
    },
  ]);
  assert.equal(chips.filter((chip) => chip.kind === "assigned").length, 2);
  assert.equal(chips.find((chip) => chip.kind === "due")?.date, "2026-09-17");
  assert.equal(
    chips.find((chip) => chip.materialId === 2 && chip.kind === "assigned")?.date,
    "2026-09-14",
  );
});

test("mergeDayMaterials dedupes plan materials with assigned/due chips", () => {
  const chips = chipsForMaterials([
    {
      id: 1,
      title: "Lab",
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss",
      scheduledDate: "2026-09-15",
      dueDate: "2026-09-15",
      unitId: null,
      unitStart: null,
      unitEnd: null,
      unpublished: false,
    },
  ]);
  const merged = mergeDayMaterials(
    [{ id: 1, title: "Lab", unitId: null }],
    chips,
    10,
    "2026-09-15",
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.assigned, true);
  assert.equal(merged[0]?.due, true);
  assert.equal(
    leftoverChips(chips, [{ planId: 1, courseId: 10, courseTitle: "Science", colorKey: "moss", date: "2026-09-15", body: "", unpublished: false, materials: merged }], "2026-09-15").length,
    0,
  );
});

test("toggleHiddenCourse and month grid", () => {
  assert.deepEqual(toggleHiddenCourse([], 3), [3]);
  assert.deepEqual(toggleHiddenCourse([3], 3), []);
  const month = monthContaining("2026-09-15");
  assert.equal(month.label, "September 2026");
  assert.equal(addIsoDays("2026-09-13", 6), "2026-09-19");
  assert.deepEqual(
    filterCourses(
      [
        { courseId: 3, title: "Science" },
        { courseId: 4, title: "Art" },
      ],
      new Set([3]),
    ).map((row) => row.courseId),
    [4],
  );
});

test("This week omits empty days and keeps days with notes or chips", () => {
  const week = [
    "2026-09-13",
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
  ];
  const lessonDays = [
    {
      planId: 1,
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss" as const,
      date: "2026-09-14",
      body: "Lab day",
      unpublished: false,
      materials: [],
    },
    {
      planId: 1,
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss" as const,
      date: "2026-09-16",
      body: "   ",
      unpublished: false,
      materials: [],
    },
  ];
  const chips = chipsForMaterials([
    {
      id: 1,
      title: "Reading",
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss",
      scheduledDate: "2026-09-17",
      dueDate: null,
      unitId: null,
      unitStart: null,
      unitEnd: null,
      unpublished: false,
    },
  ]);
  assert.equal(dayHasCalendarContent("2026-09-13", lessonDays, chips), false);
  assert.equal(dayHasCalendarContent("2026-09-16", lessonDays, chips), false);
  assert.deepEqual(weekDatesToShow(week, lessonDays, chips, true), [
    "2026-09-14",
    "2026-09-17",
  ]);
  assert.equal(weekDatesToShow(week, lessonDays, chips, false).length, 7);
});
