import assert from "node:assert/strict";
import { test } from "node:test";
import {
  browsesAsStaff,
  canInviteParent,
  canInviteStaff,
  canManageBilling,
  canManageBranding,
  canManageCustomizations,
  canManageOrgSettings,
  inviteableStaffRoles,
  isStaffRole,
  OBSERVER_VIEW_ONLY_LABEL,
  parseEditableStaffRole,
  roleLabel,
} from "./role.ts";

test("owners and admins can edit organization settings", () => {
  assert.equal(canManageOrgSettings("owner"), true);
  assert.equal(canManageOrgSettings("admin"), true);
  assert.equal(canManageOrgSettings("instructor"), false);
});

test("observer browses as staff and cannot write, invite, or manage billing", () => {
  assert.equal(isStaffRole("observer"), false);
  assert.equal(browsesAsStaff("observer"), true);
  assert.equal(browsesAsStaff("instructor"), true);
  assert.equal(canInviteStaff("observer"), false);
  assert.equal(canInviteParent("observer"), false);
  assert.equal(canManageBilling("observer"), false);
  assert.equal(canManageOrgSettings("observer"), false);
  assert.equal(canManageBranding("observer"), false);
  assert.equal(roleLabel("observer"), "Observer");
  assert.equal(OBSERVER_VIEW_ONLY_LABEL, "Observer · View only");
  assert.equal(parseEditableStaffRole("observer"), "observer");
  assert.deepEqual(inviteableStaffRoles("owner"), [
    "observer",
    "instructor",
    "admin",
    "owner",
  ]);
  assert.deepEqual(inviteableStaffRoles("admin"), ["observer", "instructor", "admin"]);
  assert.deepEqual(inviteableStaffRoles("instructor"), []);
  assert.deepEqual(inviteableStaffRoles("observer"), []);
});

test("branding and customizations are owner-only", () => {
  assert.equal(canManageBranding("owner"), true);
  assert.equal(canManageBranding("admin"), false);
  assert.equal(canManageCustomizations("owner"), true);
  assert.equal(canManageCustomizations("admin"), false);
});
