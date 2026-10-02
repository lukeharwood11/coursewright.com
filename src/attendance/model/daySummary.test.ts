import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attendanceWindow,
  canWriteClassDay,
  canWriteCourseDay,
  canWriteStudentDay,
  classAttendanceHelp,
  courseAttendanceHelp,
  dayBadge,
  mergeAttendanceGrid,
  partialReasonCopy,
  studentAttendanceDays,
  summarizeDay,
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

test("an open expected sheet beside a mark is Partial", () => {
  const summary = summarizeDay({
    dayStatus: null,
    sheets: [
      { status: "present", countsWhenBlank: true },
      { status: null, countsWhenBlank: true },
    ],
  });
  assert.equal(summary.badge, "partial");
  assert.equal(summary.dayMark, false);
  assert.equal(summary.partialReason, "incomplete");
  assert.equal(partialReasonCopy("incomplete"), "Some sheets for this day are still open.");
});

test("a day mark is labeled over mixed or incomplete sheets", () => {
  const summary = summarizeDay({
    dayStatus: "present",
    sheets: [
      { status: "absent", countsWhenBlank: true },
      { status: null, countsWhenBlank: true },
    ],
  });
  assert.equal(summary.badge, "present");
  assert.equal(summary.dayMark, true);
  assert.equal(summary.partialReason, null);
});

test("disagreeing recorded sheets are Partial", () => {
  const summary = summarizeDay({
    dayStatus: null,
    sheets: [
      { status: "present", countsWhenBlank: false },
      { status: "excused", countsWhenBlank: false },
    ],
  });
  assert.equal(summary.partialReason, "disagree");
  assert.equal(partialReasonCopy("disagree"), "Sheets don’t agree.");
});

test("observer class copy has no writer instructions", () => {
  assert.match(classAttendanceHelp({ canWrite: false, scope: "day" }), /can’t change/);
  assert.doesNotMatch(
    classAttendanceHelp({ canWrite: false, scope: "day" }),
    /Clear/,
  );
  assert.match(courseAttendanceHelp(false), /can’t change/);
  assert.match(classAttendanceHelp({ canWrite: true, scope: "day" }), /Clear/);
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

test("attendance window is 14 local dates ending on the chosen day", () => {
  const dates = attendanceWindow("2026-09-29", 14);
  assert.equal(dates.length, 14);
  assert.equal(dates[0], "2026-09-16");
  assert.equal(dates[13], "2026-09-29");
});

test("family history omits empty days and a pinned day stays", () => {
  const dates = ["2026-09-27", "2026-09-28", "2026-09-29"];
  const days = [{ onDate: "2026-09-29", status: "partial" as const }];
  const marks = [
    { onDate: "2026-09-28", title: "Morning", status: "late" as const },
  ];
  assert.equal(
    studentAttendanceDays({ dates, days, marks, includeEmpty: false }).length,
    2,
  );
  const pinned = studentAttendanceDays({
    dates,
    days: [],
    marks: [],
    includeEmpty: false,
    pinDates: ["2026-09-29"],
  });
  assert.equal(pinned.length, 1);
  assert.equal(pinned[0]?.onDate, "2026-09-29");
  assert.equal(pinned[0]?.badge, null);
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
