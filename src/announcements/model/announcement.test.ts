import assert from "node:assert/strict";
import { test } from "node:test";
import {
  announcementAudienceLabel,
  announcementTargetList,
  announcementTargetName,
  announcementTargetNames,
  announcementTargetSummary,
  parseAnnouncementAudience,
} from "./audience.ts";
import {
  announcementAvailability,
  groupAnnouncementsByAvailability,
  isAnnouncementAvailable,
} from "./availability.ts";
import {
  draftFromSearchParams,
  validateAnnouncementDraft,
  announcementDraftHasTitleAndTargets,
} from "./validate.ts";

test("parseAnnouncementAudience accepts course, class, and student", () => {
  assert.equal(parseAnnouncementAudience("course"), "course");
  assert.equal(parseAnnouncementAudience("class"), "class");
  assert.equal(parseAnnouncementAudience("student"), "student");
  assert.equal(parseAnnouncementAudience("org"), null);
});

test("announcementAudienceLabel is sentence-case product words", () => {
  assert.equal(announcementAudienceLabel("course"), "Course");
  assert.equal(announcementAudienceLabel("class"), "Class");
  assert.equal(announcementAudienceLabel("student"), "Student");
});

test("announcementTargetName joins matching audience names", () => {
  assert.equal(
    announcementTargetName({
      audience: "course",
      courseTitles: ["Biology"],
      classTitles: ["Room A"],
      studentNames: ["Maya"],
    }),
    "Biology",
  );
  assert.equal(
    announcementTargetName({
      audience: "class",
      courseTitles: ["Biology"],
      classTitles: ["Wednesday cohort", "Thursday cohort"],
      studentNames: ["Maya"],
    }),
    "Wednesday cohort and Thursday cohort",
  );
  assert.equal(
    announcementTargetName({
      audience: "student",
      courseTitles: [],
      classTitles: [],
      studentNames: ["Maya", "Eli", "Sam"],
    }),
    "Maya, Eli, and Sam",
  );
});

test("announcementTargetNames picks the matching audience list", () => {
  assert.deepEqual(
    announcementTargetNames({
      audience: "class",
      courseTitles: ["Biology"],
      classTitles: ["Grade 5", "Grade 6"],
      studentNames: ["Maya"],
    }),
    ["Grade 5", "Grade 6"],
  );
});

test("announcementTargetSummary truncates after two names", () => {
  assert.equal(announcementTargetSummary(["Grade 5"]), "Grade 5");
  assert.equal(
    announcementTargetSummary(["Grade 5", "Grade 6"]),
    "Grade 5 and Grade 6",
  );
  assert.equal(
    announcementTargetSummary(["Grade 5", "Grade 6", "Grade 7", "Grade 8"]),
    "Grade 5, Grade 6 and 2 others",
  );
  assert.equal(
    announcementTargetSummary(["Maya", "Eli", "Sam"]),
    "Maya, Eli and 1 other",
  );
  assert.equal(announcementTargetSummary([]), "Audience");
});

test("announcementTargetList is the full joined list", () => {
  assert.equal(
    announcementTargetList(["Grade 5", "Grade 6", "Grade 7"]),
    "Grade 5, Grade 6, and Grade 7",
  );
});

test("undated announcements are available", () => {
  assert.equal(isAnnouncementAvailable("2026-09-15", null, null), true);
  assert.equal(announcementAvailability("2026-09-15", null, null), "available");
});

test("start-only announcements are upcoming before the start date", () => {
  assert.equal(announcementAvailability("2026-09-10", "2026-09-13", null), "upcoming");
  assert.equal(isAnnouncementAvailable("2026-09-13", "2026-09-13", null), true);
});

test("end-only announcements end after the end date", () => {
  assert.equal(isAnnouncementAvailable("2026-09-19", null, "2026-09-19"), true);
  assert.equal(announcementAvailability("2026-09-20", null, "2026-09-19"), "ended");
});

test("both dates are inclusive", () => {
  assert.equal(isAnnouncementAvailable("2026-09-13", "2026-09-13", "2026-09-19"), true);
  assert.equal(isAnnouncementAvailable("2026-09-19", "2026-09-13", "2026-09-19"), true);
  assert.equal(isAnnouncementAvailable("2026-09-12", "2026-09-13", "2026-09-19"), false);
  assert.equal(isAnnouncementAvailable("2026-09-20", "2026-09-13", "2026-09-19"), false);
});

test("groupAnnouncementsByAvailability buckets by status", () => {
  const groups = groupAnnouncementsByAvailability(
    [
      { id: 1, startDate: null, endDate: null },
      { id: 2, startDate: "2026-09-20", endDate: null },
      { id: 3, startDate: null, endDate: "2026-09-10" },
    ],
    "2026-09-15",
  );
  assert.deepEqual(
    groups.available.map((row) => row.id),
    [1],
  );
  assert.deepEqual(
    groups.upcoming.map((row) => row.id),
    [2],
  );
  assert.deepEqual(
    groups.ended.map((row) => row.id),
    [3],
  );
});

test("validateAnnouncementDraft requires audience, targets, and title", () => {
  assert.equal(
    validateAnnouncementDraft({
      audience: null,
      courseIds: [],
      classIds: [],
      studentIds: [],
      title: "Snow day",
      body: "",
      startDate: "",
      endDate: "",
    }),
    "Choose who this announcement is for.",
  );
  assert.equal(
    validateAnnouncementDraft({
      audience: "course",
      courseIds: [],
      classIds: [],
      studentIds: [],
      title: "Snow day",
      body: "",
      startDate: "",
      endDate: "",
    }),
    "Choose at least one course.",
  );
  assert.equal(
    validateAnnouncementDraft({
      audience: "course",
      courseIds: [10],
      classIds: [],
      studentIds: [],
      title: "",
      body: "",
      startDate: "",
      endDate: "",
    }),
    "Add a title so students know what this is.",
  );
  assert.equal(
    validateAnnouncementDraft({
      audience: "course",
      courseIds: [10, 11],
      classIds: [],
      studentIds: [],
      title: "Snow day",
      body: "",
      startDate: "2026-09-19",
      endDate: "2026-09-13",
    }),
    "The end date needs to be on or after the start date.",
  );
  assert.equal(
    validateAnnouncementDraft({
      audience: "student",
      courseIds: [],
      classIds: [],
      studentIds: [4, 5],
      title: "Pickup change",
      body: "Grandma at 2.",
      startDate: "",
      endDate: "",
    }),
    null,
  );
});

test("announcementDraftHasTitleAndTargets needs a title and at least one target", () => {
  assert.equal(
    announcementDraftHasTitleAndTargets({
      audience: "course",
      courseIds: [10],
      classIds: [],
      studentIds: [],
      title: "",
      body: "",
      startDate: "",
      endDate: "",
    }),
    false,
  );
  assert.equal(
    announcementDraftHasTitleAndTargets({
      audience: "course",
      courseIds: [],
      classIds: [],
      studentIds: [],
      title: "Snow day",
      body: "",
      startDate: "",
      endDate: "",
    }),
    false,
  );
  assert.equal(
    announcementDraftHasTitleAndTargets({
      audience: "course",
      courseIds: [10],
      classIds: [],
      studentIds: [],
      title: "Snow day",
      body: "",
      startDate: "",
      endDate: "",
    }),
    true,
  );
});

test("draftFromSearchParams prefills a single audience target", () => {
  const course = draftFromSearchParams(
    new URLSearchParams("audience=course&courseId=12&classId=9"),
  );
  assert.deepEqual(course, {
    audience: "course",
    courseIds: [12],
    classIds: [],
    studentIds: [],
  });
  const student = draftFromSearchParams(
    new URLSearchParams("audience=student&studentId=4"),
  );
  assert.equal(student.audience, "student");
  assert.deepEqual(student.studentIds, [4]);
});
