import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeSelection,
  selectionActions,
  selectionKey,
  toggleSelection,
  type SelectedResource,
} from "./selection.ts";

const folder: SelectedResource = {
  kind: "folder",
  id: 1,
  parentId: null,
  aclInherit: false,
  canEdit: true,
};

const file: SelectedResource = {
  kind: "item",
  id: 8,
  folderId: 1,
  type: "file",
  fileId: 3,
  title: "Handbook",
  canEdit: true,
};

const link: SelectedResource = {
  kind: "item",
  id: 9,
  folderId: null,
  type: "link",
  fileId: null,
  title: "Site",
  canEdit: false,
};

test("selection toggles and merges by kind and id", () => {
  assert.equal(selectionKey(folder), "folder:1");
  const once = toggleSelection([], folder);
  assert.equal(once.length, 1);
  assert.equal(toggleSelection(once, folder).length, 0);
  const merged = mergeSelection([folder], [file, folder], true);
  assert.deepEqual(merged.map(selectionKey), ["folder:1", "item:8"]);
  assert.deepEqual(mergeSelection(merged, [folder], false).map(selectionKey), ["item:8"]);
});

test("selection actions ignore folders for print, publish, and download", () => {
  const actions = selectionActions([folder, file, link]);
  assert.equal(actions.canMove, false);
  assert.equal(actions.canPublish, true);
  assert.deepEqual(actions.printableIds, [8]);
  assert.deepEqual(actions.files, [{ title: "Handbook", fileId: 3 }]);
  assert.equal(selectionActions([folder, file]).canMove, true);
});
