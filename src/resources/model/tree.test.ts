import assert from "node:assert/strict";
import { test } from "node:test";
import { folderIdsInSubtree, folderPathLabel } from "./tree.ts";

test("subtree includes the folder and nested children", () => {
  const folders = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 2 },
    { id: 4, parentId: null },
  ];
  assert.deepEqual([...folderIdsInSubtree(folders, 1)].sort((a, b) => a - b), [
    1, 2, 3,
  ]);
  assert.deepEqual([...folderIdsInSubtree(folders, 4)], [4]);
});

test("folder path labels walk ancestors", () => {
  const foldersById = new Map([
    [1, { id: 1, parentId: null, name: "Handouts" }],
    [2, { id: 2, parentId: 1, name: "Week 1" }],
  ]);
  assert.equal(folderPathLabel(foldersById, 2), "Handouts / Week 1");
});
