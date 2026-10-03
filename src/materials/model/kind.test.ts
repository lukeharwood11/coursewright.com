import assert from "node:assert/strict";
import test from "node:test";
import { MATERIAL_KINDS, materialKindLabel, parseMaterialKind } from "./kind";

test("parseMaterialKind accepts resource but the add form does not offer it", () => {
  assert.equal(parseMaterialKind("resource"), "resource");
  assert.equal(parseMaterialKind("page"), "page");
  assert.equal(parseMaterialKind("quiz"), null);
  assert.equal(materialKindLabel("resource"), "Resource");
  assert.equal((MATERIAL_KINDS as readonly string[]).includes("resource"), false);
  assert.deepEqual([...MATERIAL_KINDS], ["page", "link", "file"]);
});
