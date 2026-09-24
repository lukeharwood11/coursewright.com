import assert from "node:assert/strict";
import { test } from "node:test";
import { previewFromMaterialSnapshot, materialChangeTypeLabel } from "./versionSnapshot";

test("previewFromMaterialSnapshot reads placement and page blocks", () => {
  const preview = previewFromMaterialSnapshot({
    material: {
      id: 12,
      title: "Week 1",
      description: "Intro",
      kind: "page",
      url: null,
      file_id: null,
      scheduled_date: "2026-09-01",
      due_date: null,
    },
    blocks: [
      {
        id: 3,
        material_id: 12,
        kind: "rich_text",
        body: { lexical: {} },
        position: 0,
        file_id: null,
      },
    ],
  });
  assert.deepEqual(preview, {
    title: "Week 1",
    description: "Intro",
    url: null,
    kind: "page",
    fileId: null,
    scheduledDate: "2026-09-01",
    dueDate: null,
    blocks: [
      {
        id: 3,
        materialId: 12,
        kind: "rich_text",
        body: { lexical: {} },
        position: 0,
        fileId: null,
      },
    ],
  });
});

test("previewFromMaterialSnapshot returns null without material", () => {
  assert.equal(previewFromMaterialSnapshot({ blocks: [] }), null);
});

test("materialChangeTypeLabel uses plain labels", () => {
  assert.equal(materialChangeTypeLabel("create"), "Created");
  assert.equal(materialChangeTypeLabel("update"), "Updated");
});
