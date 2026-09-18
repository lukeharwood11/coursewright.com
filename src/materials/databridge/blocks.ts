import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import { nextPosition } from "@/units/model/order";
import { parseBlockKind, type BlockKind } from "@/materials/model/kind";

export type BlockRecord = {
  id: number;
  materialId: number;
  kind: BlockKind;
  body: unknown;
  position: number;
  fileId: number | null;
};

export const blockQueryKeys = {
  list: (materialId: number) => ["blocks", "list", materialId] as const,
};

export async function listBlocks(materialId: number): Promise<BlockRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("blocks")
    .select("id, material_id, kind, body, position, file_id")
    .eq("material_id", materialId)
    .is("deleted_at", null)
    .order("position")
    .order("id");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const kind = parseBlockKind(row.kind);
    if (!kind) return [];
    return [
      {
        id: row.id,
        materialId: row.material_id,
        kind,
        body: row.body,
        position: row.position,
        fileId: row.file_id,
      },
    ];
  });
}

export async function createBlock(args: {
  materialId: number;
  kind: BlockKind;
  body: Json;
}): Promise<BlockRecord> {
  const existing = await listBlocks(args.materialId);
  const db = requireSupabase();
  const { data, error } = await db
    .from("blocks")
    .insert({
      material_id: args.materialId,
      kind: args.kind,
      body: args.body,
      position: nextPosition(existing.map((block) => block.position)),
    })
    .select("id, material_id, kind, body, position, file_id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("The block was added but couldn’t be opened yet.");
  const kind = parseBlockKind(data.kind);
  if (!kind) throw new Error("Unexpected block kind.");
  return {
    id: data.id,
    materialId: data.material_id,
    kind,
    body: data.body,
    position: data.position,
    fileId: data.file_id,
  };
}

export async function updateBlock(
  id: number,
  patch: { body?: Json; position?: number; deletedAt?: string | null },
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("blocks")
    .update({
      body: patch.body,
      position: patch.position,
      deleted_at: patch.deletedAt,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteBlock(id: number): Promise<void> {
  await updateBlock(id, { deletedAt: new Date().toISOString() });
}
