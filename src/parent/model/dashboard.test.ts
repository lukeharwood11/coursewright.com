import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildParentDashboard,
  bulletinForStudentsLabel,
  datedMaterialCount,
  filterParentDashboard,
  parentWeekHasContent,
  thisWeekStudents,
  type ParentDashboardSource,
} from "./dashboard.ts";
import { parentWeekCalendar } from "./weekCalendar.ts";
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
    lessonPlans: [],
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

test("dashboard includes published lesson plans for this week only", () => {
  const dashboard = buildParentDashboard(
    source({
      enrollments: [
        {
          studentId: 1,
          courseId: 10,
          courseTitle: "Science",
          courseStatus: "active",
          colorKey: "sea",
        },
      ],
      lessonPlans: [
        {
          id: 1,
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
              body: "Lab day",
              materials: [{ id: 9, title: "Lab write-up", unitId: null }],
            },
          ],
        },
        {
          id: 2,
          title: "Next week",
          weekNote: "Preview",
          weekStart: "2026-09-20",
          courseId: 10,
          courseTitle: "Science",
          colorKey: "sea",
          visibility: "published",
          days: [],
        },
        {
          id: 3,
          title: "Art note",
          weekNote: "Paint",
          weekStart: "2026-09-13",
          courseId: 11,
          courseTitle: "Art",
          colorKey: "clay",
          visibility: "published",
          days: [],
        },
        {
          id: 4,
          title: "Draft",
          weekNote: "Hidden",
          weekStart: "2026-09-13",
          courseId: 10,
          courseTitle: "Science",
          colorKey: "sea",
          visibility: "unpublished",
          days: [],
        },
      ],
    }),
  );

  assert.deepEqual(
    dashboard.lessonPlans.map((row) => row.title),
    ["This week in Science"],
  );
  assert.equal(dashboard.lessonPlans[0]?.weekNote, "Start with the lab.");
  assert.equal(parentWeekHasContent(dashboard), true);
});

test("filterParentDashboard scopes lesson plans by selected student", () => {
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
          colorKey: "sea",
        },
        {
          studentId: 2,
          courseId: 11,
          courseTitle: "Art",
          courseStatus: "active",
          colorKey: "clay",
        },
      ],
      lessonPlans: [
        {
          id: 1,
          title: "Science note",
          weekNote: "Lab",
          weekStart: "2026-09-13",
          courseId: 10,
          courseTitle: "Science",
          colorKey: "sea",
          visibility: "published",
          days: [],
        },
        {
          id: 2,
          title: "Art note",
          weekNote: "Paint",
          weekStart: "2026-09-13",
          courseId: 11,
          courseTitle: "Art",
          colorKey: "clay",
          visibility: "published",
          days: [],
        },
      ],
    }),
  );

  const filtered = filterParentDashboard(dashboard, [2]);
  assert.deepEqual(
    filtered.lessonPlans.map((row) => row.title),
    ["Art note"],
  );
  assert.deepEqual(
    filtered.courses.map((course) => course.title),
    ["Art"],
  );
});

test("parent week calendar puts week notes above days and dedupes chips", () => {
  const dashboard = buildParentDashboard(
    source({
      materials: [
        {
          id: 9,
          title: "Lab write-up",
          scheduledDate: "2026-09-15",
          dueDate: "2026-09-15",
          courseId: 10,
          unitId: null,
          unitStart: null,
          unitEnd: null,
        },
      ],
      lessonPlans: [
        {
          id: 1,
          title: "This week in Science",
          weekNote: "Bring goggles.",
          weekStart: "2026-09-13",
          courseId: 10,
          courseTitle: "Science",
          colorKey: "sea",
          visibility: "published",
          days: [
            {
              date: "2026-09-15",
              body: "Lab day",
              materials: [{ id: 9, title: "Lab write-up", unitId: null }],
            },
          ],
        },
      ],
    }),
  );

  const calendar = parentWeekCalendar(dashboard);
  assert.equal(calendar.weekNotes[0]?.weekNote, "Bring goggles.");
  assert.equal(calendar.lessonDays[0]?.body, "Lab day");
  assert.equal(calendar.chips.filter((chip) => chip.materialId === 9).length, 2);
  assert.ok(calendar.chips.some((chip) => chip.kind === "assigned"));
  assert.ok(calendar.chips.some((chip) => chip.kind === "due"));
});

test("this week calendar still lists assigned and due work without a lesson plan", () => {
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
      ],
    }),
  );

  const calendar = parentWeekCalendar(dashboard);
  assert.equal(calendar.weekNotes.length, 0);
  assert.deepEqual(
    calendar.chips.map((chip) => `${chip.kind}:${chip.title}`).sort(),
    ["assigned:Lab write-up", "assigned:Reading pages", "due:Lab write-up"],
  );
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

test("dashboard surfaces current announcements for matching students", () => {
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
      classMemberships: [{ classId: 5, studentId: 2 }],
      announcements: [
        {
          id: 1,
          title: "Lab cancelled",
          body: "Stay home.",
          startDate: "2026-09-13",
          endDate: "2026-09-19",
          audience: "course",
          courseId: 10,
          classId: null,
          studentId: null,
          courseTitle: "Science",
          classTitle: null,
          studentName: null,
          read: false,
        },
        {
          id: 2,
          title: "Wednesday cohort",
          body: "",
          startDate: null,
          endDate: null,
          audience: "class",
          courseId: null,
          classId: 5,
          studentId: null,
          courseTitle: null,
          classTitle: "Wednesday cohort",
          studentName: null,
          read: true,
        },
        {
          id: 3,
          title: "Next week only",
          body: "",
          startDate: "2026-09-20",
          endDate: "2026-09-26",
          audience: "student",
          courseId: null,
          classId: null,
          studentId: 1,
          courseTitle: null,
          classTitle: null,
          studentName: "Maya",
          read: false,
        },
      ],
    }),
  );

  assert.deepEqual(
    dashboard.announcements.map((row) => row.title),
    ["Lab cancelled", "Wednesday cohort"],
  );
  assert.equal(dashboard.announcements[0]?.read, false);
  assert.deepEqual(
    dashboard.announcements[0]?.students.map((student) => student.name),
    ["Maya"],
  );
  assert.deepEqual(
    dashboard.announcements[1]?.students.map((student) => student.name),
    ["Eli"],
  );

  const filtered = filterParentDashboard(dashboard, [2]);
  assert.deepEqual(
    filtered.announcements.map((row) => row.title),
    ["Wednesday cohort"],
  );
});

