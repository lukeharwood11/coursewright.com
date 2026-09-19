import assert from "node:assert/strict";
import { test } from "node:test";
import { inviteCreatedMessage, inviteEmailResultMessage } from "./staffInvite";

test("inviteCreatedMessage prefers emailed + copied when both succeed", () => {
  assert.equal(
    inviteCreatedMessage({
      recipientEmail: "alex@example.com",
      emailSent: true,
      linkCopied: true,
    }),
    "Invite emailed to alex@example.com. Link copied if they need it.",
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
    "Invite emailed to alex@example.com.",
  );
});
