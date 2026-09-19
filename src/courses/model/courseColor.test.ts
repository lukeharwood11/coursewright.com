import assert from "node:assert/strict";
import { test } from "node:test";
import { autoCourseColorKey, parseCourseColorKey } from "./courseColor.ts";

test("autoCourseColorKey cycles the palette from a numeric seed", () => {
  assert.equal(autoCourseColorKey(0), "moss");
  assert.equal(autoCourseColorKey(1), "slate");
  assert.equal(autoCourseColorKey(8), "moss");
});

test("parseCourseColorKey falls back to moss", () => {
  assert.equal(parseCourseColorKey("plum"), "plum");
  assert.equal(parseCourseColorKey("nope"), "moss");
});
