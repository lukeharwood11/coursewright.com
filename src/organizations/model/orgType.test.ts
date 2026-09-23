import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  orgTypeAboutPlaceholder,
  orgTypeYourNoun,
  parseOrgType,
  parseOrgTypeOrDefault,
} from "./orgType";

describe("orgType", () => {
  it("parses other", () => {
    assert.equal(parseOrgType("other"), "other");
  });

  it("defaults unknown types to other", () => {
    assert.equal(parseOrgTypeOrDefault("legacy"), "other");
    assert.equal(parseOrgTypeOrDefault(null), "other");
  });

  it("orgTypeYourNoun matches product copy", () => {
    assert.equal(orgTypeYourNoun("other"), "organization");
    assert.equal(orgTypeYourNoun("coop"), "co-op");
    assert.equal(orgTypeYourNoun("micro_school"), "school");
    assert.equal(orgTypeYourNoun("family"), "family");
  });

  it("orgTypeAboutPlaceholder reflects type", () => {
    assert.match(orgTypeAboutPlaceholder("other"), /organization/);
    assert.match(orgTypeAboutPlaceholder("coop"), /co-op/);
    assert.match(orgTypeAboutPlaceholder("micro_school"), /school/);
    assert.match(orgTypeAboutPlaceholder("family"), /family/);
  });
});
