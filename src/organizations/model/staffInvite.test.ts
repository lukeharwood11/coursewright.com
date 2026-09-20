import assert from "node:assert/strict";
import { test } from "node:test";
import { inviteCreatedMessage, inviteEmailResultMessage } from "./staffInvite";

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
