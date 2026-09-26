import assert from "node:assert/strict";
import { test } from "node:test";
import { materialChipDisplayTitle } from "./MaterialChip.tsx";

test("materialChipDisplayTitle prefixes due items", () => {
  assert.equal(materialChipDisplayTitle("Essay", "due"), "Due: Essay");
  assert.equal(materialChipDisplayTitle("Essay", "both"), "Due: Essay");
  assert.equal(materialChipDisplayTitle("Essay", "assigned"), "Essay");
  assert.equal(materialChipDisplayTitle("Essay", "plain"), "Essay");
});
