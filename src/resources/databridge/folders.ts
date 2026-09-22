import { requireSupabase } from "./client";
import {
  parseResourceAccessMode,
  type ResourceAccessMode,
} from "@/resources/model/kinds";

export type ResourceFolderRecord = {
  id: number;
  organizationId: number;
  parentId: number | null;
  name: string;
  description: string;
  accessMode: ResourceAccessMode;
  aclInherit: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
};

const FOLDER_SELECT =
  "id, organization_id, parent_id, name, description, access_mode, acl_inherit, sort_order, archived_at, created_by, created_at, updated_at, creator:profiles!org_resource_folders_created_by_fkey(name)" as const;

function embeddedName(
  value: { name: string | null } | { name: string | null }[] | null,
): string {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name?.trim() ?? "";
}

function toFolder(row: {
  id: number;
  organization_id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  access_mode: string;
  acl_inherit: boolean;
  sort_order: number;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator: { name: string | null } | { name: string | null }[] | null;
}): ResourceFolderRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description ?? "",
    accessMode: parseResourceAccessMode(row.access_mode),
    aclInherit: row.acl_inherit,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdBy: row.created_by,
    creatorName: embeddedName(row.creator),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const resourceFolderQueryKeys = {
  children: (organizationId: number, parentId: number | null) =>
    ["org-resources", "folders", organizationId, parentId] as const,
  all: (organizationId: number) =>
    ["org-resources", "folders", organizationId, "all"] as const,
  detail: (id: number) => ["org-resources", "folder", id] as const,
  ancestors: (id: number) => ["org-resources", "folder-ancestors", id] as const,
};

export async function listChildFolders(args: {
  organizationId: number;
  parentId: number | null;
}): Promise<ResourceFolderRecord[]> {
  const db = requireSupabase();
  let query = db
    .from("org_resource_folders")
    .select(FOLDER_SELECT)
    .eq("organization_id", args.organizationId)
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  query =
    args.parentId == null
      ? query.is("parent_id", null)
      : query.eq("parent_id", args.parentId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(toFolder);
}

export async function listOrgResourceFolders(
  organizationId: number,
): Promise<ResourceFolderRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_folders")
    .select(FOLDER_SELECT)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toFolder);
}

export async function getResourceFolder(
  id: number,
): Promise<ResourceFolderRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_folders")
    .select(FOLDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toFolder(data) : null;
}

export async function loadFolderAncestors(
  folderId: number,
): Promise<ResourceFolderRecord[]> {
  const trail: ResourceFolderRecord[] = [];
  let currentId: number | null = folderId;
  const seen = new Set<number>();
  while (currentId != null && !seen.has(currentId)) {
    seen.add(currentId);
    const folder = await getResourceFolder(currentId);
    if (!folder) break;
    trail.unshift(folder);
    currentId = folder.parentId;
  }
  return trail;
}

export async function createResourceFolder(args: {
  organizationId: number;
  parentId: number | null;
  name: string;
  createdBy: string;
  accessMode?: ResourceAccessMode;
  aclInherit?: boolean;
}): Promise<ResourceFolderRecord> {
  const db = requireSupabase();
  const aclInherit =
    args.aclInherit ?? (args.parentId != null);
  const { data, error } = await db
    .from("org_resource_folders")
    .insert({
      organization_id: args.organizationId,
      parent_id: args.parentId,
      name: args.name.trim(),
      created_by: args.createdBy,
      access_mode: args.accessMode ?? "staff",
      acl_inherit: args.parentId == null ? false : aclInherit,
    })
    .select(FOLDER_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The folder was created but couldn’t be opened.");
  return toFolder(data);
}

export async function updateResourceFolder(
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    parentId?: number | null;
    accessMode?: ResourceAccessMode;
    aclInherit?: boolean;
    archivedAt?: string | null;
  },
): Promise<ResourceFolderRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_folders")
    .update({
      ...(patch.name != null ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.parentId !== undefined ? { parent_id: patch.parentId } : {}),
      ...(patch.accessMode ? { access_mode: patch.accessMode } : {}),
      ...(patch.aclInherit !== undefined ? { acl_inherit: patch.aclInherit } : {}),
      ...(patch.archivedAt !== undefined ? { archived_at: patch.archivedAt } : {}),
    })
    .eq("id", id)
    .select(FOLDER_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That folder couldn’t be saved.");
  return toFolder(data);
}

export async function archiveResourceFolder(id: number): Promise<void> {
  await updateResourceFolder(id, { archivedAt: new Date().toISOString() });
}

export async function orgHasVisibleResources(
  organizationId: number,
): Promise<boolean> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_items")
    .select("id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}
