import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFolderOutline,
  folderAncestorIds,
  folderIdsInSubtree,
  folderPathLabel,
  resourceBrowseChildren,
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

test("shared items under a staff-only folder are listed at the resources root", () => {
  // Folder 4 is staff-only, so parent and student SELECT sets omit it.
  // Each call is only the rows that role can already read.
  const parentRoot = resourceBrowseChildren({
    folders: [],
    items: [{ id: 1, folderId: 4 }],
    parentId: null,
  });
  const studentRoot = resourceBrowseChildren({
    folders: [{ id: 8, parentId: null }],
    items: [{ id: 2, folderId: 4 }],
    parentId: null,
  });
  assert.deepEqual(
    parentRoot.items.map((item) => item.id),
    [1],
  );
  assert.deepEqual(
    studentRoot.items.map((item) => item.id),
    [2],
  );
  assert.deepEqual(
    studentRoot.folders.map((folder) => folder.id),
    [8],
  );
});

test("a legacy both-audience item nested in a staff-only folder is listed at the root", () => {
  const root = resourceBrowseChildren({
    folders: [],
    items: [{ id: 7, folderId: 3 }],
    parentId: null,
  });
  assert.deepEqual(
    root.items.map((item) => item.id),
    [7],
  );
  assert.deepEqual(root.folders, []);
});

test("items in a folder the viewer can open stay in that folder", () => {
  const folders = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
  ];
  const items = [
    { id: 10, folderId: null },
    { id: 11, folderId: 1 },
    { id: 12, folderId: 2 },
    { id: 13, folderId: 99 },
  ];
  const root = resourceBrowseChildren({ folders, items, parentId: null });
  assert.deepEqual(
    root.folders.map((folder) => folder.id),
    [1],
  );
  assert.deepEqual(
    root.items.map((item) => item.id),
    [10, 13],
  );
  const inside = resourceBrowseChildren({ folders, items, parentId: 1 });
  assert.deepEqual(
    inside.folders.map((folder) => folder.id),
    [2],
  );
  assert.deepEqual(
    inside.items.map((item) => item.id),
    [11],
  );
});

test("a folder the viewer can open under a hidden parent is listed at the root", () => {
  const folders = [{ id: 5, parentId: 1 }];
  const items = [{ id: 8, folderId: 5 }];
  const root = resourceBrowseChildren({ folders, items, parentId: null });
  assert.deepEqual(
    root.folders.map((folder) => folder.id),
    [5],
  );
  assert.deepEqual(
    root.items.map((item) => item.id),
    [],
  );
  const inside = resourceBrowseChildren({ folders, items, parentId: 5 });
  assert.deepEqual(
    inside.items.map((item) => item.id),
    [8],
  );
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
