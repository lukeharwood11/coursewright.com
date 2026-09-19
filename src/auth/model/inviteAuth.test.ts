import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inviteAuthCalloutAction,
  inviteAuthFromSearch,
  inviteAuthGoogleHint,
  inviteAuthPath,
  inviteAuthSubcopy,
  invitedEmailFromSearch,
  isInviteNextPath,
} from "./inviteAuth";

test("invitedEmailFromSearch accepts a valid address and ignores junk", () => {
  assert.equal(
    invitedEmailFromSearch("?next=/invite/abc&email=Pat%40Family.COM"),
    "pat@family.com",
  );
  assert.equal(invitedEmailFromSearch("?email=not-an-email"), null);
  assert.equal(invitedEmailFromSearch("?next=/invite/abc"), null);
});

test("isInviteNextPath only matches invite destinations", () => {
  assert.equal(isInviteNextPath("/invite/token"), true);
  assert.equal(isInviteNextPath("/my"), false);
  assert.equal(isInviteNextPath("https://evil.example/invite/x"), false);
});

test("inviteAuthPath carries next and the invited email", () => {
  assert.equal(
    inviteAuthPath("/signup", {
      nextPath: "/invite/abc",
      email: "Pat@Family.com",
    }),
    "/signup?next=%2Finvite%2Fabc&email=pat%40family.com",
  );
});

test("inviteAuthSubcopy points people at the invited address", () => {
  const named = inviteAuthFromSearch("?next=/invite/abc&email=pat@family.com");
  assert.equal(
    inviteAuthSubcopy("signup", named),
    "Create an account with the address this invite was sent to.",
  );
  assert.equal(
    inviteAuthSubcopy("login", named),
    "Sign in with the address this invite was sent to.",
  );
  assert.equal(
    inviteAuthCalloutAction("signup"),
    "Create your account with that address.",
  );
  assert.equal(
    inviteAuthGoogleHint(named),
    "If you use Google, pick the account for pat@family.com.",
  );
});

test("inviteAuthSubcopy stays generic when only next is an invite", () => {
  const fromInvite = inviteAuthFromSearch("?next=/invite/abc");
  assert.equal(fromInvite.fromInvite, true);
  assert.equal(fromInvite.invitedEmail, null);
  assert.equal(
    inviteAuthSubcopy("signup", fromInvite),
    "Create an account with the email you were invited with.",
  );
});
