import assert from "node:assert/strict";
import { test } from "node:test";
import { resourceZipEntryPath, safePathSegment } from "./download.ts";

test("zip entry paths stay unique and drop unsafe characters", () => {
  assert.equal(safePathSegment("a/b:c"), "a-b-c");
  const used = new Set<string>();
  assert.equal(resourceZipEntryPath(used, "Handbook", "notes.pdf"), "Handbook/notes.pdf");
  assert.equal(
    resourceZipEntryPath(used, "Handbook", "notes.pdf"),
    "Handbook/notes-2.pdf",
  );
});
