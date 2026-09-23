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
  isStaff: boolean;
  isParent: boolean;
  isStudent: boolean;
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

function personLine(grant: NamedResourceGrant): string {
  const verb = grant.permission === "write" ? "edit" : "view";
  return `${grant.name} can ${verb}.`;
}

function audienceLines(
  label: "Parents" | "Students",
  canView: boolean,
  grants: NamedResourceGrant[],
): string[] {
  const extras = grants.filter((grant) => !canView || grant.permission === "write");
  return [`${label} ${canView ? "can" : "cannot"} see this.`, ...extras.map(personLine)];
}

/** Plain-language result for the access dialog. Stays the same on either tab. */
export function resourceAccessSummary(args: {
  kind: "folder" | "item";
  followsName: string | null;
  unresolved: boolean;
  audience: ResourceAudience;
  grants: NamedResourceGrant[];
  unpublished: boolean;
}): { title: string; lines: string[] } {
  const title = args.kind === "folder" ? "Access for this folder" : "Access for this resource";
  if (args.unresolved) {
    return {
      title,
      lines: ["This follows its folder. The folder’s access is still loading."],
    };
  }
  const parents = args.grants.filter((grant) => grant.audience === "parent");
  const students = args.grants.filter((grant) => grant.audience === "student");
  const others = args.grants.filter((grant) => grant.audience === "other");
  const lines = [
    ...(args.followsName ? [`Follows “${args.followsName}”.`] : []),
    ...audienceLines("Parents", args.audience.parentsCanView, parents),
    ...audienceLines("Students", args.audience.studentsCanView, students),
    ...others.map(personLine),
    "Staff can always open and edit this.",
  ];
  if (args.unpublished) {
    lines.push("This isn’t published, so only editors can open it until you publish.");
  }
  return { title, lines };
}
