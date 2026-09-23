import assert from "node:assert/strict";
import { test } from "node:test";
import { showOrgSettingsFormActions } from "./role.ts";

test("owners keep Save/Cancel on Customizations", () => {
  assert.equal(showOrgSettingsFormActions("owner", "customizations"), true);
  assert.equal(showOrgSettingsFormActions("owner", "organization"), true);
  assert.equal(showOrgSettingsFormActions("owner", "branding"), true);
});

test("admins do not see Save/Cancel on Customizations", () => {
  assert.equal(showOrgSettingsFormActions("admin", "customizations"), false);
  assert.equal(showOrgSettingsFormActions("admin", "organization"), true);
  assert.equal(showOrgSettingsFormActions("admin", "profile"), true);
  assert.equal(showOrgSettingsFormActions("admin", "branding"), true);
  assert.equal(showOrgSettingsFormActions("admin", "collaborators"), true);
});

test("instructors never see org settings Save/Cancel", () => {
  assert.equal(showOrgSettingsFormActions("instructor", "customizations"), false);
  assert.equal(showOrgSettingsFormActions("instructor", "organization"), false);
});
