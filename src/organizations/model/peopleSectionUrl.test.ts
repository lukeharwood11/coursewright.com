import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parsePeopleSectionSubview,
  peopleSectionSubviewSearchValue,
} from "./peopleSectionUrl";

test("parsePeopleSectionSubview respects access in URL when allowed", () => {
  assert.equal(
    parsePeopleSectionSubview("access", {
      canManagePeople: true,
      canSeeCollaborators: true,
    }),
    "access",
  );
  assert.equal(
    parsePeopleSectionSubview("access", {
      canManagePeople: false,
      canSeeCollaborators: true,
    }),
    "collaborators",
  );
});

test("parsePeopleSectionSubview falls back when collaborators are hidden", () => {
  assert.equal(
    parsePeopleSectionSubview(null, {
      canManagePeople: true,
      canSeeCollaborators: false,
    }),
    "access",
  );
});

test("peopleSectionSubviewSearchValue only serializes access", () => {
  assert.equal(peopleSectionSubviewSearchValue("access"), "access");
  assert.equal(peopleSectionSubviewSearchValue("collaborators"), null);
});
