import type { ResourceGrantPermission, ResourceVisibility } from "./kinds";

/** Independent audience flags. Staff can always edit; these control who else can view. */
export type ResourceAudience = {
  parentsCanView: boolean;
  studentsCanView: boolean;
};

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
  parentsCanView: boolean;
  studentsCanView: boolean;
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

export function audienceAllowsRead(args: {
  audience: ResourceAudience;
  isParent: boolean;
  isStudent: boolean;
}): boolean {
  return (
    (args.audience.parentsCanView && args.isParent) ||
    (args.audience.studentsCanView && args.isStudent)
  );
}

export type ResourceActor = {
  userId: string;
  /** Sees unpublished rows. Writers and observers. */
  isStaff: boolean;
  /** Defaults to isStaff. Observers browse with canWrite false. */
  canWrite?: boolean;
  isParent: boolean;
  isStudent: boolean;
};

function actorCanWrite(actor: ResourceActor): boolean {
  return actor.canWrite ?? actor.isStaff;
}

export function folderCapabilities(args: {
  actor: ResourceActor;
  folder: FolderAclSource;
  foldersById: Map<number, FolderAclSource>;
  grants: ResourceGrantRecord[];
  archived: boolean;
}): { canView: boolean; canEdit: boolean } {
  const source = aclSourceFolder(args.folder, args.foldersById);
  const canEdit =
    actorCanWrite(args.actor) ||
    grantMatches(args.grants, args.actor.userId, source.id, null, true);
  if (canEdit) return { canView: true, canEdit: true };
  if (args.actor.isStaff && !args.archived) return { canView: true, canEdit: false };
  if (args.archived) return { canView: false, canEdit: false };
  const canView =
    grantMatches(args.grants, args.actor.userId, source.id, null, false) ||
    audienceAllowsRead({
      audience: source,
      isParent: args.actor.isParent,
      isStudent: args.actor.isStudent,
    });
  return { canView, canEdit: false };
}

export function itemCapabilities(args: {
  actor: ResourceActor;
  visibility: ResourceVisibility;
  archived: boolean;
  aclInherit: boolean;
  audience: ResourceAudience;
  folderId: number | null;
  itemId: number;
  foldersById: Map<number, FolderAclSource>;
  grants: ResourceGrantRecord[];
}): { canView: boolean; canEdit: boolean } {
  let canEdit = actorCanWrite(args.actor);
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
  if (args.actor.isStaff && !args.archived) return { canView: true, canEdit: false };
  if (args.archived || args.visibility !== "published") {
    return { canView: false, canEdit: false };
  }

  if (!args.aclInherit) {
    const canView =
      grantMatches(args.grants, args.actor.userId, null, args.itemId, false) ||
      audienceAllowsRead({
        audience: args.audience,
        isParent: args.actor.isParent,
        isStudent: args.actor.isStudent,
      });
    return { canView, canEdit: false };
  }
  if (args.folderId == null) return { canView: false, canEdit: false };
  const folder = args.foldersById.get(args.folderId);
  if (!folder) return { canView: false, canEdit: false };
  const source = aclSourceFolder(folder, args.foldersById);
  const canView =
    grantMatches(args.grants, args.actor.userId, source.id, null, false) ||
    audienceAllowsRead({
      audience: source,
      isParent: args.actor.isParent,
      isStudent: args.actor.isStudent,
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

export type NamedResourceGrant = {
  name: string;
  permission: ResourceGrantPermission;
  audience: "parent" | "student" | "other";
};

export function previewResourceAudience(args: {
  kind: "folder" | "item";
  id: number;
  parentId: number | null;
  folderId: number | null;
  inherit: boolean;
  draft: ResourceAudience;
  foldersById: Map<number, FolderAclSource>;
}): {
  audience: ResourceAudience;
  sourceFolderId: number | null;
  unresolved: boolean;
} {
  if (args.kind === "item") {
    if (!args.inherit) {
      return { audience: args.draft, sourceFolderId: null, unresolved: false };
    }
    if (args.folderId == null) {
      return {
        audience: { parentsCanView: false, studentsCanView: false },
        sourceFolderId: null,
        unresolved: false,
      };
    }
    const folder = args.foldersById.get(args.folderId);
    if (!folder) {
      return { audience: args.draft, sourceFolderId: null, unresolved: true };
    }
    const source = aclSourceFolder(folder, args.foldersById);
    return {
      audience: {
        parentsCanView: source.parentsCanView,
        studentsCanView: source.studentsCanView,
      },
      sourceFolderId: source.id,
      unresolved: false,
    };
  }

  if (!args.inherit) {
    return { audience: args.draft, sourceFolderId: args.id, unresolved: false };
  }
  if (args.parentId == null || !args.foldersById.has(args.parentId)) {
    return { audience: args.draft, sourceFolderId: null, unresolved: true };
  }
  const map = new Map(args.foldersById);
  map.set(args.id, {
    id: args.id,
    parentId: args.parentId,
    parentsCanView: args.draft.parentsCanView,
    studentsCanView: args.draft.studentsCanView,
    aclInherit: true,
  });
  const source = aclSourceFolder(map.get(args.id)!, map);
  return {
    audience: {
      parentsCanView: source.parentsCanView,
      studentsCanView: source.studentsCanView,
    },
    sourceFolderId: source.id,
    unresolved: false,
  };
}

/** Short footer cards for who can open this. Staff are omitted — they always can. */
export function resourceAccessCards(args: {
  kind: "folder" | "item";
  audience: ResourceAudience;
  grants: NamedResourceGrant[];
}): string[] {
  const noun = args.kind === "folder" ? "folder" : "resource";
  const parents =
    args.audience.parentsCanView ||
    args.grants.some((grant) => grant.audience === "parent");
  const students =
    args.audience.studentsCanView ||
    args.grants.some((grant) => grant.audience === "student");
  const cards: string[] = [];
  if (parents) cards.push(`Parents can access this ${noun}`);
  if (students) cards.push(`Students can access this ${noun}`);
  return cards;
}
