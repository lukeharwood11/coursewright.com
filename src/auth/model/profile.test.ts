import assert from "node:assert/strict";
import { test } from "node:test";
import {
  profileHaveChanges,
  profileWriteErrorMessage,
  validateProfile,
} from "./profile";

test("validateProfile requires a non-empty display name", () => {
  assert.deepEqual(validateProfile({ name: "  " }), {
    ok: false,
    error: "Name is required.",
  });
});

test("validateProfile trims the display name", () => {
  assert.deepEqual(validateProfile({ name: "  Jane Doe  " }), {
    ok: true,
    value: { name: "Jane Doe" },
  });
});

test("profileHaveChanges ignores trailing spaces", () => {
  assert.equal(profileHaveChanges({ name: "Jane " }, "Jane"), false);
  assert.equal(profileHaveChanges({ name: "Jane D" }, "Jane"), true);
});

test("profileWriteErrorMessage maps RLS and auth-owned email errors", () => {
  assert.equal(
    profileWriteErrorMessage({ code: "42501", message: "permission denied" }),
    "You don’t have permission to change this account.",
  );
  assert.equal(
    profileWriteErrorMessage({
      message: "profiles.email is managed by auth",
    }),
    "Email is managed with your sign-in. You can change your name here.",
  );
});
