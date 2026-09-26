import assert from "node:assert/strict";
import { test } from "node:test";
import { formatSignUpFullName, validateSignUpName } from "./signUpName";

test("formatSignUpFullName joins trimmed parts", () => {
  assert.equal(formatSignUpFullName("  Pat ", " Lee "), "Pat Lee");
});

test("validateSignUpName accepts non-empty first and last names", () => {
  assert.deepEqual(validateSignUpName({ firstName: "Pat", lastName: "Lee" }), {
    ok: true,
    value: { firstName: "Pat", lastName: "Lee", fullName: "Pat Lee" },
  });
});

test("validateSignUpName rejects missing first name", () => {
  assert.deepEqual(validateSignUpName({ firstName: "  ", lastName: "Lee" }), {
    ok: false,
    error: "First name is required.",
  });
});

test("validateSignUpName rejects missing last name", () => {
  assert.deepEqual(validateSignUpName({ firstName: "Pat", lastName: "" }), {
    ok: false,
    error: "Last name is required.",
  });
});
