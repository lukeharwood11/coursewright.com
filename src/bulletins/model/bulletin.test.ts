import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bulletinAvailability,
  isBulletinAvailable,
} from "./availability.ts";
import { groupCourseBulletins, groupMaterialsForPicker } from "./grouping.ts";
import {
  defaultBulletinTitle,
  toggleMaterialId,
  validateBulletinDraft,
} from "./validate.ts";

test("defaultBulletinTitle uses the course name", () => {
  assert.equal(defaultBulletinTitle("Biology"), "This week in Biology");
  assert.equal(defaultBulletinTitle("  Algebra I  "), "This week in Algebra I");
  assert.equal(defaultBulletinTitle(""), "This week");
  assert.equal(defaultBulletinTitle("   "), "This week");
});

test("isBulletinAvailable is inclusive of start and end dates", () => {
  assert.equal(isBulletinAvailable("2026-09-13", "2026-09-13", "2026-09-19"), true);
  assert.equal(isBulletinAvailable("2026-09-19", "2026-09-13", "2026-09-19"), true);
  assert.equal(isBulletinAvailable("2026-09-12", "2026-09-13", "2026-09-19"), false);
  assert.equal(isBulletinAvailable("2026-09-20", "2026-09-13", "2026-09-19"), false);
});

test("bulletinAvailability labels upcoming, available, and ended", () => {
  assert.equal(bulletinAvailability("2026-09-10", "2026-09-13", "2026-09-19"), "upcoming");
  assert.equal(bulletinAvailability("2026-09-15", "2026-09-13", "2026-09-19"), "available");
  assert.equal(bulletinAvailability("2026-09-22", "2026-09-13", "2026-09-19"), "ended");
});

test("validateBulletinDraft requires title and a valid date window", () => {
  assert.equal(
    validateBulletinDraft({
      title: "",
      body: "",
      startDate: "2026-09-13",
      endDate: "2026-09-19",
      materialIds: [],
    }),
    "Add a title so families know what this is.",
  );
  assert.equal(
    validateBulletinDraft({
      title: "Week 3",
      body: "",
      startDate: "2026-09-19",
      endDate: "2026-09-13",
      materialIds: [],
    }),
    "The end date needs to be on or after the start date.",
  );
  assert.equal(
    validateBulletinDraft({
      title: "Week 3",
      body: "Lab notes",
      startDate: "2026-09-13",
      endDate: "2026-09-19",
      materialIds: [1, 2],
    }),
    null,
  );
});

test("toggleMaterialId adds and removes without duplicates", () => {
  assert.deepEqual(toggleMaterialId([1, 3], 2), [1, 3, 2]);
  assert.deepEqual(toggleMaterialId([1, 3], 3), [1]);
});

test("groupMaterialsForPicker puts top-level materials first, then units", () => {
  const groups = groupMaterialsForPicker(
    [
      { id: 1, title: "Syllabus", unitId: null, visibility: "published" },
      { id: 2, title: "Lab", unitId: 8, visibility: "published" },
      { id: 3, title: "Warm-up", unitId: 8, visibility: "unpublished" },
    ],
    [{ id: 8, title: "Unit 1" }],
  );
  assert.equal(groups.length, 2);
  assert.equal(groups[0].unitId, null);
  assert.deepEqual(
    groups[0].materials.map((row) => row.id),
    [1],
  );
  assert.equal(groups[1].unitTitle, "Unit 1");
  assert.deepEqual(
    groups[1].materials.map((row) => row.id),
    [2, 3],
  );
});

test("groupCourseBulletins splits by the date window", () => {
  const groups = groupCourseBulletins(
    [
      { startDate: "2026-09-07", endDate: "2026-09-12" },
      { startDate: "2026-09-13", endDate: "2026-09-19" },
      { startDate: "2026-09-20", endDate: "2026-09-26" },
    ],
    "2026-09-15",
  );
  assert.equal(groups.ended.length, 1);
  assert.equal(groups.available.length, 1);
  assert.equal(groups.upcoming.length, 1);
});
