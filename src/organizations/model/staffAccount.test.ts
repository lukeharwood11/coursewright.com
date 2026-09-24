import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADDITIVE_ROLE_NOT_EXCLUSIVE_MESSAGE,
  STUDENTS_NOT_IN_COLLABORATORS_MESSAGE,
  assignableMembershipRoles,
  exclusiveReleaseTarget,
  isLastOrgManager,
  staffMemberActions,
  validateChangeStaffRole,
  validateRemoveStaffMember,
} from "./staffAccount";

test("assignableMembershipRoles promotes parents by adding an exclusive role", () => {
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "owner",
      currentRole: "parent",
      hasLinkedStudent: true,
    }),
    ["observer", "instructor", "admin", "owner"],
  );
});

test("assignableMembershipRoles does not replace a teacher with parent or student", () => {
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "admin",
      currentRole: "instructor",
      hasLinkedStudent: true,
      hasStudentAccount: true,
    }),
    ["observer", "instructor", "admin"],
  );
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "owner",
      currentRole: "student",
      hasLinkedStudent: false,
      hasStudentAccount: true,
    }),
    [],
  );
});

test("staffMemberActions lets owners promote parents and hides remove", () => {
  const actions = staffMemberActions({
    actorRole: "owner",
    member: {
      membershipId: 1,
      role: "parent",
      hasLinkedStudent: true,
    },
    members: [{ membershipId: 1, role: "parent" }],
  });
  assert.equal(actions.canChangeRole, true);
  assert.equal(actions.canRemove, false);
  assert.deepEqual(actions.changeRoles, ["parent", "observer", "instructor", "admin", "owner"]);
  assert.equal(actions.changeRoles.includes("student"), false);
});

test("staffMemberActions leaves students out of the collaborator controls", () => {
  const actions = staffMemberActions({
    actorRole: "owner",
    member: {
      membershipId: 4,
      role: "student",
      hasLinkedStudent: false,
      hasStudentAccount: true,
    },
    members: [
      { membershipId: 1, role: "owner" },
      { membershipId: 4, role: "student" },
    ],
  });
  assert.equal(actions.canChangeRole, false);
  assert.equal(actions.canRemove, false);
  assert.deepEqual(actions.changeRoles, []);
});

test("staffMemberActions keeps parent and student off the exclusive role menu", () => {
  const actions = staffMemberActions({
    actorRole: "admin",
    member: {
      membershipId: 2,
      role: "instructor",
      hasLinkedStudent: true,
      hasStudentAccount: true,
    },
    members: [
      { membershipId: 1, role: "admin" },
      { membershipId: 2, role: "instructor" },
    ],
  });
  assert.equal(actions.canRemove, true);
  assert.equal(actions.releaseTo, "parent");
  assert.deepEqual(actions.changeRoles, ["instructor", "observer", "admin"]);
  assert.equal(actions.changeRoles.includes("parent"), false);
  assert.equal(actions.changeRoles.includes("student"), false);
});

test("student plus admin stays in the collaborator list as an exclusive admin", () => {
  const actions = staffMemberActions({
    actorRole: "owner",
    member: {
      membershipId: 3,
      role: "admin",
      hasLinkedStudent: false,
      hasStudentAccount: true,
    },
    members: [
      { membershipId: 1, role: "owner" },
      { membershipId: 3, role: "admin" },
    ],
  });
  assert.equal(actions.canChangeRole, true);
  assert.equal(actions.canRemove, true);
  assert.equal(actions.releaseTo, "student");
  assert.deepEqual(actions.changeRoles, ["admin", "observer", "instructor", "owner"]);
  assert.equal(actions.changeRoles.includes("student"), false);
});

test("validateChangeStaffRole promotes parent to instructor", () => {
  const result = validateChangeStaffRole({
    actorRole: "owner",
    currentRole: "parent",
    nextRole: "instructor",
    isLastManager: false,
    hasLinkedStudent: true,
  });
  assert.deepEqual(result, { ok: true, value: "instructor" });
});

test("validateChangeStaffRole rejects replacing a teacher with parent", () => {
  const result = validateChangeStaffRole({
    actorRole: "admin",
    currentRole: "instructor",
    nextRole: "parent",
    isLastManager: false,
    hasLinkedStudent: true,
  });
  assert.deepEqual(result, {
    ok: false,
    error: ADDITIVE_ROLE_NOT_EXCLUSIVE_MESSAGE,
  });
});

test("validateChangeStaffRole rejects promoting a student", () => {
  const result = validateChangeStaffRole({
    actorRole: "admin",
    currentRole: "student",
    nextRole: "instructor",
    isLastManager: false,
    hasLinkedStudent: false,
    hasStudentAccount: true,
  });
  assert.deepEqual(result, {
    ok: false,
    error: STUDENTS_NOT_IN_COLLABORATORS_MESSAGE,
  });
});

test("exclusiveReleaseTarget prefers parent when both additive roles exist", () => {
  assert.equal(
    exclusiveReleaseTarget({ hasLinkedStudent: true, hasStudentAccount: true }),
    "parent",
  );
  assert.equal(
    exclusiveReleaseTarget({ hasLinkedStudent: false, hasStudentAccount: true }),
    "student",
  );
  assert.equal(
    exclusiveReleaseTarget({ hasLinkedStudent: false, hasStudentAccount: false }),
    null,
  );
});

test("an observer is not the last manager", () => {
  assert.equal(
    isLastOrgManager(
      [
        { membershipId: 1, role: "owner" },
        { membershipId: 2, role: "observer" },
      ],
      1,
    ),
    true,
  );
  assert.equal(
    isLastOrgManager(
      [
        { membershipId: 1, role: "owner" },
        { membershipId: 2, role: "observer" },
      ],
      2,
    ),
    false,
  );
});

test("owners can change and remove an observer", () => {
  const actions = staffMemberActions({
    actorRole: "owner",
    member: {
      membershipId: 2,
      role: "observer",
      hasLinkedStudent: false,
    },
    members: [
      { membershipId: 1, role: "owner" },
      { membershipId: 2, role: "observer" },
    ],
  });
  assert.equal(actions.canChangeRole, true);
  assert.equal(actions.canRemove, true);
  assert.equal(actions.lastManagerGuard, false);
  assert.deepEqual(actions.changeRoles, ["observer", "instructor", "admin", "owner"]);
});

test("validateRemoveStaffMember drops the exclusive role when a parent link remains", () => {
  const result = validateRemoveStaffMember({
    actorRole: "admin",
    targetRole: "instructor",
    isLastManager: false,
    hasLinkedStudent: true,
  });
  assert.deepEqual(result, { ok: true, releaseTo: "parent" });
});

test("validateRemoveStaffMember deletes staff who have no additive role", () => {
  const result = validateRemoveStaffMember({
    actorRole: "admin",
    targetRole: "instructor",
    isLastManager: false,
    hasLinkedStudent: false,
    hasStudentAccount: false,
  });
  assert.deepEqual(result, { ok: true, releaseTo: null });
});
