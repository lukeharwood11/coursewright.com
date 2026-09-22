import assert from "node:assert/strict";
import { test } from "node:test";
import { staffMatchesQuery, validateClass } from "./classGroup.ts";

test("validateClass requires a name", () => {
  assert.deepEqual(validateClass({ title: "  All School  " }), {
    ok: true,
    value: { title: "All School" },
  });
  assert.deepEqual(validateClass({ title: "   " }), {
    ok: false,
    error: "Name is required.",
  });
});

test("staffMatchesQuery matches names case-insensitively", () => {
  const person = { name: "Luke Harwood" };
  assert.equal(staffMatchesQuery(person, ""), true);
  assert.equal(staffMatchesQuery(person, "  luke  "), true);
  assert.equal(staffMatchesQuery(person, "WOOD"), true);
  assert.equal(staffMatchesQuery(person, "Maya"), false);
});
