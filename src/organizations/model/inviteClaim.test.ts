import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inviteLoginHref,
  inviteSignupHref,
  mismatchedInvitePrompt,
  unsignedInvitePrompt,
} from "./inviteClaim";

test("invite auth hrefs send people to signup/login with the invited address", () => {
  assert.equal(
    inviteSignupHref("abc", "Pat@Family.com"),
    "/signup?next=%2Finvite%2Fabc&email=pat%40family.com",
  );
  assert.equal(
    inviteLoginHref("abc", "pat@family.com"),
    "/login?next=%2Finvite%2Fabc&email=pat%40family.com",
  );
});

test("unsignedInvitePrompt names the invited address", () => {
  assert.equal(
    unsignedInvitePrompt("pat@family.com"),
    "This invite is for pat@family.com. Create an account with that address — or sign in if you already have one.",
  );
});

test("mismatchedInvitePrompt names both addresses", () => {
  assert.equal(
    mismatchedInvitePrompt({
      invitedEmail: "pat@family.com",
      signedInEmail: "other@example.com",
    }),
    "You’re signed in as other@example.com. This invite is for pat@family.com. Sign out, then use that address.",
  );
});
