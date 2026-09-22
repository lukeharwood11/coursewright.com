import assert from "node:assert/strict";
import { test } from "node:test";
import {
  orgHasProfile,
  parseContactEmail,
  parseOrgProfile,
  parseWebsite,
  websiteDisplay,
} from "./orgProfile.ts";

test("parseWebsite adds https and rejects bad schemes", () => {
  assert.deepEqual(parseWebsite(""), { ok: true, value: null });
  const parsed = parseWebsite("example.com");
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value, "https://example.com/");
  assert.equal(parseWebsite("ftp://example.com").ok, false);
  assert.equal(parseWebsite("not a url ://").ok, false);
});

test("parseContactEmail lowercases and rejects junk", () => {
  assert.deepEqual(parseContactEmail("  Hi@School.ORG "), {
    ok: true,
    value: "hi@school.org",
  });
  assert.equal(parseContactEmail("nope").ok, false);
  assert.deepEqual(parseContactEmail("  "), { ok: true, value: null });
});

test("parseOrgProfile trims empties and caps about", () => {
  const parsed = parseOrgProfile({
    about: "  A co-op.  ",
    address: "",
    website: "https://co-op.example",
    contactEmail: "",
    phone: "555-0100",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.about, "A co-op.");
    assert.equal(parsed.value.address, null);
    assert.equal(parsed.value.website, "https://co-op.example/");
    assert.equal(parsed.value.phone, "555-0100");
    assert.equal(orgHasProfile(parsed.value), true);
  }
});

test("websiteDisplay strips scheme", () => {
  assert.equal(websiteDisplay("https://example.com/"), "example.com");
});
