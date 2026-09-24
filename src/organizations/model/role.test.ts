import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canManageBranding,
  canManageCustomizations,
  canManageOrgSettings,
} from "./role.ts";

test("owners and admins can edit organization settings", () => {
  assert.equal(canManageOrgSettings("owner"), true);
  assert.equal(canManageOrgSettings("admin"), true);
  assert.equal(canManageOrgSettings("instructor"), false);
});

test("branding and customizations are owner-only", () => {
  assert.equal(canManageBranding("owner"), true);
  assert.equal(canManageBranding("admin"), false);
  assert.equal(canManageCustomizations("owner"), true);
  assert.equal(canManageCustomizations("admin"), false);
});
