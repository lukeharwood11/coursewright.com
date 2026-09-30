import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attendanceWindow,
  canWriteClassDay,
  canWriteCourseDay,
  canWriteStudentDay,
  dayBadge,
  mergeAttendanceGrid,
  otherSheetHint,
  studentAttendanceDays,
} from "./daySummary.ts";

test("an explicit day row wins over mixed sheets", () => {
  assert.equal(
    dayBadge({
      dayStatus: "present",
      sheetStatuses: ["present", "excused"],
    }),
    "present",
  );
  assert.equal(
    dayBadge({
      dayStatus: "absent",
      sheetStatuses: [],
    }),
    "absent",
  );
});

test("disagreeing sheets with no day row are Partial", () => {
  assert.equal(
    dayBadge({
      dayStatus: null,
      sheetStatuses: ["present", "excused"],
    }),
    "partial",
  );
  assert.equal(
    dayBadge({
      dayStatus: null,
      sheetStatuses: ["late", "present"],
    }),
    "partial",
  );
});

test("agreeing sheets use that status, including Late", () => {
  assert.equal(
    dayBadge({ dayStatus: null, sheetStatuses: ["late"] }),
    "late",
  );
  assert.equal(
    dayBadge({ dayStatus: null, sheetStatuses: ["late", "late"] }),
    "late",
  );
  assert.equal(
    dayBadge({ dayStatus: null, sheetStatuses: ["excused"] }),
    "excused",
  );
});

test("no rows means no badge", () => {
  assert.equal(dayBadge({ dayStatus: null, sheetStatuses: [] }), null);
});

test("the date grid keeps current members and anyone already marked", () => {
  const rows = mergeAttendanceGrid(
    [{ id: 1, name: "Ada" }],
    [
      { id: 1, name: "Ada" },
      { id: 2, name: "Bea" },
    ],
  );
  assert.deepEqual(rows, [
    { id: 1, name: "Ada", current: true },
    { id: 2, name: "Bea", current: false },
  ]);
});

test("other sheet hint names each sheet", () => {
  assert.equal(
    otherSheetHint([{ title: "Algebra", status: "present" }]),
    "Also marked on Algebra · Present.",
  );
  assert.equal(otherSheetHint([]), null);
});

test("attendance window is 14 local dates ending on the chosen day", () => {
  const dates = attendanceWindow("2026-09-29", 14);
  assert.equal(dates.length, 14);
  assert.equal(dates[0], "2026-09-16");
  assert.equal(dates[13], "2026-09-29");
});

test("family history omits empty days and staff history keeps them", () => {
  const dates = ["2026-09-27", "2026-09-28", "2026-09-29"];
  const days = [{ onDate: "2026-09-29", status: "partial" as const }];
  const marks = [
    { onDate: "2026-09-28", title: "Morning", status: "late" as const },
  ];
  assert.equal(
    studentAttendanceDays({ dates, days, marks, includeEmpty: false }).length,
    2,
  );
  const withEmpty = studentAttendanceDays({
    dates,
    days: [],
    marks: [],
    includeEmpty: true,
  });
  assert.equal(withEmpty.length, 3);
  assert.equal(withEmpty[0]?.onDate, "2026-09-29");
});

test("day write follows admin, class lead, and course instructor rules", () => {
  assert.equal(
    canWriteClassDay({ isOrgAdmin: false, isClassLead: true, currentMember: false }),
    false,
  );
  assert.equal(
    canWriteClassDay({ isOrgAdmin: true, isClassLead: false, currentMember: false }),
    true,
  );
  assert.equal(
    canWriteCourseDay({
      isOrgAdmin: false,
      canManageCourse: true,
      activeEnrollment: true,
    }),
    true,
  );
  assert.equal(
    canWriteStudentDay({
      isOrgAdmin: false,
      leadsCurrentClass: false,
      teachesActiveEnrollment: true,
    }),
    true,
  );
});
