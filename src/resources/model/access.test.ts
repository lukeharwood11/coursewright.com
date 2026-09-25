import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aclSourceFolder,
  folderCapabilities,
  itemCapabilities,
  previewResourceAudience,
  resourceAccessCards,
  type FolderAclSource,
} from "./access.ts";

const staff = { userId: "staff", isStaff: true, isParent: false, isStudent: false };
const parent = { userId: "parent", isStaff: false, isParent: true, isStudent: false };
const student = { userId: "student", isStaff: false, isParent: false, isStudent: true };

function folder(
  id: number,
  parentId: number | null,
  parentsCanView = false,
  studentsCanView = false,
  aclInherit = parentId != null,
): FolderAclSource {
  return { id, parentId, parentsCanView, studentsCanView, aclInherit };
}

test("acl inherit walks to the nearest non-inheriting ancestor", () => {
  const root = folder(1, null, true, false, false);
  const child = folder(2, 1, false, false, true);
  const byId = new Map([
    [1, root],
    [2, child],
  ]);
  assert.equal(aclSourceFolder(child, byId).id, 1);
});

test("observers can view unpublished items and cannot edit them", () => {
  const observer = {
    userId: "observer",
    isStaff: true,
    canWrite: false,
    isParent: false,
    isStudent: false,
  };
  const caps = itemCapabilities({
    actor: observer,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    audience: { parentsCanView: false, studentsCanView: false },
    folderId: null,
    itemId: 9,
    foldersById: new Map(),
    grants: [],
  });
  assert.deepEqual(caps, { canView: true, canEdit: false });
});

test("staff can edit unpublished items; parents cannot without a grant", () => {
  const caps = itemCapabilities({
    actor: staff,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    audience: { parentsCanView: false, studentsCanView: false },
    folderId: 1,
    itemId: 9,
    foldersById: new Map([[1, folder(1, null, true, false, false)]]),
    grants: [],
  });
  assert.deepEqual(caps, { canView: true, canEdit: true });

  const parentCaps = itemCapabilities({
    actor: parent,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    audience: { parentsCanView: false, studentsCanView: false },
    folderId: 1,
    itemId: 9,
    foldersById: new Map([[1, folder(1, null, true, false, false)]]),
    grants: [],
  });
  assert.deepEqual(parentCaps, { canView: false, canEdit: false });
});

test("parent and student visibility are independent", () => {
  const foldersById = new Map([[1, folder(1, null, true, false, false)]]);
  const parentCaps = itemCapabilities({
    actor: parent,
    visibility: "published",
    archived: false,
    aclInherit: true,
    audience: { parentsCanView: false, studentsCanView: false },
    folderId: 1,
    itemId: 9,
    foldersById,
    grants: [],
  });
  assert.deepEqual(parentCaps, { canView: true, canEdit: false });
  const studentCaps = itemCapabilities({
    actor: student,
    visibility: "published",
    archived: false,
    aclInherit: true,
    audience: { parentsCanView: false, studentsCanView: false },
    folderId: 1,
    itemId: 9,
    foldersById,
    grants: [],
  });
  assert.deepEqual(studentCaps, { canView: false, canEdit: false });
});

test("students can see a folder when only the student flag is on", () => {
  const foldersById = new Map([[1, folder(1, null, false, true, false)]]);
  assert.equal(
    itemCapabilities({
      actor: student,
      visibility: "published",
      archived: false,
      aclInherit: true,
      audience: { parentsCanView: true, studentsCanView: true },
      folderId: 1,
      itemId: 9,
      foldersById,
      grants: [],
    }).canView,
    true,
  );
  assert.equal(
    itemCapabilities({
      actor: parent,
      visibility: "published",
      archived: false,
      aclInherit: true,
      audience: { parentsCanView: true, studentsCanView: true },
      folderId: 1,
      itemId: 9,
      foldersById,
      grants: [],
    }).canView,
    false,
  );
});

test("write grant on a folder lets a parent edit inherited items", () => {
  const foldersById = new Map([[1, folder(1, null, false, false, false)]]);
  const caps = itemCapabilities({
    actor: parent,
    visibility: "unpublished",
    archived: false,
    aclInherit: true,
    audience: { parentsCanView: false, studentsCanView: false },
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
  const foldersById = new Map([[1, folder(1, null, true, false, false)]]);
  const none = itemCapabilities({
    actor: parent,
    visibility: "published",
    archived: false,
    aclInherit: false,
    audience: { parentsCanView: false, studentsCanView: false },
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
    audience: { parentsCanView: false, studentsCanView: false },
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
  const root = folder(1, null, true, false, false);
  const child = folder(2, 1, false, true, true);
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
  assert.equal(
    folderCapabilities({
      actor: student,
      folder: child,
      foldersById: byId,
      grants: [],
      archived: false,
    }).canView,
    false,
  );
});

test("an unfiled item that inherits is closed to parents and students", () => {
  const preview = previewResourceAudience({
    kind: "item",
    id: 9,
    parentId: null,
    folderId: null,
    inherit: true,
    draft: { parentsCanView: true, studentsCanView: true },
    foldersById: new Map(),
  });
  assert.deepEqual(preview.audience, { parentsCanView: false, studentsCanView: false });
  assert.equal(preview.unresolved, false);
});

test("access cards name only audiences who can open it", () => {
  assert.deepEqual(
    resourceAccessCards({
      kind: "folder",
      audience: { parentsCanView: true, studentsCanView: false },
      grants: [{ name: "Sam Lee", permission: "write", audience: "student" }],
    }),
    ["Parents can access this folder", "Students can access this folder"],
  );
  assert.deepEqual(
    resourceAccessCards({
      kind: "item",
      audience: { parentsCanView: false, studentsCanView: true },
      grants: [],
    }),
    ["Students can access this resource"],
  );
});
