import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALREADY_IN_ORGANIZATION_MESSAGE,
  STUDENT_NOT_A_COLLABORATOR_MESSAGE,
  inviteCreatedMessage,
  inviteEmailResultMessage,
  staffAddForExistingPerson,
  staffPrivilegeStackedMessage,
} from "./staffInvite";

test("claimed parent stacks a staff role and keeps the org name", () => {
  assert.deepEqual(
    staffAddForExistingPerson({
      hasAccount: true,
      countsAsStudent: false,
      linkedAsParent: true,
      membershipRole: "parent",
    }),
    { action: "stack-role" },
  );
});

test("unclaimed parent still gets an invite and keeps the existing name", () => {
  assert.deepEqual(
    staffAddForExistingPerson({
      hasAccount: false,
      countsAsStudent: false,
      linkedAsParent: true,
      membershipRole: null,
    }),
    { action: "create-invite", keepName: true },
  );
});

test("a student merge keeps the name and a new person can take the typed name", () => {
  assert.deepEqual(
    staffAddForExistingPerson({
      hasAccount: false,
      countsAsStudent: true,
      linkedAsParent: false,
      membershipRole: null,
    }),
    { action: "create-invite", keepName: true },
  );
  assert.deepEqual(
    staffAddForExistingPerson({
      hasAccount: false,
      countsAsStudent: false,
      linkedAsParent: false,
      membershipRole: null,
    }),
    { action: "create-invite", keepName: false },
  );
});

test("already-staff and student adds stay explicit rejections", () => {
  assert.deepEqual(
    staffAddForExistingPerson({
      hasAccount: true,
      countsAsStudent: false,
      linkedAsParent: true,
      membershipRole: "instructor",
    }),
    { action: "reject", message: ALREADY_IN_ORGANIZATION_MESSAGE },
  );
  assert.deepEqual(
    staffAddForExistingPerson({
      hasAccount: true,
      countsAsStudent: true,
      linkedAsParent: false,
      membershipRole: "student",
    }),
    { action: "reject", message: STUDENT_NOT_A_COLLABORATOR_MESSAGE },
  );
});

test("stacking a parent names the new role and that they stay a parent", () => {
  assert.equal(
    staffPrivilegeStackedMessage({
      name: "Pat Parent",
      role: "instructor",
      stayedParent: true,
      stayedStudent: false,
    }),
    "Changed Pat Parent to instructor. They stay a parent.",
  );
});

test("inviteCreatedMessage leaves sending the invite for later when the profile is just added", () => {
  assert.equal(
    inviteCreatedMessage({
      recipientEmail: "alex@example.com",
      emailSent: false,
      linkCopied: false,
      addedWithoutInviteEmail: true,
    }),
    "Added. Send an invite when you’re ready.",
  );
});

test("inviteCreatedMessage celebrates a sent email without a copied link", () => {
  assert.equal(
    inviteCreatedMessage({
      recipientEmail: "alex@example.com",
      emailSent: true,
      linkCopied: true,
    }),
    "Email invite sent!",
  );
});

test("inviteCreatedMessage notes when an org member was linked as a parent", () => {
  assert.equal(
    inviteCreatedMessage({
      recipientEmail: "alex@example.com",
      emailSent: false,
      linkCopied: false,
      linked: true,
      linkedParentName: "Alex Smith",
    }),
    "Linked Alex Smith as parent",
  );
});

test("inviteCreatedMessage notes when a student was attached to an existing invite", () => {
  assert.equal(
    inviteCreatedMessage({
      recipientEmail: "alex@example.com",
      emailSent: false,
      linkCopied: true,
      attached: true,
    }),
    "Already invited — this student was added to the existing invite.",
  );
});

test("inviteCreatedMessage falls back to copy-yourself when email fails", () => {
  assert.equal(
    inviteCreatedMessage({
      recipientEmail: "alex@example.com",
      emailSent: false,
      linkCopied: true,
    }),
    "Invite created, but the email didn’t send. Link copied — send it yourself.",
  );
});

test("inviteEmailResultMessage uses the function error when resend fails", () => {
  assert.equal(
    inviteEmailResultMessage({
      recipientEmail: "alex@example.com",
      emailSent: false,
      emailError: "Invite email isn’t set up yet. Copy the link and send it yourself.",
    }),
    "Invite email isn’t set up yet. Copy the link and send it yourself.",
  );
  assert.equal(
    inviteEmailResultMessage({
      recipientEmail: "alex@example.com",
      emailSent: true,
      emailError: null,
    }),
    "Email invite sent!",
  );
});
