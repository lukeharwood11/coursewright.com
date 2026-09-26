import assert from "node:assert/strict";
import { test } from "node:test";
import {
  availableStaffViewModes,
  canUseStaffViewToggle,
  courseVisibleToFamilies,
  familyVisibleCourses,
  familyVisibleMaterials,
  parseStaffViewMode,
  resolveStaffViewMode,
  staffBrowsesContent,
  isStaffInstructorPreview,
  staffCanEdit,
  staffShowsParentPresentation,
  staffViewModeLabel,
} from "./viewMode.ts";

test("isStaffInstructorPreview is only staff Preview mode", () => {
  assert.equal(isStaffInstructorPreview("instructor", "preview"), true);
  assert.equal(isStaffInstructorPreview("instructor", "teacher"), false);
  assert.equal(isStaffInstructorPreview("instructor", "parent"), false);
  assert.equal(isStaffInstructorPreview("parent", "preview"), false);
});

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

test("staff default to teacher; any non-teacher mode is parent presentation", () => {
  for (const role of ["owner", "admin", "instructor"] as const) {
    assert.equal(canUseStaffViewToggle(role), true);
    assert.equal(staffShowsParentPresentation(role, "teacher"), false);
    assert.equal(staffShowsParentPresentation(role, "preview"), true);
    assert.equal(staffShowsParentPresentation(role, "parent"), true);
    assert.equal(staffShowsParentPresentation(role, "student"), true);
    assert.equal(staffCanEdit(role, false), true);
    assert.equal(staffCanEdit(role, true), false);
  }
});

test("observers stay in staff chrome with no toggle and no edit", () => {
  assert.equal(canUseStaffViewToggle("observer"), false);
  assert.equal(staffShowsParentPresentation("observer", "teacher"), false);
  assert.equal(staffShowsParentPresentation("observer", "preview"), false);
  assert.equal(staffShowsParentPresentation("observer", "parent"), false);
  assert.equal(staffCanEdit("observer", false), false);
  assert.equal(staffCanEdit("observer", true), false);
  assert.equal(staffBrowsesContent("observer", false), true);
  assert.equal(staffBrowsesContent("instructor", false), true);
  assert.equal(staffBrowsesContent("instructor", true), false);
});

test("parseStaffViewMode accepts the four modes", () => {
  assert.equal(parseStaffViewMode("parent"), "parent");
  assert.equal(parseStaffViewMode("preview"), "preview");
  assert.equal(parseStaffViewMode("student"), "student");
  assert.equal(parseStaffViewMode("teacher"), "teacher");
  assert.equal(parseStaffViewMode(null), "teacher");
  assert.equal(parseStaffViewMode("nope"), "teacher");
});

test("availableStaffViewModes always includes Teacher and Preview", () => {
  assert.deepEqual(
    availableStaffViewModes({ isParent: false, isStudent: false }).map((o) => o.mode),
    ["teacher", "preview"],
  );
  assert.deepEqual(
    availableStaffViewModes({ isParent: true, isStudent: false }).map((o) => o.mode),
    ["teacher", "preview", "parent"],
  );
  assert.deepEqual(
    availableStaffViewModes({ isParent: false, isStudent: true }).map((o) => o.mode),
    ["teacher", "preview", "student"],
  );
  assert.deepEqual(
    availableStaffViewModes({ isParent: true, isStudent: true }).map((o) => o.mode),
    ["teacher", "preview", "parent", "student"],
  );
});

test("resolveStaffViewMode migrates legacy parent and drops disallowed modes", () => {
  assert.equal(
    resolveStaffViewMode("parent", { isParent: false, isStudent: false }),
    "preview",
  );
  assert.equal(
    resolveStaffViewMode("parent", { isParent: true, isStudent: false }),
    "parent",
  );
  assert.equal(
    resolveStaffViewMode("parent", { isParent: false, isStudent: true }),
    "student",
  );
  assert.equal(
    resolveStaffViewMode("student", { isParent: false, isStudent: false }),
    "teacher",
  );
  assert.equal(
    resolveStaffViewMode("preview", { isParent: false, isStudent: false }),
    "preview",
  );
});

test("staffViewModeLabel matches product labels", () => {
  assert.equal(staffViewModeLabel("teacher"), "Teacher");
  assert.equal(staffViewModeLabel("preview"), "Preview");
  assert.equal(staffViewModeLabel("parent"), "Parent");
  assert.equal(staffViewModeLabel("student"), "Student");
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
