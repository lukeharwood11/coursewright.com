import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aclSourceFolder,
  folderCapabilities,
  itemCapabilities,
  type FolderAclSource,
} from "./access.ts";

const staff = { userId: "staff", isStaff: true, isParentRole: false };
const parent = { userId: "parent", isStaff: false, isParentRole: true };

function folder(
  id: number,
  parentId: number | null,
  accessMode: FolderAclSource["accessMode"] = "staff",
  aclInherit = parentId != null,
): FolderAclSource {
  return { id, parentId, accessMode, aclInherit };
}

test("acl inherit walks to the nearest non-inheriting ancestor", () => {
  const root = folder(1, null, "parents", false);
  const child = folder(2, 1, "staff", true);
  const byId = new Map([
    [1, root],
    [2, child],
  ]);
  assert.equal(aclSourceFolder(child, byId).id, 1);
});

test("staff can edit unpublished items; parents cannot without a grant", () => {
  const caps = itemCapabilities({
    actor: staff,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    accessMode: "staff",
    folderId: 1,
    itemId: 9,
    foldersById: new Map([[1, folder(1, null, "parents", false)]]),
    grants: [],
  });
  assert.deepEqual(caps, { canView: true, canEdit: true });

  const parentCaps = itemCapabilities({
    actor: parent,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    accessMode: "staff",
    folderId: 1,
    itemId: 9,
    foldersById: new Map([[1, folder(1, null, "parents", false)]]),
    grants: [],
  });
  assert.deepEqual(parentCaps, { canView: false, canEdit: false });
});

test("published parents-mode folder is readable by parent members", () => {
  const foldersById = new Map([[1, folder(1, null, "parents", false)]]);
  const caps = itemCapabilities({
    actor: parent,
    visibility: "published",
    archived: false,
    aclInherit: true,
    accessMode: "staff",
    folderId: 1,
    itemId: 9,
    foldersById,
    grants: [],
  });
  assert.deepEqual(caps, { canView: true, canEdit: false });
});

test("write grant on a folder lets a parent edit inherited items", () => {
  const foldersById = new Map([[1, folder(1, null, "restricted", false)]]);
  const caps = itemCapabilities({
    actor: parent,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    accessMode: "staff",
    folderId: 1,
    itemId: 9,
    foldersById,
    grants: [
      {
        id: 1,
        folderId: 1,
        itemId: null,
        granteeUserId: "parent",
        permission: "write",
      },
    ],
  });
  assert.deepEqual(caps, { canView: true, canEdit: true });
});

test("restricted item grant is required when not inheriting", () => {
  const foldersById = new Map([[1, folder(1, null, "parents", false)]]);
  const none = itemCapabilities({
    actor: parent,
    visibility: "published",
    archived: false,
    aclInherit: false,
    accessMode: "restricted",
    folderId: 1,
    itemId: 9,
    foldersById,
    grants: [],
  });
  assert.deepEqual(none, { canView: false, canEdit: false });

  const granted = itemCapabilities({
    actor: parent,
    visibility: "published",
    archived: false,
    aclInherit: false,
    accessMode: "restricted",
    folderId: 1,
    itemId: 9,
    foldersById,
    grants: [
      {
        id: 2,
        folderId: null,
        itemId: 9,
        granteeUserId: "parent",
        permission: "read",
      },
    ],
  });
  assert.deepEqual(granted, { canView: true, canEdit: false });
});

test("folder capabilities follow the ACL source", () => {
  const root = folder(1, null, "parents", false);
  const child = folder(2, 1, "staff", true);
  const byId = new Map([
    [1, root],
    [2, child],
  ]);
  assert.equal(
    folderCapabilities({
      actor: parent,
      folder: child,
      foldersById: byId,
      grants: [],
      archived: false,
    }).canView,
    true,
  );
});
