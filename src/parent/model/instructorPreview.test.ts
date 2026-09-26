import assert from "node:assert/strict";
import { test } from "node:test";
import { buildParentDashboard } from "./dashboard.ts";
import {
  INSTRUCTOR_PREVIEW_STUDENT_ID,
  buildInstructorPreviewSource,
} from "./instructorPreview.ts";

const week = {
  start: "2026-09-20",
  end: "2026-09-26",
  label: "Week of Sep 20 – Sep 26",
};

test("instructor preview with taught courses builds one synthetic student", () => {
  const source = buildInstructorPreviewSource({
    week,
    today: "2026-09-23",
    studentName: "Preview",
    courses: [
      { id: 10, title: "Math", status: "active", colorKey: "blue" },
      { id: 11, title: "Art", status: "active", colorKey: "coral" },
    ],
    materials: [
      {
        id: 1,
        title: "Worksheet",
        scheduledDate: "2026-09-23",
        dueDate: null,
        courseId: 10,
        unitId: null,
        unitStart: null,
        unitEnd: null,
      },
    ],
    importantNow: [],
    lessonPlans: [],
    announcements: [],
    events: [],
  });

  const dashboard = buildParentDashboard(source);
  assert.equal(dashboard.students.length, 1);
  assert.equal(dashboard.students[0]?.id, INSTRUCTOR_PREVIEW_STUDENT_ID);
  assert.equal(dashboard.students[0]?.name, "Preview");
  assert.equal(dashboard.hasActiveEnrollment, true);
  assert.equal(dashboard.students[0]?.courses.length, 2);
  assert.equal(
    dashboard.students[0]?.courses.find((c) => c.id === 10)?.materials.length,
    1,
  );
});

test("instructor preview with no taught courses is empty", () => {
  const source = buildInstructorPreviewSource({
    week,
    today: "2026-09-23",
    studentName: "Alex",
    courses: [],
    materials: [],
    importantNow: [],
    lessonPlans: [],
    announcements: [],
    events: [],
  });
  const dashboard = buildParentDashboard(source);
  assert.equal(dashboard.students.length, 1);
  assert.equal(dashboard.hasActiveEnrollment, false);
  assert.equal(dashboard.students[0]?.courses.length, 0);
});
