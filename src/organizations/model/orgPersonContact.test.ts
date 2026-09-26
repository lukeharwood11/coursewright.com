import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canEditOrgPersonEmail,
  canEditOrgPersonName,
  isChangingLinkedOrgPersonContactEmail,
  isOrgPersonAccountLinked,
  validateOrgPersonContact,
} from "./orgPersonContact";

test("owners and admins can edit anyone’s org name and email", () => {
  assert.equal(
    canEditOrgPersonName({
      actorRole: "admin",
      isSelf: false,
      hasOrgProfile: true,
    }),
    true,
  );
  assert.equal(
    canEditOrgPersonEmail({ actorRole: "owner", hasOrgProfile: true }),
    true,
  );
});

test("staff can edit their own org name but not their email", () => {
  assert.equal(
    canEditOrgPersonName({
      actorRole: "instructor",
      isSelf: true,
      hasOrgProfile: true,
    }),
    true,
  );
  assert.equal(
    canEditOrgPersonEmail({ actorRole: "instructor", hasOrgProfile: true }),
    false,
  );
  assert.equal(
    canEditOrgPersonName({
      actorRole: "instructor",
      isSelf: false,
      hasOrgProfile: true,
    }),
    false,
  );
});

test("parents cannot edit org contact fields", () => {
  assert.equal(
    canEditOrgPersonName({
      actorRole: "parent",
      isSelf: true,
      hasOrgProfile: true,
    }),
    false,
  );
  assert.equal(
    canEditOrgPersonEmail({ actorRole: "parent", hasOrgProfile: true }),
    false,
  );
});

test("linked org person email change is detected for claimed profiles", () => {
  assert.equal(isOrgPersonAccountLinked(null), false);
  assert.equal(isOrgPersonAccountLinked("uuid"), true);
  assert.equal(
    isChangingLinkedOrgPersonContactEmail({
      accountLinked: true,
      canEditEmail: true,
      email: "new@example.com",
      savedEmail: "old@example.com",
    }),
    true,
  );
  assert.equal(
    isChangingLinkedOrgPersonContactEmail({
      accountLinked: true,
      canEditEmail: true,
      email: "Same@Example.com",
      savedEmail: "same@example.com",
    }),
    false,
  );
  assert.equal(
    isChangingLinkedOrgPersonContactEmail({
      accountLinked: false,
      canEditEmail: true,
      email: "new@example.com",
      savedEmail: "old@example.com",
    }),
    false,
  );
});

test("validateOrgPersonContact requires a name and a valid email when included", () => {
  assert.equal(validateOrgPersonContact({ name: "  ", includeEmail: false }).ok, false);
  const nameOnly = validateOrgPersonContact({
    name: " Alex ",
    includeEmail: false,
  });
  assert.deepEqual(nameOnly, { ok: true, value: { name: "Alex" } });
  const withEmail = validateOrgPersonContact({
    name: "Alex",
    email: "Alex@Example.com",
    includeEmail: true,
  });
  assert.deepEqual(withEmail, {
    ok: true,
    value: { name: "Alex", email: "alex@example.com" },
  });
  assert.equal(
    validateOrgPersonContact({
      name: "Alex",
      email: "not-an-email",
      includeEmail: true,
    }).ok,
    false,
  );
});
