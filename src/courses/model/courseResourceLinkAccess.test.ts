import assert from "node:assert/strict";
import test from "node:test";
import { courseResourceLinkFamilyAccessWarning } from "./courseResourceLinkAccess";

const audience = (parentsCanView: boolean, studentsCanView: boolean) => ({
  parentsCanView,
  studentsCanView,
});

test("resource access line uses the previous sentences", () => {
  assert.equal(
    courseResourceLinkFamilyAccessWarning({
      kind: "item",
      visibility: "published",
      audience: audience(true, true),
      unresolved: false,
    }),
    null,
  );
  assert.equal(
    courseResourceLinkFamilyAccessWarning({
      kind: "item",
      visibility: "published",
      audience: audience(false, false),
      unresolved: false,
    }),
    "Not shared with parents or students in Resources.",
  );
  assert.equal(
    courseResourceLinkFamilyAccessWarning({
      kind: "folder",
      visibility: null,
      audience: audience(false, true),
      unresolved: false,
    }),
    "Not shared with parents in Resources.",
  );
  assert.equal(
    courseResourceLinkFamilyAccessWarning({
      kind: "item",
      visibility: "published",
      audience: audience(true, false),
      unresolved: false,
    }),
    "Not shared with students in Resources.",
  );
  assert.equal(
    courseResourceLinkFamilyAccessWarning({
      kind: "item",
      visibility: "unpublished",
      audience: audience(true, true),
      unresolved: false,
    }),
    "Unpublished — families can’t open this resource.",
  );
  assert.equal(
    courseResourceLinkFamilyAccessWarning({
      kind: "item",
      visibility: "published",
      audience: audience(true, true),
      unresolved: true,
    }),
    "Access settings could not be verified.",
  );
});
