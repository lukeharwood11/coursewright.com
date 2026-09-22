import { requireSupabase } from "./client";
import {
  parseResourceGrantPermission,
  type ResourceGrantPermission,
} from "@/resources/model/kinds";
import type { ResourceGrantRecord } from "@/resources/model/access";

const GRANT_SELECT =
  "id, folder_id, item_id, grantee_user_id, permission" as const;

function toGrant(row: {
  id: number;
  folder_id: number | null;
  item_id: number | null;
  grantee_user_id: string;
  permission: string;
}): ResourceGrantRecord {
  return {
    id: row.id,
    folderId: row.folder_id,
    itemId: row.item_id,
    granteeUserId: row.grantee_user_id,
    permission: parseResourceGrantPermission(row.permission),
  };
}

export const resourceGrantQueryKeys = {
  mine: (organizationId: number, userId: string) =>
    ["org-resources", "grants", "mine", organizationId, userId] as const,
  folder: (folderId: number) => ["org-resources", "grants", "folder", folderId] as const,
  item: (itemId: number) => ["org-resources", "grants", "item", itemId] as const,
};

export async function listMyResourceGrants(
  organizationId: number,
  userId: string,
): Promise<ResourceGrantRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_grants")
    .select(GRANT_SELECT)
    .eq("organization_id", organizationId)
    .eq("grantee_user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toGrant);
}

export async function listFolderGrants(folderId: number): Promise<ResourceGrantRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_grants")
    .select(GRANT_SELECT)
    .eq("folder_id", folderId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toGrant);
}

export async function listItemGrants(itemId: number): Promise<ResourceGrantRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_grants")
    .select(GRANT_SELECT)
    .eq("item_id", itemId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toGrant);
}

export async function upsertResourceGrant(args: {
  organizationId: number;
  folderId?: number | null;
  itemId?: number | null;
  granteeUserId: string;
  permission: ResourceGrantPermission;
}): Promise<ResourceGrantRecord> {
  const existing =
    args.folderId != null
      ? (await listFolderGrants(args.folderId)).find(
          (grant) => grant.granteeUserId === args.granteeUserId,
        )
      : (await listItemGrants(args.itemId!)).find(
          (grant) => grant.granteeUserId === args.granteeUserId,
        );
  const db = requireSupabase();
  if (existing) {
    const { data, error } = await db
      .from("org_resource_grants")
      .update({ permission: args.permission })
      .eq("id", existing.id)
      .select(GRANT_SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("That person’s access couldn’t be saved.");
    return toGrant(data);
  }
  const { data, error } = await db
    .from("org_resource_grants")
    .insert({
      organization_id: args.organizationId,
      folder_id: args.folderId ?? null,
      item_id: args.itemId ?? null,
      grantee_user_id: args.granteeUserId,
      permission: args.permission,
    })
    .select(GRANT_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That person’s access couldn’t be saved.");
  return toGrant(data);
}

export async function deleteResourceGrant(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("org_resource_grants").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
