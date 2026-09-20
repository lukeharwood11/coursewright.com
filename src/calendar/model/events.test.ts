import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chipsForMaterials,
  chipsOutsideLessonPlans,
  dayHasCalendarContent,
  filterCourses,
  leftoverChips,
  mergeDayMaterials,
  toggleHiddenCourse,
  weekClassCards,
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

test("week class cards keep each class’s materials with its plan text", () => {
  const chips = chipsForMaterials([
    {
      id: 1,
      title: "Lab",
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss",
      scheduledDate: "2026-09-15",
      dueDate: null,
      unitId: null,
      unitStart: null,
      unitEnd: null,
      unpublished: false,
    },
    {
      id: 2,
      title: "Sketch",
      courseId: 11,
      courseTitle: "Art",
      colorKey: "clay",
      scheduledDate: "2026-09-15",
      dueDate: null,
      unitId: null,
      unitStart: null,
      unitEnd: null,
      unpublished: false,
    },
  ]);
  const scienceDay = {
    planId: 1,
    courseId: 10,
    courseTitle: "Science",
    colorKey: "moss" as const,
    date: "2026-09-15",
    body: "Lab day",
    unpublished: false,
    materials: [{ id: 1, title: "Lab", unitId: null, assigned: false, due: false }],
  };
  const cards = weekClassCards(["2026-09-15"], [scienceDay], chips);
  assert.equal(cards.length, 2);
  assert.equal(cards[0]?.courseTitle, "Science");
  assert.equal(cards[0]?.body, "Lab day");
  assert.deepEqual(
    cards[0]?.materials.map((material) => material.id),
    [1],
  );
  assert.equal(cards[0]?.chips.length, 0);
  assert.equal(cards[1]?.courseTitle, "Art");
  assert.equal(cards[1]?.body, "");
  assert.equal(cards[1]?.chips[0]?.title, "Sketch");
  assert.equal(chipsOutsideLessonPlans(chips, [scienceDay], "2026-09-15").length, 1);
  assert.equal(leftoverChips(chips, [scienceDay], "2026-09-15").length, 1);

  const twoClasses = weekClassCards(
    ["2026-09-15"],
    [
      scienceDay,
      {
        planId: 2,
        courseId: 11,
        courseTitle: "Art",
        colorKey: "clay",
        date: "2026-09-15",
        body: "Sketch hour",
        unpublished: false,
        materials: [{ id: 2, title: "Sketch", unitId: null, assigned: false, due: false }],
      },
    ],
    chips,
  );
  assert.equal(twoClasses.length, 2);
  assert.equal(twoClasses[0]?.courseTitle, "Art");
  assert.equal(twoClasses[0]?.body, "Sketch hour");
  assert.deepEqual(
    twoClasses[0]?.materials.map((material) => material.id),
    [2],
  );
  assert.equal(twoClasses[1]?.courseTitle, "Science");
  assert.deepEqual(
    twoClasses[1]?.materials.map((material) => material.id),
    [1],
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
