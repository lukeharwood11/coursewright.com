import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildParentDashboard,
  bulletinForStudentsLabel,
  datedMaterialCount,
  dueThisWeekStudents,
  extraAssignedThisWeekCount,
  extraAssignedThisWeekLabel,
  filterParentDashboard,
  parentHomeStudentSections,
  thisWeekStudents,
  type ParentDashboardSource,
} from "./dashboard.ts";
import { calendarWeekContaining, isInCalendarWeek } from "./thisWeek.ts";

const week = {
  start: "2026-09-13",
  end: "2026-09-19",
  label: "Week of Sep 13 – Sep 19",
};

function source(
  overrides: Partial<ParentDashboardSource> = {},
): ParentDashboardSource {
  return {
    week,
    today: "2026-09-15",
    students: [{ id: 1, name: "Maya", gradeLevel: "4" }],
    enrollments: [
      {
        studentId: 1,
        courseId: 10,
        courseTitle: "Science",
        courseStatus: "active",
      },
    ],
    materials: [],
    importantNow: [],
    bulletins: [],
    ...overrides,
  };
}

test("this week includes materials assigned in the week", () => {
  assert.equal(
    isInCalendarWeek(week, "2026-09-16", null, null, null),
    true,
  );
});

test("this week includes materials due in the week even without assignment date", () => {
  assert.equal(
    isInCalendarWeek(week, null, null, null, "2026-09-18"),
    true,
  );
});

test("this week excludes materials with dates outside the week", () => {
  assert.equal(
    isInCalendarWeek(week, "2026-09-10", null, null, "2026-09-22"),
    false,
  );
});

test("dashboard surfaces next assigned and next due separately", () => {
  const dashboard = buildParentDashboard(
    source({
      materials: [
        {
          id: 1,
          title: "Lab write-up",
          scheduledDate: "2026-09-20",
          dueDate: "2026-09-25",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
        {
          id: 2,
          title: "Reading pages",
          scheduledDate: "2026-09-17",
          dueDate: "2026-09-16",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
    }),
  );

  assert.equal(dashboard.nextAssignedItem?.material.title, "Reading pages");
  assert.equal(dashboard.nextAssignedItem?.sortDate, "2026-09-17");
  assert.equal(dashboard.nextDueItem?.material.title, "Reading pages");
  assert.equal(dashboard.nextDueItem?.sortDate, "2026-09-16");

  const weekTitles = dashboard.students[0].courses[0].materials.map(
    (material) => material.title,
  );
  assert.deepEqual(weekTitles, ["Reading pages"]);
});

test("this week includes a due-only material and labels assigned vs due", () => {
  const dashboard = buildParentDashboard(
    source({
      materials: [
        {
          id: 3,
          title: "Journal pages",
          scheduledDate: null,
          dueDate: "2026-09-18",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
    }),
  );

  const material = dashboard.students[0].courses[0].materials[0];
  assert.equal(material.title, "Journal pages");
  assert.equal(material.assignedDate, null);
  assert.equal(material.dueDate, "2026-09-18");
  assert.equal(dashboard.nextDueItem?.material.id, 3);
  assert.equal(dashboard.nextAssignedItem, null);
});

test("filterParentDashboard scopes coming up by selected student", () => {
  const dashboard = buildParentDashboard(
    source({
      students: [
        { id: 1, name: "Maya", gradeLevel: "4" },
        { id: 2, name: "Eli", gradeLevel: "2" },
      ],
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
        {
          studentId: 2,
          courseId: 11,
          courseTitle: "Art",
          courseStatus: "active",
        },
      ],
      materials: [
        {
          id: 1,
          title: "Science packet",
          scheduledDate: "2026-09-16",
          dueDate: "2026-09-17",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
        {
          id: 2,
          title: "Art project",
          scheduledDate: "2026-09-16",
          dueDate: "2026-09-18",
          courseId: 11,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
    }),
  );

  const filtered = filterParentDashboard(dashboard, [2]);
  assert.equal(filtered.nextAssignedItem?.material.title, "Art project");
  assert.equal(filtered.nextDueItem?.material.title, "Art project");
  assert.equal(filtered.students.length, 1);
});

test("thisWeekStudents omits courses with no dated materials", () => {
  const dashboard = buildParentDashboard(
    source({
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
        {
          studentId: 1,
          courseId: 12,
          courseTitle: "Music",
          courseStatus: "active",
        },
      ],
      materials: [
        {
          id: 1,
          title: "Lab write-up",
          scheduledDate: "2026-09-16",
          dueDate: null,
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
    }),
  );

  assert.equal(dashboard.students[0].courses.length, 2);
  assert.equal(datedMaterialCount(dashboard.students), 1);

  const week = thisWeekStudents(dashboard.students);
  assert.equal(week.length, 1);
  assert.equal(week[0].courses.length, 1);
  assert.equal(week[0].courses[0].title, "Science");
});

test("thisWeekStudents keeps a student with no active course", () => {
  const dashboard = buildParentDashboard(
    source({
      students: [
        { id: 1, name: "Maya", gradeLevel: "4" },
        { id: 2, name: "Eli", gradeLevel: "2" },
      ],
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
      ],
      materials: [
        {
          id: 1,
          title: "Lab write-up",
          scheduledDate: "2026-09-16",
          dueDate: null,
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
    }),
  );

  const week = thisWeekStudents(dashboard.students);
  assert.equal(week.length, 2);
  const eli = week.find((student) => student.name === "Eli");
  assert.equal(eli?.hasActiveEnrollment, false);
  assert.equal(eli?.courses.length, 0);
});

test("calendarWeekContaining builds a Sunday–Saturday week", () => {
  const result = calendarWeekContaining(new Date(2026, 8, 16));
  assert.equal(result.start, "2026-09-13");
  assert.equal(result.end, "2026-09-19");
});

test("dashboard includes available bulletins for enrolled courses only", () => {
  const dashboard = buildParentDashboard(
    source({
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
      ],
      bulletins: [
        {
          id: 1,
          title: "Week 3 packet",
          body: "Start with the lab.",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 10,
          courseTitle: "Science",
          materialCount: 2,
        },
        {
          id: 2,
          title: "Next week",
          body: "",
          startDate: "2026-09-20",
          endDate: "2026-09-26",
          courseId: 10,
          courseTitle: "Science",
          materialCount: 1,
        },
        {
          id: 3,
          title: "Art note",
          body: "",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 11,
          courseTitle: "Art",
          materialCount: 0,
        },
      ],
    }),
  );

  assert.deepEqual(
    dashboard.bulletins.map((row) => row.title),
    ["Week 3 packet"],
  );
  assert.deepEqual(
    dashboard.bulletins[0]?.students.map((student) => student.name),
    ["Maya"],
  );
});

test("filterParentDashboard scopes bulletins by selected student", () => {
  const dashboard = buildParentDashboard(
    source({
      students: [
        { id: 1, name: "Maya", gradeLevel: "4" },
        { id: 2, name: "Eli", gradeLevel: "2" },
      ],
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
        {
          studentId: 2,
          courseId: 11,
          courseTitle: "Art",
          courseStatus: "active",
        },
      ],
      bulletins: [
        {
          id: 1,
          title: "Science note",
          body: "",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 10,
          courseTitle: "Science",
          materialCount: 1,
        },
        {
          id: 2,
          title: "Art note",
          body: "",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 11,
          courseTitle: "Art",
          materialCount: 0,
        },
      ],
    }),
  );

  const filtered = filterParentDashboard(dashboard, [2]);
  assert.deepEqual(
    filtered.bulletins.map((row) => row.title),
    ["Art note"],
  );
  assert.deepEqual(
    filtered.bulletins[0]?.students.map((student) => student.name),
    ["Eli"],
  );
});

test("shared-course bulletin lists every enrolled student", () => {
  const dashboard = buildParentDashboard(
    source({
      students: [
        { id: 1, name: "Maya", gradeLevel: "4" },
        { id: 2, name: "Eli", gradeLevel: "2" },
      ],
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
        {
          studentId: 2,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
      ],
      bulletins: [
        {
          id: 1,
          title: "Science note",
          body: "",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 10,
          courseTitle: "Science",
          materialCount: 1,
        },
      ],
    }),
  );

  assert.deepEqual(
    dashboard.bulletins[0]?.students.map((student) => student.name),
    ["Eli", "Maya"],
  );
  assert.equal(
    bulletinForStudentsLabel(dashboard.bulletins[0]?.students ?? []),
    "For Eli and Maya",
  );

  const filtered = filterParentDashboard(dashboard, [1]);
  assert.deepEqual(
    filtered.bulletins[0]?.students.map((student) => student.name),
    ["Maya"],
  );
});

test("parent home defaults this week to due work and counts extra assigned", () => {
  const dashboard = buildParentDashboard(
    source({
      materials: [
        {
          id: 1,
          title: "Lab write-up",
          scheduledDate: "2026-09-16",
          dueDate: "2026-09-18",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
        {
          id: 2,
          title: "Reading pages",
          scheduledDate: "2026-09-15",
          dueDate: null,
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
        {
          id: 3,
          title: "Journal pages",
          scheduledDate: null,
          dueDate: "2026-09-19",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
    }),
  );

  const fullWeek = thisWeekStudents(dashboard.students);
  assert.deepEqual(
    fullWeek[0]?.courses[0]?.materials.map((material) => material.title),
    ["Reading pages", "Lab write-up", "Journal pages"],
  );

  const dueWeek = dueThisWeekStudents(dashboard.students, week);
  assert.deepEqual(
    dueWeek[0]?.courses[0]?.materials.map((material) => material.title),
    ["Lab write-up", "Journal pages"],
  );
  assert.equal(extraAssignedThisWeekCount(dashboard.students, week), 1);
  assert.equal(extraAssignedThisWeekLabel(1), "1 more assigned this week");
  assert.equal(extraAssignedThisWeekLabel(3), "3 more assigned this week");
});

test("bulletinForStudentsLabel names one, two, or many students", () => {
  assert.equal(bulletinForStudentsLabel([]), null);
  assert.equal(
    bulletinForStudentsLabel([{ id: 1, name: "Maya" }]),
    "For Maya",
  );
  assert.equal(
    bulletinForStudentsLabel([
      { id: 2, name: "Eli" },
      { id: 1, name: "Maya" },
    ]),
    "For Eli and Maya",
  );
  assert.equal(
    bulletinForStudentsLabel([
      { id: 2, name: "Eli" },
      { id: 1, name: "Maya" },
      { id: 3, name: "Sam" },
    ]),
    "For Eli, Maya, and Sam",
  );
});

test("parent home groups bulletins ahead of this-week work by student name", () => {
  const dashboard = buildParentDashboard(
    source({
      students: [
        { id: 1, name: "Maya", gradeLevel: "4" },
        { id: 2, name: "Eli", gradeLevel: "2" },
      ],
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
        },
        {
          studentId: 2,
          courseId: 11,
          courseTitle: "Art",
          courseStatus: "active",
        },
      ],
      materials: [
        {
          id: 1,
          title: "Science packet",
          scheduledDate: "2026-09-16",
          dueDate: "2026-09-18",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
      bulletins: [
        {
          id: 1,
          title: "Science note",
          body: "",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 10,
          courseTitle: "Science",
          materialCount: 1,
        },
        {
          id: 2,
          title: "Art note",
          body: "",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          courseId: 11,
          courseTitle: "Art",
          materialCount: 0,
        },
      ],
    }),
  );

  assert.deepEqual(
    dashboard.students.map((student) => student.name),
    ["Eli", "Maya"],
  );

  const sections = parentHomeStudentSections(
    dashboard.students,
    dueThisWeekStudents(dashboard.students, week),
    dashboard.bulletins,
  );
  assert.deepEqual(
    sections.map((section) => ({
      name: section.student.name,
      bulletins: section.bulletins.map((item) => item.title),
      materials:
        section.weekStudent?.courses.flatMap((course) =>
          course.materials.map((material) => material.title),
        ) ?? [],
    })),
    [
      { name: "Eli", bulletins: ["Art note"], materials: [] },
      { name: "Maya", bulletins: ["Science note"], materials: ["Science packet"] },
    ],
  );
});

