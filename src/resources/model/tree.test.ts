import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFolderOutline,
  folderAncestorIds,
  folderIdsInSubtree,
  folderPathLabel,
} from "./tree.ts";

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

test("buildFolderOutline nests children and skips excluded", () => {
  const folders = [
    { id: 1, parentId: null, name: "Handouts" },
    { id: 2, parentId: 1, name: "Week 1" },
    { id: 3, parentId: 1, name: "Week 2" },
    { id: 4, parentId: null, name: "Archive" },
  ];
  assert.deepEqual(buildFolderOutline(folders, new Set([4])), [
    {
      id: 1,
      name: "Handouts",
      children: [
        { id: 2, name: "Week 1", children: [] },
        { id: 3, name: "Week 2", children: [] },
      ],
    },
  ]);
});

test("folderAncestorIds lists parents root-first", () => {
  const foldersById = new Map([
    [1, { id: 1, parentId: null }],
    [2, { id: 2, parentId: 1 }],
    [3, { id: 3, parentId: 2 }],
  ]);
  assert.deepEqual(folderAncestorIds(foldersById, 3), [1, 2]);
  assert.deepEqual(folderAncestorIds(foldersById, 1), []);
});
