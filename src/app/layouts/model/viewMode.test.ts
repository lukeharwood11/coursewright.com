import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canUseStaffViewToggle,
  courseVisibleToFamilies,
  familyVisibleCourses,
  familyVisibleMaterials,
  parseStaffViewMode,
  staffCanEdit,
  staffShowsParentPresentation,
} from "./viewMode.ts";

test("student-role users always see parent presentation and no toggle", () => {
  assert.equal(staffShowsParentPresentation("student", "teacher"), true);
  assert.equal(canUseStaffViewToggle("student"), false);
  assert.equal(staffCanEdit("student", true), false);
});

test("parent-only users always see parent presentation and no toggle", () => {
  assert.equal(staffShowsParentPresentation("parent", "teacher"), true);
  assert.equal(staffShowsParentPresentation("parent", "parent"), true);
  assert.equal(canUseStaffViewToggle("parent"), false);
  assert.equal(staffCanEdit("parent", true), false);
});

test("staff default to teacher presentation until Student view is on", () => {
  for (const role of ["owner", "admin", "instructor"] as const) {
    assert.equal(canUseStaffViewToggle(role), true);
    assert.equal(staffShowsParentPresentation(role, "teacher"), false);
    assert.equal(staffShowsParentPresentation(role, "parent"), true);
    assert.equal(staffCanEdit(role, false), true);
    assert.equal(staffCanEdit(role, true), false);
  }
});

test("parseStaffViewMode only treats parent as parent view", () => {
  assert.equal(parseStaffViewMode("parent"), "parent");
  assert.equal(parseStaffViewMode("teacher"), "teacher");
  assert.equal(parseStaffViewMode(null), "teacher");
  assert.equal(parseStaffViewMode("nope"), "teacher");
});

test("family-visible courses are active and published", () => {
  const courses = [
    { id: 1, status: "active", visibility: "published" },
    { id: 2, status: "active", visibility: "unpublished" },
    { id: 3, status: "archived", visibility: "published" },
  ];
  assert.deepEqual(familyVisibleCourses(courses).map((row) => row.id), [1]);
  assert.equal(courseVisibleToFamilies(courses[0]), true);
  assert.equal(courseVisibleToFamilies(courses[1]), false);
});

test("family-visible materials are published", () => {
  const materials = [
    { id: 1, visibility: "published" },
    { id: 2, visibility: "unpublished" },
  ];
  assert.deepEqual(familyVisibleMaterials(materials).map((row) => row.id), [1]);
});
