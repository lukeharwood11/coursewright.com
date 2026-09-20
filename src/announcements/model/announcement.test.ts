import assert from "node:assert/strict";
import { test } from "node:test";
import {
  announcementAudienceLabel,
  announcementTargetName,
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

test("announcementTargetName uses the matching audience name", () => {
  assert.equal(
    announcementTargetName({
      audience: "course",
      courseTitle: "Biology",
      classTitle: "Room A",
      studentName: "Maya",
    }),
    "Biology",
  );
  assert.equal(
    announcementTargetName({
      audience: "class",
      courseTitle: "Biology",
      classTitle: "Wednesday cohort",
      studentName: "Maya",
    }),
    "Wednesday cohort",
  );
  assert.equal(
    announcementTargetName({
      audience: "student",
      courseTitle: null,
      classTitle: null,
      studentName: "Maya",
    }),
    "Maya",
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

test("validateAnnouncementDraft requires audience, target, and title", () => {
  assert.equal(
    validateAnnouncementDraft({
      audience: null,
      courseId: null,
      classId: null,
      studentId: null,
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
      courseId: null,
      classId: null,
      studentId: null,
      title: "Snow day",
      body: "",
      startDate: "",
      endDate: "",
    }),
    "Choose a course.",
  );
  assert.equal(
    validateAnnouncementDraft({
      audience: "course",
      courseId: 10,
      classId: null,
      studentId: null,
      title: "",
      body: "",
      startDate: "",
      endDate: "",
    }),
    "Add a title so families know what this is.",
  );
  assert.equal(
    validateAnnouncementDraft({
      audience: "course",
      courseId: 10,
      classId: null,
      studentId: null,
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
      courseId: null,
      classId: null,
      studentId: 4,
      title: "Pickup change",
      body: "Grandma at 2.",
      startDate: "",
      endDate: "",
    }),
    null,
  );
});

test("draftFromSearchParams prefills a single audience", () => {
  const course = draftFromSearchParams(
    new URLSearchParams("audience=course&courseId=12&classId=9"),
  );
  assert.deepEqual(course, {
    audience: "course",
    courseId: 12,
    classId: null,
    studentId: null,
  });
  const student = draftFromSearchParams(
    new URLSearchParams("audience=student&studentId=4"),
  );
  assert.equal(student.audience, "student");
  assert.equal(student.studentId, 4);
});
