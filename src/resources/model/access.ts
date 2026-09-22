import type {
  ResourceAccessMode,
  ResourceGrantPermission,
  ResourceVisibility,
} from "./kinds";

export type ResourceGrantRecord = {
  id: number;
  folderId: number | null;
  itemId: number | null;
  granteeUserId: string;
  permission: ResourceGrantPermission;
};

export type FolderAclSource = {
  id: number;
  parentId: number | null;
  accessMode: ResourceAccessMode;
  aclInherit: boolean;
};

export function aclSourceFolder(
  folder: FolderAclSource,
  byId: Map<number, FolderAclSource>,
): FolderAclSource {
  let current = folder;
  const seen = new Set<number>();
  while (current.aclInherit && current.parentId != null) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

function grantMatches(
  grants: ResourceGrantRecord[],
  userId: string,
  folderId: number | null,
  itemId: number | null,
  write: boolean,
): boolean {
  return grants.some((grant) => {
    if (grant.granteeUserId !== userId) return false;
    if (folderId != null && grant.folderId !== folderId) return false;
    if (itemId != null && grant.itemId !== itemId) return false;
    if (folderId == null && itemId == null) return false;
    if (write) return grant.permission === "write";
    return true;
  });
}

function modeAllowsRead(args: {
  mode: ResourceAccessMode;
  isStaff: boolean;
  isParentRole: boolean;
  isMember: boolean;
}): boolean {
  if (args.mode === "staff") return args.isStaff;
  if (args.mode === "parents") return args.isStaff || args.isParentRole;
  if (args.mode === "members") return args.isMember;
  return false;
}

export type ResourceActor = {
  userId: string;
  isStaff: boolean;
  isParentRole: boolean;
};

export function folderCapabilities(args: {
  actor: ResourceActor;
  folder: FolderAclSource;
  foldersById: Map<number, FolderAclSource>;
  grants: ResourceGrantRecord[];
  archived: boolean;
}): { canView: boolean; canEdit: boolean } {
  const source = aclSourceFolder(args.folder, args.foldersById);
  const canEdit =
    args.actor.isStaff ||
    grantMatches(args.grants, args.actor.userId, source.id, null, true);
  if (canEdit) return { canView: true, canEdit: true };
  if (args.archived) return { canView: false, canEdit: false };
  const canView =
    grantMatches(args.grants, args.actor.userId, source.id, null, false) ||
    modeAllowsRead({
      mode: source.accessMode,
      isStaff: args.actor.isStaff,
      isParentRole: args.actor.isParentRole,
      isMember: true,
    });
  return { canView, canEdit: false };
}

export function itemCapabilities(args: {
  actor: ResourceActor;
  visibility: ResourceVisibility;
  archived: boolean;
  aclInherit: boolean;
  accessMode: ResourceAccessMode;
  folderId: number | null;
  itemId: number;
  foldersById: Map<number, FolderAclSource>;
  grants: ResourceGrantRecord[];
}): { canView: boolean; canEdit: boolean } {
  let canEdit = args.actor.isStaff;
  if (!canEdit && !args.aclInherit) {
    canEdit = grantMatches(args.grants, args.actor.userId, null, args.itemId, true);
  } else if (!canEdit && args.folderId != null) {
    const folder = args.foldersById.get(args.folderId);
    if (folder) {
      const source = aclSourceFolder(folder, args.foldersById);
      canEdit = grantMatches(args.grants, args.actor.userId, source.id, null, true);
    }
  }
  if (canEdit) return { canView: true, canEdit: true };
  if (args.archived || args.visibility !== "published") {
    return { canView: false, canEdit: false };
  }

  if (!args.aclInherit) {
    const canView =
      grantMatches(args.grants, args.actor.userId, null, args.itemId, false) ||
      modeAllowsRead({
        mode: args.accessMode,
        isStaff: args.actor.isStaff,
        isParentRole: args.actor.isParentRole,
        isMember: true,
      });
    return { canView, canEdit: false };
  }
  if (args.folderId == null) return { canView: false, canEdit: false };
  const folder = args.foldersById.get(args.folderId);
  if (!folder) return { canView: false, canEdit: false };
  const source = aclSourceFolder(folder, args.foldersById);
  const canView =
    grantMatches(args.grants, args.actor.userId, source.id, null, false) ||
    modeAllowsRead({
      mode: source.accessMode,
      isStaff: args.actor.isStaff,
      isParentRole: args.actor.isParentRole,
      isMember: true,
    });
  return { canView, canEdit: false };
}

export function folderBreadcrumb(
  folderId: number | null,
  foldersById: Map<number, FolderAclSource>,
): FolderAclSource[] {
  if (folderId == null) return [];
  const trail: FolderAclSource[] = [];
  let current = foldersById.get(folderId) ?? null;
  const seen = new Set<number>();
  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    trail.unshift(current);
    current = current.parentId != null ? (foldersById.get(current.parentId) ?? null) : null;
  }
  return trail;
}
