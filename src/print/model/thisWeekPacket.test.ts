import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildParentDashboard,
  type ParentDashboardSource,
} from "../../parent/model/dashboard.ts";
import { thisWeekPrintRefs } from "./thisWeekPacket.ts";
import { groupPacketSections } from "./packet.ts";

const week = {
  start: "2026-09-13",
  end: "2026-09-19",
  label: "Week of Sep 13 – Sep 19",
};

function twoKidsBulletin(): ParentDashboardSource {
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
        courseTitle: "Weekly Bulletin",
        courseStatus: "active",
      },
      {
        studentId: 2,
        courseId: 10,
        courseTitle: "Weekly Bulletin",
        courseStatus: "active",
      },
      {
        studentId: 1,
        courseId: 11,
        courseTitle: "Science",
        courseStatus: "active",
      },
    ],
    materials: [
      {
        id: 100,
        title: "Weekly Bulletin",
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
        materialTitle: "Weekly Bulletin",
        materialDescription: "",
        courseId: 10,
        courseTitle: "Weekly Bulletin",
        unitId: null,
      },
    ],
  };
}

test("this-week print lists each student's materials separately", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsBulletin()));
  assert.deepEqual(
    refs.map((ref) => ({
      materialId: ref.materialId,
      sectionTitle: ref.sectionTitle,
      context: ref.contextLines.join(" · "),
    })),
    [
      {
        materialId: 100,
        sectionTitle: "Emma Caldwell",
        context: "Weekly Bulletin · Important now",
      },
      {
        materialId: 101,
        sectionTitle: "Emma Caldwell",
        context: "Science",
      },
      {
        materialId: 100,
        sectionTitle: "Noah Caldwell",
        context: "Weekly Bulletin · Important now",
      },
    ],
  );
  assert.notEqual(refs[0]?.sectionKey, refs[2]?.sectionKey);
});

test("this-week print does not mash every student into one context line", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsBulletin()));
  for (const ref of refs) {
    const joined = ref.contextLines.join(" · ");
    assert.equal(joined.includes("Emma") && joined.includes("Noah"), false);
  }
});

test("this-week print keeps one copy when a material is important now and dated", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsBulletin()));
  const emma = refs.filter((ref) => ref.sectionTitle === "Emma Caldwell");
  assert.equal(emma.filter((ref) => ref.materialId === 100).length, 1);
});

test("this-week print honors active student filter", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsBulletin()), [2]);
  assert.equal(refs.length, 1);
  assert.equal(refs[0]?.sectionTitle, "Noah Caldwell");
  assert.equal(refs[0]?.materialId, 100);
});

test("packet sections pack the same student and page-break the next", () => {
  const refs = thisWeekPrintRefs(buildParentDashboard(twoKidsBulletin()));
  const sections = groupPacketSections(refs);
  assert.equal(sections.length, 2);
  assert.deepEqual(
    sections.map((section) => section.map((ref) => ref.sectionTitle)),
    [
      ["Emma Caldwell", "Emma Caldwell"],
      ["Noah Caldwell"],
    ],
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
