import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildParentDashboard,
  type ParentDashboardSource,
} from "../../parent/model/dashboard.ts";
import {
  applyPrintSelection,
  buildThisWeekPrintCatalog,
  defaultThisWeekPrintSelection,
  printKeyLessonPlanNotes,
  printKeyMaterial,
} from "./thisWeekPrintCatalog.ts";
import { thisWeekPrintRefs } from "./thisWeekPacket.ts";

const week = {
  start: "2026-09-13",
  end: "2026-09-19",
  label: "Week of Sep 13 – Sep 19",
};

function twoKidsWeek(): ParentDashboardSource {
  return {
    week,
    today: "2026-09-15",
    students: [
      { id: 1, name: "Emma Caldwell", gradeLevel: "4" },
      { id: 2, name: "Noah Caldwell", gradeLevel: "2" },
    ],
    enrollments: [
      {
        studentId: 1,
        courseId: 10,
        courseTitle: "Science",
        courseStatus: "active",
        colorKey: "sea",
      },
      {
        studentId: 2,
        courseId: 10,
        courseTitle: "Science",
        courseStatus: "active",
        colorKey: "sea",
      },
      {
        studentId: 1,
        courseId: 11,
        courseTitle: "Nature",
        courseStatus: "active",
        colorKey: "moss",
      },
    ],
    materials: [
      {
        id: 100,
        title: "Lab write-up",
        scheduledDate: "2026-09-15",
        dueDate: null,
        courseId: 10,
        unitId: null,
        unitStart: null,
        unitEnd: null,
      },
      {
        id: 101,
        title: "Leaf collection",
        scheduledDate: "2026-09-16",
        dueDate: null,
        courseId: 11,
        unitId: null,
        unitStart: null,
        unitEnd: null,
      },
    ],
    importantNow: [
      {
        id: 1,
        materialId: 100,
        materialTitle: "Lab write-up",
        materialDescription: "",
        courseId: 10,
        courseTitle: "Science",
        unitId: null,
      },
    ],
    lessonPlans: [
      {
        id: 50,
        title: "This week in Science",
        weekNote: "Start with the lab.",
        weekStart: "2026-09-13",
        courseId: 10,
        courseTitle: "Science",
        colorKey: "sea",
        visibility: "published",
        days: [
          {
            date: "2026-09-15",
            body: "Goggles on.",
            materials: [{ id: 100, title: "Lab write-up", unitId: null }],
          },
        ],
      },
    ],
  };
}

test("catalog dedupes important now with dated material", () => {
  const catalog = buildThisWeekPrintCatalog(buildParentDashboard(twoKidsWeek()));
  const emmaLab = catalog.items.filter(
    (item) => item.studentId === 1 && item.id === 100 && item.itemKind === "material",
  );
  assert.equal(emmaLab.length, 1);
  assert.ok(emmaLab[0]?.categories.includes("important_now"));
  assert.ok(emmaLab[0]?.categories.includes("assigned"));
  assert.ok(emmaLab[0]?.categories.includes("lesson_plan_material"));
});

test("applyPrintSelection omits keys and honors breaks", () => {
  const dashboard = buildParentDashboard(twoKidsWeek());
  const catalog = buildThisWeekPrintCatalog(dashboard);
  const notesKey = printKeyLessonPlanNotes(1, 50);
  const labKey = printKeyMaterial(1, 100);
  const refs = applyPrintSelection(catalog, {
    omittedKeys: new Set([notesKey]),
    breakKeys: new Set([labKey]),
    pack: true,
    studentBreaks: true,
    quizKeyModes: new Map(),
  });
  assert.ok(refs.every((ref) => ref.printKey !== notesKey));
  const lab = refs.find((ref) => ref.printKey === labKey);
  assert.ok(lab?.pageBreakBefore);
});

test("thisWeekPrintRefs matches catalog with default selection", () => {
  const dashboard = buildParentDashboard(twoKidsWeek());
  const fromRefs = thisWeekPrintRefs(dashboard);
  const fromCatalog = applyPrintSelection(
    buildThisWeekPrintCatalog(dashboard),
    defaultThisWeekPrintSelection(),
  );
  assert.equal(fromRefs.length, fromCatalog.length);
  assert.deepEqual(
    fromRefs.map((ref) => ({ source: ref.source, id: ref.id, sectionTitle: ref.sectionTitle })),
    fromCatalog.map((ref) => ({
      source: ref.source,
      id: ref.id,
      sectionTitle: ref.sectionTitle,
    })),
  );
});
