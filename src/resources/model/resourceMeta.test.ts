import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceCreatedLabel,
  resourceUpdatedLabel,
  resourceWasUpdated,
} from "./resourceMeta.ts";

test("a folder that was only created is not treated as updated", () => {
  const createdAt = "2026-09-21T15:00:00.000Z";
  assert.equal(resourceWasUpdated(createdAt, "2026-09-21T15:00:00.400Z"), false);
  assert.match(resourceCreatedLabel(createdAt), /^Created [A-Z][a-z]{2} \d{1,2}, \d{4}$/);
});

test("a later save counts as updated", () => {
  const createdAt = "2026-09-21T15:00:00.000Z";
  const updatedAt = "2026-09-22T15:00:00.000Z";
  assert.equal(resourceWasUpdated(createdAt, updatedAt), true);
  assert.match(resourceUpdatedLabel(updatedAt), /^Updated [A-Z][a-z]{2} \d{1,2}, \d{4}$/);
});
