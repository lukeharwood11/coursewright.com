import {
  courseResourceLinkFamilyAccessWarning,
  effectiveAudienceForCourseLink,
} from "@/courses/model/courseResourceLinkAccess";
import type { FolderAclSource } from "@/resources/model/access";
import {
  parseResourceItemType,
  parseResourceVisibility,
  type ResourceItemType,
  type ResourceVisibility,
} from "@/resources/model/kinds";
import { folderPathLabel } from "@/resources/model/tree";

export type LessonPlanDayResourceRef = {
  kind: "folder" | "item";
  id: number;
};

export type LessonPlanDayResourceRecord = LessonPlanDayResourceRef & {
  title: string;
  itemType: "folder" | ResourceItemType;
  visibility: ResourceVisibility | null;
  /** Item's folder, or a folder's parent. */
  parentFolderId: number | null;
  parentsCanView: boolean;
  studentsCanView: boolean;
  aclInherit: boolean;
  familyAccessWarning: string | null;
};

export type LessonPlanResourcePickerNode = {
  kind: "folder" | "item";
  id: number;
  title: string;
  /** Folder path used for search. Includes the folder's own name; items use their folder's path. */
  path: string;
  itemType: "folder" | ResourceItemType;
  visibility: ResourceVisibility | null;
  familyAccessWarning: string | null;
  children: LessonPlanResourcePickerNode[];
};

export function dayResourceKey(resource: LessonPlanDayResourceRef): string {
  return `${resource.kind}:${resource.id}`;
}

/** Folder ids and item ids are deduped in separate sets. Order is kept. */
export function uniqueDayResources(
  resources: readonly LessonPlanDayResourceRef[],
): LessonPlanDayResourceRef[] {
  const folders = new Set<number>();
  const items = new Set<number>();
  const next: LessonPlanDayResourceRef[] = [];
  for (const resource of resources) {
    const seen = resource.kind === "folder" ? folders : items;
    if (seen.has(resource.id)) continue;
    seen.add(resource.id);
    next.push({ kind: resource.kind, id: resource.id });
  }
  return next;
}

export function toggleDayResource(
  resources: readonly LessonPlanDayResourceRef[],
  resource: LessonPlanDayResourceRef,
): LessonPlanDayResourceRef[] {
  const exists = resources.some(
    (current) => current.kind === resource.kind && current.id === resource.id,
  );
  if (exists) {
    return resources.filter(
      (current) => !(current.kind === resource.kind && current.id === resource.id),
    );
  }
  return uniqueDayResources([...resources, resource]);
}

export function lessonPlanDayResourceInserts(
  lessonPlanDayId: number,
  resources: readonly LessonPlanDayResourceRef[],
): Array<{
  lesson_plan_day_id: number;
  folder_id: number | null;
  item_id: number | null;
  position: number;
}> {
  return uniqueDayResources(resources).map((resource, position) => ({
    lesson_plan_day_id: lessonPlanDayId,
    folder_id: resource.kind === "folder" ? resource.id : null,
    item_id: resource.kind === "item" ? resource.id : null,
    position,
  }));
}

type FolderEmbed = {
  id: number;
  name: string;
  parent_id: number | null;
  archived_at: string | null;
  parents_can_view: boolean;
  students_can_view: boolean;
  acl_inherit: boolean;
};

type ItemEmbed = {
  id: number;
  title: string;
  type: string;
  visibility: string;
  folder_id: number | null;
  archived_at: string | null;
  parents_can_view: boolean;
  students_can_view: boolean;
  acl_inherit: boolean;
};

export type LessonPlanDayResourceEmbed = {
  position: number;
  folder_id: number | null;
  item_id: number | null;
  folder: FolderEmbed | FolderEmbed[] | null;
  item: ItemEmbed | ItemEmbed[] | null;
};

function embedOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function familyAccessWarningForDayResource(args: {
  kind: "folder" | "item";
  id: number;
  visibility: ResourceVisibility | null;
  parentFolderId: number | null;
  parentsCanView: boolean;
  studentsCanView: boolean;
  aclInherit: boolean;
  foldersById: Map<number, FolderAclSource>;
}): string | null {
  const { audience, unresolved } = effectiveAudienceForCourseLink({
    kind: args.kind,
    folderId: args.kind === "folder" ? args.id : args.parentFolderId,
    parentId: args.kind === "folder" ? args.parentFolderId : null,
    aclInherit: args.aclInherit,
    draft: {
      parentsCanView: args.parentsCanView,
      studentsCanView: args.studentsCanView,
    },
    foldersById: args.foldersById,
  });
  return courseResourceLinkFamilyAccessWarning({
    kind: args.kind,
    visibility: args.kind === "item" ? args.visibility : null,
    audience,
    unresolved,
  });
}

/** Drop a link whose folder or item embed is missing (RLS hid it). Keep position order. */
export function lessonPlanDayResourcesFromEmbeds(
  rows: readonly LessonPlanDayResourceEmbed[] | null | undefined,
  foldersById: Map<number, FolderAclSource>,
): LessonPlanDayResourceRecord[] {
  const sorted = [...(rows ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const records: LessonPlanDayResourceRecord[] = [];
  for (const row of sorted) {
    const folder = embedOne(row.folder);
    const item = embedOne(row.item);
    if (folder != null && row.folder_id != null && row.item_id == null) {
      const record: LessonPlanDayResourceRecord = {
        kind: "folder",
        id: folder.id,
        title: folder.name,
        itemType: "folder",
        visibility: null,
        parentFolderId: folder.parent_id,
        parentsCanView: folder.parents_can_view,
        studentsCanView: folder.students_can_view,
        aclInherit: folder.acl_inherit,
        familyAccessWarning: null,
      };
      record.familyAccessWarning = familyAccessWarningForDayResource({
        ...record,
        foldersById,
      });
      records.push(record);
      continue;
    }
    if (item != null && row.item_id != null && row.folder_id == null) {
      const itemType = parseResourceItemType(item.type);
      if (!itemType) continue;
      const record: LessonPlanDayResourceRecord = {
        kind: "item",
        id: item.id,
        title: item.title,
        itemType,
        visibility: parseResourceVisibility(item.visibility),
        parentFolderId: item.folder_id,
        parentsCanView: item.parents_can_view,
        studentsCanView: item.students_can_view,
        aclInherit: item.acl_inherit,
        familyAccessWarning: null,
      };
      record.familyAccessWarning = familyAccessWarningForDayResource({
        ...record,
        foldersById,
      });
      records.push(record);
    }
  }
  return records;
}

export type CourseLinkedResourceSeed = {
  folderId: number | null;
  itemId: number | null;
  title: string;
  kind: "folder" | ResourceItemType;
  familyAccessWarning: string | null;
};

export type ExpandedResourceFolder = {
  id: number;
  parentId: number | null;
  name: string;
  parentsCanView: boolean;
  studentsCanView: boolean;
  aclInherit: boolean;
};

export type ExpandedResourceItem = {
  id: number;
  folderId: number | null;
  title: string;
  type: ResourceItemType;
  visibility: ResourceVisibility;
  parentsCanView: boolean;
  studentsCanView: boolean;
  aclInherit: boolean;
};

function warningForFolder(
  folder: ExpandedResourceFolder,
  foldersById: Map<number, FolderAclSource>,
): string | null {
  return familyAccessWarningForDayResource({
    kind: "folder",
    id: folder.id,
    visibility: null,
    parentFolderId: folder.parentId,
    parentsCanView: folder.parentsCanView,
    studentsCanView: folder.studentsCanView,
    aclInherit: folder.aclInherit,
    foldersById,
  });
}

function warningForItem(
  item: ExpandedResourceItem,
  foldersById: Map<number, FolderAclSource>,
): string | null {
  return familyAccessWarningForDayResource({
    kind: "item",
    id: item.id,
    visibility: item.visibility,
    parentFolderId: item.folderId,
    parentsCanView: item.parentsCanView,
    studentsCanView: item.studentsCanView,
    aclInherit: item.aclInherit,
    foldersById,
  });
}

function folderPath(
  foldersById: Map<number, { id: number; parentId: number | null; name: string }>,
  folderId: number | null,
  fallback: string,
): string {
  if (folderId == null) return "";
  const path = folderPathLabel(foldersById, folderId);
  return path || fallback;
}

/**
 * Picker rows are course links plus descendants of linked folders.
 * A folder row is that folder, not every child. Children come only from the
 * expanded child lists (listChildFolders / listResourceItems), not the whole org.
 */
export function buildLessonPlanResourcePicker(args: {
  links: readonly CourseLinkedResourceSeed[];
  foldersById: Map<number, ExpandedResourceFolder>;
  childFoldersByParent: Map<number, readonly ExpandedResourceFolder[]>;
  itemsByFolder: Map<number, readonly ExpandedResourceItem[]>;
}): LessonPlanResourcePickerNode[] {
  const aclById = new Map<number, FolderAclSource>();
  for (const folder of args.foldersById.values()) {
    aclById.set(folder.id, {
      id: folder.id,
      parentId: folder.parentId,
      parentsCanView: folder.parentsCanView,
      studentsCanView: folder.studentsCanView,
      aclInherit: folder.aclInherit,
    });
  }
  const pathFolders = new Map(
    [...args.foldersById.values()].map((folder) => [
      folder.id,
      { id: folder.id, parentId: folder.parentId, name: folder.name },
    ]),
  );

  const linkedFolderIds = new Set<number>();
  for (const link of args.links) {
    if (link.folderId != null) linkedFolderIds.add(link.folderId);
  }

  const expandedFolderIds = new Set<number>();
  for (const folderId of linkedFolderIds) {
    const queue = [folderId];
    const seen = new Set<number>();
    while (queue.length > 0) {
      const current = queue.shift();
      if (current == null || seen.has(current)) continue;
      seen.add(current);
      expandedFolderIds.add(current);
      for (const child of args.childFoldersByParent.get(current) ?? []) {
        queue.push(child.id);
      }
    }
  }

  function ancestorIsLinked(folderId: number): boolean {
    const seen = new Set<number>();
    let parentId = args.foldersById.get(folderId)?.parentId ?? null;
    while (parentId != null && !seen.has(parentId)) {
      if (linkedFolderIds.has(parentId)) return true;
      seen.add(parentId);
      parentId = args.foldersById.get(parentId)?.parentId ?? null;
    }
    return false;
  }

  function itemNode(item: ExpandedResourceItem): LessonPlanResourcePickerNode {
    return {
      kind: "item",
      id: item.id,
      title: item.title,
      path: folderPath(pathFolders, item.folderId, ""),
      itemType: item.type,
      visibility: item.visibility,
      familyAccessWarning: warningForItem(item, aclById),
      children: [],
    };
  }

  function folderNode(folder: ExpandedResourceFolder): LessonPlanResourcePickerNode {
    const childFolders = [...(args.childFoldersByParent.get(folder.id) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const items = [...(args.itemsByFolder.get(folder.id) ?? [])].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
    return {
      kind: "folder",
      id: folder.id,
      title: folder.name,
      path: folderPath(pathFolders, folder.id, folder.name),
      itemType: "folder",
      visibility: null,
      familyAccessWarning: warningForFolder(folder, aclById),
      children: [...childFolders.map(folderNode), ...items.map(itemNode)],
    };
  }

  const roots: LessonPlanResourcePickerNode[] = [];
  const linkedFolders = [...linkedFolderIds]
    .map((id) => args.foldersById.get(id))
    .filter((folder): folder is ExpandedResourceFolder => folder != null)
    .filter((folder) => !ancestorIsLinked(folder.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const folder of linkedFolders) roots.push(folderNode(folder));

  const itemsInsideExpanded = new Set<number>();
  for (const [folderId, items] of args.itemsByFolder) {
    if (!expandedFolderIds.has(folderId)) continue;
    for (const item of items) itemsInsideExpanded.add(item.id);
  }

  for (const link of args.links) {
    if (link.itemId == null) continue;
    if (itemsInsideExpanded.has(link.itemId)) continue;
    roots.push({
      kind: "item",
      id: link.itemId,
      title: link.title,
      path: "",
      itemType: link.kind === "folder" ? "document" : link.kind,
      visibility: null,
      familyAccessWarning: link.familyAccessWarning,
      children: [],
    });
  }

  return roots;
}

export function flattenPickerNodes(
  nodes: readonly LessonPlanResourcePickerNode[],
): LessonPlanResourcePickerNode[] {
  const flat: LessonPlanResourcePickerNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    flat.push(...flattenPickerNodes(node.children));
  }
  return flat;
}

/** Search only this eligible set, by name or folder path. */
export function filterPickerNodes(
  nodes: readonly LessonPlanResourcePickerNode[],
  query: string,
): LessonPlanResourcePickerNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...nodes];
  return flattenPickerNodes(nodes).filter((node) => {
    return (
      node.title.toLowerCase().includes(needle) ||
      node.path.toLowerCase().includes(needle)
    );
  }).map((node) => ({ ...node, children: [] }));
}

export function catalogFromPicker(
  nodes: readonly LessonPlanResourcePickerNode[],
): LessonPlanDayResourceRecord[] {
  return flattenPickerNodes(nodes).map((node) => ({
    kind: node.kind,
    id: node.id,
    title: node.title,
    itemType: node.itemType,
    visibility: node.visibility,
    parentFolderId: null,
    parentsCanView: true,
    studentsCanView: true,
    aclInherit: false,
    familyAccessWarning: node.familyAccessWarning,
  }));
}
