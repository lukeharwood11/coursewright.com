import { requireSupabase } from "./client";
import {
  courseResourceLinkFamilyAccessWarning,
  effectiveAudienceForCourseLink,
} from "@/courses/model/courseResourceLinkAccess";
import { listOrgResourceFolders } from "@/resources/databridge/folders";
import type { ResourceItemType } from "@/resources/model/kinds";
import { parseResourceItemType, parseResourceVisibility } from "@/resources/model/kinds";
import type { FolderAclSource } from "@/resources/model/access";

export type CourseResourceLinkRecord = {
  id: number;
  courseId: number;
  folderId: number | null;
  itemId: number | null;
  sortOrder: number;
  title: string;
  kind: "folder" | ResourceItemType;
  /** Set when parents and/or students cannot open this target via Resources ACL. */
  familyAccessWarning: string | null;
};

const LINK_SELECT =
  "id, course_id, organization_id, folder_id, item_id, sort_order, folder:org_resource_folders(id, name, archived_at, parent_id, parents_can_view, students_can_view, acl_inherit), item:org_resource_items(id, title, type, archived_at, folder_id, parents_can_view, students_can_view, acl_inherit, visibility)" as const;

type FolderEmbed = {
  id: number;
  name: string;
  archived_at: string | null;
  parent_id: number | null;
  parents_can_view: boolean;
  students_can_view: boolean;
  acl_inherit: boolean;
};

type ItemEmbed = {
  id: number;
  title: string;
  type: string;
  archived_at: string | null;
  folder_id: number | null;
  parents_can_view: boolean;
  students_can_view: boolean;
  acl_inherit: boolean;
  visibility: string;
};

type LinkRow = {
  id: number;
  course_id: number;
  organization_id: number;
  folder_id: number | null;
  item_id: number | null;
  sort_order: number;
  folder: FolderEmbed | FolderEmbed[] | null;
  item: ItemEmbed | ItemEmbed[] | null;
};

function toFolderAclSource(folder: FolderEmbed): FolderAclSource {
  return {
    id: folder.id,
    parentId: folder.parent_id,
    parentsCanView: folder.parents_can_view,
    studentsCanView: folder.students_can_view,
    aclInherit: folder.acl_inherit,
  };
}

function embedOne<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toLink(
  row: LinkRow,
  foldersById: Map<number, FolderAclSource>,
): CourseResourceLinkRecord | null {
  const folder = embedOne(row.folder);
  const item = embedOne(row.item);
  if (folder != null && folder.archived_at == null) {
    const map = new Map(foldersById);
    map.set(folder.id, toFolderAclSource(folder));
    const { audience, unresolved } = effectiveAudienceForCourseLink({
      kind: "folder",
      folderId: folder.id,
      parentId: folder.parent_id,
      aclInherit: folder.acl_inherit,
      draft: {
        parentsCanView: folder.parents_can_view,
        studentsCanView: folder.students_can_view,
      },
      foldersById: map,
    });
    return {
      id: row.id,
      courseId: row.course_id,
      folderId: row.folder_id,
      itemId: null,
      sortOrder: row.sort_order,
      title: folder.name,
      kind: "folder",
      familyAccessWarning: courseResourceLinkFamilyAccessWarning({
        kind: "folder",
        visibility: null,
        audience,
        unresolved,
      }),
    };
  }
  if (item != null && item.archived_at == null) {
    const type = parseResourceItemType(item.type);
    if (!type) return null;
    const visibility = parseResourceVisibility(item.visibility);
    const { audience, unresolved } = effectiveAudienceForCourseLink({
      kind: "item",
      folderId: item.folder_id,
      parentId: null,
      aclInherit: item.acl_inherit,
      draft: {
        parentsCanView: item.parents_can_view,
        studentsCanView: item.students_can_view,
      },
      foldersById,
    });
    return {
      id: row.id,
      courseId: row.course_id,
      folderId: null,
      itemId: row.item_id,
      sortOrder: row.sort_order,
      title: item.title,
      kind: type,
      familyAccessWarning: courseResourceLinkFamilyAccessWarning({
        kind: "item",
        visibility,
        audience,
        unresolved,
      }),
    };
  }
  return null;
}

export const courseResourceLinkQueryKeys = {
  list: (courseId: number) => ["courses", "resourceLinks", courseId] as const,
};

export async function listCourseResourceLinks(
  courseId: number,
): Promise<CourseResourceLinkRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_resource_links")
    .select(LINK_SELECT)
    .eq("course_id", courseId)
    .order("sort_order")
    .order("id");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as LinkRow[];
  const organizationId = rows[0]?.organization_id;
  const foldersById = new Map<number, FolderAclSource>();
  if (organizationId != null) {
    const folders = await listOrgResourceFolders(organizationId);
    for (const folder of folders) {
      foldersById.set(folder.id, {
        id: folder.id,
        parentId: folder.parentId,
        parentsCanView: folder.parentsCanView,
        studentsCanView: folder.studentsCanView,
        aclInherit: folder.aclInherit,
      });
    }
  }
  return rows.flatMap((row) => {
    const link = toLink(row, foldersById);
    return link ? [link] : [];
  });
}

export async function createCourseResourceLink(args: {
  courseId: number;
  folderId?: number;
  itemId?: number;
}): Promise<CourseResourceLinkRecord> {
  const db = requireSupabase();
  const folderId = args.folderId ?? null;
  const itemId = args.itemId ?? null;
  if ((folderId == null) === (itemId == null)) {
    throw new Error("Choose a folder or a resource item.");
  }

  const { data: existing, error: listError } = await db
    .from("course_resource_links")
    .select("sort_order")
    .eq("course_id", args.courseId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (listError) throw new Error(listError.message);
  const nextSort =
    existing && existing.length > 0 ? Number(existing[0].sort_order) + 1 : 0;

  const { data: courseRow, error: courseError } = await db
    .from("courses")
    .select("organization_id")
    .eq("id", args.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!courseRow?.organization_id) {
    throw new Error("That course wasn’t found.");
  }

  const { data, error } = await db
    .from("course_resource_links")
    .insert({
      course_id: args.courseId,
      organization_id: courseRow.organization_id,
      folder_id: folderId,
      item_id: itemId,
      sort_order: nextSort,
    })
    .select(LINK_SELECT)
    .single();
  if (error) throw new Error(error.message);
  const organizationId = (data as LinkRow).organization_id;
  const foldersById = new Map<number, FolderAclSource>();
  if (organizationId != null) {
    const folders = await listOrgResourceFolders(organizationId);
    for (const folder of folders) {
      foldersById.set(folder.id, {
        id: folder.id,
        parentId: folder.parentId,
        parentsCanView: folder.parentsCanView,
        studentsCanView: folder.studentsCanView,
        aclInherit: folder.aclInherit,
      });
    }
  }
  const link = toLink(data as LinkRow, foldersById);
  if (!link) throw new Error("Could not load the new link.");
  return link;
}

export async function deleteCourseResourceLink(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("course_resource_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
