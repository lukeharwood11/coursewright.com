import { requireSupabase } from "./client";
import {
  parseResourceItemType,
  parseResourceVisibility,
  type ResourceItemType,
  type ResourceVisibility,
} from "@/resources/model/kinds";

export type ResourceItemRecord = {
  id: number;
  organizationId: number;
  folderId: number | null;
  type: ResourceItemType;
  title: string;
  description: string;
  url: string | null;
  fileId: number | null;
  visibility: ResourceVisibility;
  aclInherit: boolean;
  parentsCanView: boolean;
  studentsCanView: boolean;
  archivedAt: string | null;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
};

const ITEM_SELECT =
  "id, organization_id, folder_id, type, title, description, url, file_id, visibility, acl_inherit, parents_can_view, students_can_view, archived_at, created_by, created_at, updated_at, creator:profiles!org_resource_items_created_by_fkey(name)" as const;

function embeddedName(
  value: { name: string | null } | { name: string | null }[] | null,
): string {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name?.trim() ?? "";
}

function toItem(row: {
  id: number;
  organization_id: number;
  folder_id: number | null;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
  file_id: number | null;
  visibility: string;
  acl_inherit: boolean;
  parents_can_view: boolean;
  students_can_view: boolean;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator: { name: string | null } | { name: string | null }[] | null;
}): ResourceItemRecord | null {
  const type = parseResourceItemType(row.type);
  if (!type) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    folderId: row.folder_id,
    type,
    title: row.title,
    description: row.description ?? "",
    url: row.url,
    fileId: row.file_id,
    visibility: parseResourceVisibility(row.visibility),
    aclInherit: row.acl_inherit,
    parentsCanView: row.parents_can_view,
    studentsCanView: row.students_can_view,
    archivedAt: row.archived_at,
    createdBy: row.created_by,
    creatorName: embeddedName(row.creator),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const resourceItemQueryKeys = {
  list: (organizationId: number, folderId: number | null) =>
    ["org-resources", "items", organizationId, folderId] as const,
  detail: (id: number) => ["org-resources", "item", id] as const,
  visible: (organizationId: number) =>
    ["org-resources", "visible", organizationId] as const,
};

export async function listResourceItems(args: {
  organizationId: number;
  folderId: number | null;
  type?: ResourceItemType | "all";
}): Promise<ResourceItemRecord[]> {
  const db = requireSupabase();
  let query = db
    .from("org_resource_items")
    .select(ITEM_SELECT)
    .eq("organization_id", args.organizationId)
    .is("archived_at", null)
    .order("title");
  query =
    args.folderId == null
      ? query.is("folder_id", null)
      : query.eq("folder_id", args.folderId);
  if (args.type && args.type !== "all") {
    query = query.eq("type", args.type);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const item = toItem(row);
    return item ? [item] : [];
  });
}

/** Every non-archived item this actor can select. RLS still applies. */
export async function listOrgResourceItems(
  organizationId: number,
): Promise<ResourceItemRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_items")
    .select(ITEM_SELECT)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("title");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const item = toItem(row);
    return item ? [item] : [];
  });
}

export async function getResourceItem(
  id: number,
): Promise<ResourceItemRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_items")
    .select(ITEM_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toItem(data) : null;
}

export async function createResourceItem(args: {
  organizationId: number;
  folderId: number | null;
  type: ResourceItemType;
  title: string;
  createdBy: string;
  url?: string | null;
  fileId?: number | null;
  description?: string;
}): Promise<ResourceItemRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_items")
    .insert({
      organization_id: args.organizationId,
      folder_id: args.folderId,
      type: args.type,
      title: args.title.trim(),
      description: args.description ?? null,
      url: args.type === "link" ? args.url ?? null : null,
      file_id: args.type === "file" ? args.fileId ?? null : null,
      created_by: args.createdBy,
      visibility: "unpublished",
      acl_inherit: true,
      parents_can_view: false,
      students_can_view: false,
    })
    .select(ITEM_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const item = data ? toItem(data) : null;
  if (!item) throw new Error("The resource was created but couldn’t be opened.");
  return item;
}

export async function updateResourceItem(
  id: number,
  patch: {
    title?: string;
    description?: string | null;
    url?: string | null;
    folderId?: number | null;
    visibility?: ResourceVisibility;
    aclInherit?: boolean;
    parentsCanView?: boolean;
    studentsCanView?: boolean;
    archivedAt?: string | null;
  },
): Promise<ResourceItemRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_items")
    .update({
      ...(patch.title != null ? { title: patch.title.trim() } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.url !== undefined ? { url: patch.url } : {}),
      ...(patch.folderId !== undefined ? { folder_id: patch.folderId } : {}),
      ...(patch.visibility ? { visibility: patch.visibility } : {}),
      ...(patch.aclInherit !== undefined ? { acl_inherit: patch.aclInherit } : {}),
      ...(patch.parentsCanView !== undefined
        ? { parents_can_view: patch.parentsCanView }
        : {}),
      ...(patch.studentsCanView !== undefined
        ? { students_can_view: patch.studentsCanView }
        : {}),
      ...(patch.archivedAt !== undefined ? { archived_at: patch.archivedAt } : {}),
    })
    .eq("id", id)
    .select(ITEM_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const item = data ? toItem(data) : null;
  if (!item) throw new Error("That resource couldn’t be saved.");
  return item;
}

export async function archiveResourceItem(id: number): Promise<void> {
  await updateResourceItem(id, { archivedAt: new Date().toISOString() });
}
