import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import {
  createBlock,
  listBlocks,
  softDeleteBlock,
  updateBlock,
} from "./blocks";
import { getMaterial, updateMaterial } from "./materials";
import type { PageBlockDraft } from "@/materials/model/pageContent";

export type MaterialPagePlacement = {
  title: string;
  description: string;
  url: string | null;
  scheduledDate: string | null;
};

export async function saveMaterialPage(args: {
  materialId: number;
  placement?: MaterialPagePlacement;
  blocks?: PageBlockDraft[];
}): Promise<number> {
  if (!args.placement && args.blocks === undefined) {
    throw new Error("Nothing to save.");
  }
  const db = requireSupabase();
  const { data, error } = await db.rpc("save_material_page", {
    p_material_id: args.materialId,
    p_placement: args.placement
      ? {
          title: args.placement.title,
          description: args.placement.description,
          url: args.placement.url,
          scheduled_date: args.placement.scheduledDate,
        }
      : null,
    p_blocks:
      args.blocks === undefined
        ? null
        : (args.blocks.map((block) => ({
            kind: block.kind,
            body: block.body as Json,
            position: block.position,
            file_id: block.fileId,
          })) as Json),
  });
  if (!error) {
    return typeof data === "number" ? data : 0;
  }
  if (!isMissingSaveRpc(error)) {
    throw new Error(error.message);
  }
  return saveMaterialPageFallback(args);
}

function isMissingSaveRpc(error: { code?: string; message: string }): boolean {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();
  return (
    code === "PGRST202" ||
    code === "42883" ||
    message.includes("could not find the function") ||
    (message.includes("save_material_page") && message.includes("does not exist"))
  );
}

async function saveMaterialPageFallback(args: {
  materialId: number;
  placement?: MaterialPagePlacement;
  blocks?: PageBlockDraft[];
}): Promise<number> {
  if (args.placement) {
    await updateMaterial(args.materialId, {
      title: args.placement.title,
      description: args.placement.description,
      url: args.placement.url,
      scheduledDate: args.placement.scheduledDate,
    });
  }
  if (args.blocks !== undefined) {
    const existing = await listBlocks(args.materialId);
    const keep = Math.min(existing.length, args.blocks.length);
    for (let index = 0; index < keep; index += 1) {
      const draft = args.blocks[index];
      const current = existing[index];
      if (current.kind === draft.kind) {
        await updateBlock(current.id, {
          body: draft.body as Json,
          position: draft.position,
        });
        continue;
      }
      await softDeleteBlock(current.id);
      const created = await createBlock({
        materialId: args.materialId,
        kind: draft.kind,
        body: draft.body as Json,
      });
      await updateBlock(created.id, { position: draft.position });
    }
    for (let index = keep; index < args.blocks.length; index += 1) {
      const draft = args.blocks[index];
      const created = await createBlock({
        materialId: args.materialId,
        kind: draft.kind,
        body: draft.body as Json,
      });
      await updateBlock(created.id, { position: draft.position });
    }
    for (let index = keep; index < existing.length; index += 1) {
      await softDeleteBlock(existing[index].id);
    }
  }
  const material = await getMaterial(args.materialId);
  return material?.currentVersion ?? 0;
}
