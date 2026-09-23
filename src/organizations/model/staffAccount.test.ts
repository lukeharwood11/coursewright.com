import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PARENT_ROLE_NEEDS_STUDENT_MESSAGE,
  REMOVE_LINKED_PARENT_MESSAGE,
  STUDENT_ROLE_NEEDS_ACCOUNT_MESSAGE,
  assignableMembershipRoles,
  staffMemberActions,
  validateChangeStaffRole,
  validateRemoveStaffMember,
} from "./staffAccount";

test("assignableMembershipRoles promotes parents to staff without parent option", () => {
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "owner",
      currentRole: "parent",
      hasLinkedStudent: true,
    }),
    ["instructor", "admin", "owner"],
  );
});

test("assignableMembershipRoles offers parent only when staff has a linked student", () => {
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "admin",
      currentRole: "instructor",
      hasLinkedStudent: true,
    }),
    ["instructor", "admin", "parent"],
  );
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "admin",
      currentRole: "instructor",
      hasLinkedStudent: false,
    }),
    ["instructor", "admin"],
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
  assert.deepEqual(actions.changeRoles, ["parent", "instructor", "admin", "owner"]);
});

test("staffMemberActions blocks remove when staff still has a linked student", () => {
  const actions = staffMemberActions({
    actorRole: "admin",
    member: {
      membershipId: 2,
      role: "instructor",
      hasLinkedStudent: true,
    },
    members: [
      { membershipId: 1, role: "admin" },
      { membershipId: 2, role: "instructor" },
    ],
  });
  assert.equal(actions.canRemove, false);
  assert.ok(actions.changeRoles.includes("parent"));
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

test("validateChangeStaffRole rejects parent demotion without a linked student", () => {
  const result = validateChangeStaffRole({
    actorRole: "admin",
    currentRole: "instructor",
    nextRole: "parent",
    isLastManager: false,
    hasLinkedStudent: false,
  });
  assert.deepEqual(result, {
    ok: false,
    error: PARENT_ROLE_NEEDS_STUDENT_MESSAGE,
  });
});

test("validateChangeStaffRole rejects student demotion without a linked account", () => {
  const result = validateChangeStaffRole({
    actorRole: "admin",
    currentRole: "instructor",
    nextRole: "student",
    isLastManager: false,
    hasLinkedStudent: false,
    hasStudentAccount: false,
  });
  assert.deepEqual(result, {
    ok: false,
    error: STUDENT_ROLE_NEEDS_ACCOUNT_MESSAGE,
  });
});

test("assignableMembershipRoles offers student when the account is linked", () => {
  assert.deepEqual(
    assignableMembershipRoles({
      actorRole: "owner",
      currentRole: "instructor",
      hasLinkedStudent: false,
      hasStudentAccount: true,
    }),
    ["instructor", "admin", "owner", "student"],
  );
});

test("validateRemoveStaffMember rejects linked parents", () => {
  const result = validateRemoveStaffMember({
    actorRole: "admin",
    targetRole: "instructor",
    isLastManager: false,
    hasLinkedStudent: true,
  });
  assert.deepEqual(result, {
    ok: false,
    error: REMOVE_LINKED_PARENT_MESSAGE,
  });
});
