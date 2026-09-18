import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildParentDashboard,
  filterParentDashboard,
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

test("calendarWeekContaining builds a Sunday–Saturday week", () => {
  const result = calendarWeekContaining(new Date(2026, 8, 16));
  assert.equal(result.start, "2026-09-13");
  assert.equal(result.end, "2026-09-19");
});
