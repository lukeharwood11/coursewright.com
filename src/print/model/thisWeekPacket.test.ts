import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildParentDashboard,
  type ParentDashboardSource,
} from "../../parent/model/dashboard.ts";
import {
  lessonPlanPrintBody,
  printMaterialFromLessonPlan,
  thisWeekPrintRefs,
} from "./thisWeekPacket.ts";
import { groupPacketSections } from "./packet.ts";

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

test("this-week print lists each student's materials separately", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsWeek()));
  assert.deepEqual(
    refs.map((ref) => ({
      source: ref.source,
      id: ref.id,
      sectionTitle: ref.sectionTitle,
      context: ref.contextLines.join(" · "),
    })),
    [
      {
        source: "lesson_plan",
        id: 50,
        sectionTitle: "Emma Caldwell",
        context: "Science · Lesson plan",
      },
      {
        source: "material",
        id: 100,
        sectionTitle: "Emma Caldwell",
        context: "Science · On lesson plan · Important now",
      },
      {
        source: "material",
        id: 101,
        sectionTitle: "Emma Caldwell",
        context: "Nature",
      },
      {
        source: "lesson_plan",
        id: 50,
        sectionTitle: "Noah Caldwell",
        context: "Science · Lesson plan",
      },
      {
        source: "material",
        id: 100,
        sectionTitle: "Noah Caldwell",
        context: "Science · On lesson plan · Important now",
      },
    ],
  );
  assert.notEqual(refs[0]?.sectionKey, refs[3]?.sectionKey);
});

test("this-week print puts lesson-plan content first for each student", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsWeek()));
  const emma = refs.filter((ref) => ref.sectionTitle === "Emma Caldwell");
  assert.equal(emma[0]?.source, "lesson_plan");
  assert.equal(emma[0]?.title, "This week in Science");
  assert.ok(emma.slice(1).every((ref) => ref.source === "material"));
});

test("this-week print does not mash every student into one context line", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsWeek()));
  for (const ref of refs) {
    const joined = ref.contextLines.join(" · ");
    assert.equal(joined.includes("Emma") && joined.includes("Noah"), false);
  }
});

test("this-week print keeps one copy when a material is important now and dated", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsWeek()));
  const emma = refs.filter((ref) => ref.sectionTitle === "Emma Caldwell");
  assert.equal(
    emma.filter((ref) => ref.source === "material" && ref.id === 100).length,
    1,
  );
});

test("this-week print honors active student filter", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsWeek()), [2]);
  assert.equal(refs.length, 2);
  assert.ok(refs.every((ref) => ref.sectionTitle === "Noah Caldwell"));
  assert.equal(refs[0]?.source, "lesson_plan");
  assert.equal(refs[1]?.id, 100);
});

test("packet sections pack the same student and page-break the next", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsWeek()));
  const sections = groupPacketSections(refs);
  assert.equal(sections.length, 2);
  assert.deepEqual(
    sections.map((section) => section.map((ref) => ref.sectionTitle)),
    [
      ["Emma Caldwell", "Emma Caldwell", "Emma Caldwell"],
      ["Noah Caldwell", "Noah Caldwell"],
    ],
  );
});

test("groupPacketSections breaks when pageBreakBefore is set", () => {
  const sections = groupPacketSections([
    { id: 1, sectionKey: "student-1" },
    { id: 2, sectionKey: "student-1", pageBreakBefore: true },
    { id: 3, sectionKey: "student-1" },
  ]);
  assert.equal(sections.length, 2);
  assert.deepEqual(
    sections.map((section) => section.map((item) => item.id)),
    [[1], [2, 3]],
  );
});

test("materials without a section key stay on their own page", () => {
  const sections = groupPacketSections([
    { id: 1 },
    { id: 2 },
    { id: 3, sectionKey: "student-1" },
    { id: 4, sectionKey: "student-1" },
  ]);
  assert.equal(sections.length, 3);
  assert.deepEqual(
    sections.map((section) => section.map((item) => item.id)),
    [[1], [2], [3, 4]],
  );
});

test("printMaterialFromLessonPlan puts the week note and day notes on the page", () => {
  const dashboard = buildParentDashboard(twoKidsWeek());
  const plan = dashboard.lessonPlans[0];
  assert.ok(plan);
  const material = printMaterialFromLessonPlan({
    source: "lesson_plan",
    id: plan.id,
    courseId: plan.courseId,
    sectionKey: "student-1",
    sectionTitle: "Emma Caldwell",
    contextLines: ["Science", "Lesson plan"],
    title: plan.title,
    body: lessonPlanPrintBody(plan),
  });
  assert.equal(material.itemRole, "lesson_plan");
  assert.equal(material.title, "This week in Science");
  assert.equal(material.kind, "page");
  assert.equal(material.blocks.length, 1);
  assert.match(lessonPlanPrintBody(plan), /Start with the lab/);
  assert.match(lessonPlanPrintBody(plan), /Goggles on/);
});
