import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import { parseBlockKind } from "@/materials/model/kind";
import type { PageBlockDraft } from "@/materials/model/pageContent";
import type { BlockRecord } from "@/materials/databridge/blocks";

const BLOCK_SELECT = "id, item_id, kind, body, position, file_id" as const;

export const resourceBlockQueryKeys = {
  list: (itemId: number) => ["org-resources", "blocks", itemId] as const,
};

function toBlock(row: {
  id: number;
  item_id: number;
  kind: string;
  body: unknown;
  position: number;
  file_id: number | null;
}): BlockRecord | null {
  const kind = parseBlockKind(row.kind);
  if (!kind || kind === "quiz") return null;
  return {
    id: row.id,
    materialId: row.item_id,
    kind,
    body: row.body,
    position: row.position,
    fileId: row.file_id,
  };
}

export async function listResourceBlocks(itemId: number): Promise<BlockRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_resource_blocks")
    .select(BLOCK_SELECT)
    .eq("item_id", itemId)
    .is("deleted_at", null)
    .order("position")
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const block = toBlock(row);
    return block ? [block] : [];
  });
}

export async function saveResourceDocument(args: {
  itemId: number;
  title?: string;
  description?: string;
  url?: string | null;
  blocks?: PageBlockDraft[];
}): Promise<void> {
  const db = requireSupabase();
  if (args.title != null || args.description !== undefined || args.url !== undefined) {
    const { error } = await db
      .from("org_resource_items")
      .update({
        ...(args.title != null ? { title: args.title.trim() } : {}),
        ...(args.description !== undefined ? { description: args.description } : {}),
        ...(args.url !== undefined ? { url: args.url } : {}),
      })
      .eq("id", args.itemId);
    if (error) throw new Error(error.message);
  }
  if (args.blocks === undefined) return;

  const existing = await listResourceBlocks(args.itemId);
  const keep = Math.min(existing.length, args.blocks.length);
  for (let index = 0; index < keep; index += 1) {
    const draft = args.blocks[index];
    const current = existing[index];
    if (current.kind === draft.kind) {
      const { error } = await db
        .from("org_resource_blocks")
        .update({
          body: draft.body as Json,
          position: draft.position,
          file_id: draft.fileId,
        })
        .eq("id", current.id);
      if (error) throw new Error(error.message);
      continue;
    }
    const { error: hideError } = await db
      .from("org_resource_blocks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", current.id);
    if (hideError) throw new Error(hideError.message);
    const { error: createError } = await db.from("org_resource_blocks").insert({
      item_id: args.itemId,
      kind: draft.kind,
      body: draft.body as Json,
      position: draft.position,
      file_id: draft.fileId,
    });
    if (createError) throw new Error(createError.message);
  }
  for (let index = keep; index < args.blocks.length; index += 1) {
    const draft = args.blocks[index];
    const { error } = await db.from("org_resource_blocks").insert({
      item_id: args.itemId,
      kind: draft.kind,
      body: draft.body as Json,
      position: draft.position,
      file_id: draft.fileId,
    });
    if (error) throw new Error(error.message);
  }
  for (let index = keep; index < existing.length; index += 1) {
    const { error } = await db
      .from("org_resource_blocks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", existing[index].id);
    if (error) throw new Error(error.message);
  }
}
