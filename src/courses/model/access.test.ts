import assert from "node:assert/strict";
import { test } from "node:test";
import { staffCanManageCourse } from "./access.ts";

const teacher = {
  userId: "teacher-1",
  instructorUserIds: ["teacher-1", "co-1"],
};

test("owners and admins can edit a course in Teacher view", () => {
  assert.equal(
    staffCanManageCourse({
      role: "owner",
      parentPresentation: false,
      userId: "owner-1",
      instructorUserIds: [],
    }),
    true,
  );
  assert.equal(
    staffCanManageCourse({
      role: "admin",
      parentPresentation: false,
      userId: "admin-1",
      instructorUserIds: [],
    }),
    true,
  );
});

test("instructors can edit only courses they teach", () => {
  assert.equal(
    staffCanManageCourse({
      role: "instructor",
      parentPresentation: false,
      ...teacher,
    }),
    true,
  );
  assert.equal(
    staffCanManageCourse({
      role: "instructor",
      parentPresentation: false,
      userId: "teacher-1",
      instructorUserIds: ["someone-else"],
    }),
    false,
  );
});

test("Parent view and parent role cannot edit a course", () => {
  assert.equal(
    staffCanManageCourse({
      role: "instructor",
      parentPresentation: true,
      ...teacher,
    }),
    false,
  );
  assert.equal(
    staffCanManageCourse({
      role: "parent",
      parentPresentation: true,
      userId: "parent-1",
      instructorUserIds: ["parent-1"],
    }),
    false,
  );
});
