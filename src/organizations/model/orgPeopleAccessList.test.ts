import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterOrgPeopleAccess,
  orgPeopleAccessMatchesQuery,
  orgPeopleAccessMatchesRoleFilter,
  orgPeopleAccessPageCount,
  paginateOrgPeopleAccess,
} from "./orgPeopleAccessList";

const sample = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "instructor" as const,
  isParent: true,
  isStudent: false,
  status: "active" as const,
};

test("orgPeopleAccessMatchesQuery matches name and email", () => {
  assert.equal(orgPeopleAccessMatchesQuery(sample, "ada"), true);
  assert.equal(orgPeopleAccessMatchesQuery(sample, "example.com"), true);
  assert.equal(orgPeopleAccessMatchesQuery(sample, "zzz"), false);
});

test("orgPeopleAccessMatchesQuery matches role labels and flags", () => {
  assert.equal(orgPeopleAccessMatchesQuery(sample, "instructor"), true);
  assert.equal(orgPeopleAccessMatchesQuery(sample, "parent"), true);
  assert.equal(
    orgPeopleAccessMatchesQuery(
      { ...sample, status: "suspended" },
      "suspended",
    ),
    true,
  );
});

test("orgPeopleAccessMatchesRoleFilter includes additive parent and student", () => {
  assert.equal(orgPeopleAccessMatchesRoleFilter(sample, "instructor"), true);
  assert.equal(orgPeopleAccessMatchesRoleFilter(sample, "parent"), true);
  assert.equal(orgPeopleAccessMatchesRoleFilter(sample, "student"), false);
  assert.equal(
    orgPeopleAccessMatchesRoleFilter(
      { ...sample, isParent: false, role: "admin" },
      "parent",
    ),
    false,
  );
});

test("filterOrgPeopleAccess and pagination slice members", () => {
  const members = [
    { ...sample, name: "A" },
    { ...sample, name: "B", email: "b@x.com" },
    { ...sample, name: "C", email: "c@x.com" },
  ];
  const filtered = filterOrgPeopleAccess(members, { query: "b@", role: "" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.name, "B");

  const many = Array.from({ length: 25 }, (_, i) => ({
    ...sample,
    name: `Person ${i}`,
  }));
  assert.equal(orgPeopleAccessPageCount(many.length, 20), 2);
  assert.equal(paginateOrgPeopleAccess(many, 2, 20).length, 5);
});
