import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";

export type ResourceVersionRecord = {
  version: number;
  changedAt: string;
  changeType: string;
  changedByName: string | null;
  snapshot: unknown;
};

export const resourceVersionQueryKeys = {
  list: (itemId: number) => ["org-resources", "versions", itemId] as const,
};

function embeddedName(
  value: { name: string | null } | { name: string | null }[] | null,
): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  const name = row?.name?.trim();
  return name ? name : null;
}

export async function listResourceVersions(itemId: number): Promise<ResourceVersionRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_versions")
    .select(
      "version, changed_at, change_type, snapshot, changer:profiles!org_resource_versions_changed_by_fkey(name)",
    )
    .eq("item_id", itemId)
    .order("version", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    version: row.version,
    changedAt: row.changed_at,
    changeType: row.change_type,
    changedByName: embeddedName(row.changer),
    snapshot: row.snapshot,
  }));
}

type SnapshotBlock = {
  kind: string;
  body: unknown;
  position: number;
  file_id: number | null;
};

function snapshotBlocks(snapshot: unknown): SnapshotBlock[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const blocks = (snapshot as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.kind !== "string") return [];
    return [
      {
        kind: row.kind,
        body: row.body ?? {},
        position: typeof row.position === "number" ? row.position : 0,
        file_id: typeof row.file_id === "number" ? row.file_id : null,
      },
    ];
  });
}

function snapshotItem(snapshot: unknown): Record<string, unknown> | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const item = (snapshot as { item?: unknown }).item;
  if (!item || typeof item !== "object") return null;
  return item as Record<string, unknown>;
}

export async function revertResourceToVersion(
  itemId: number,
  snapshot: unknown,
): Promise<void> {
  const item = snapshotItem(snapshot);
  if (!item) throw new Error("That version doesn’t have a snapshot we can restore.");

  const db = requireSupabase();
  const { error: updateError } = await db
    .from("org_resource_items")
    .update({
      title: typeof item.title === "string" ? item.title : undefined,
      description:
        typeof item.description === "string" ? item.description : undefined,
      url: typeof item.url === "string" ? item.url : null,
      file_id: typeof item.file_id === "number" ? item.file_id : null,
      archived_at: null,
    })
    .eq("id", itemId);
  if (updateError) throw new Error(updateError.message);

  const { error: hideError } = await db
    .from("org_resource_blocks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("item_id", itemId)
    .is("deleted_at", null);
  if (hideError) throw new Error(hideError.message);

  const blocks = snapshotBlocks(snapshot);
  if (blocks.length === 0) return;

  const { error: insertError } = await db.from("org_resource_blocks").insert(
    blocks.map((block) => ({
      item_id: itemId,
      kind: block.kind,
      body: block.body as Json,
      position: block.position,
      file_id: block.file_id,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}
