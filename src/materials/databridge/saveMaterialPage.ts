import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
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
  if (error) throw new Error(error.message);
  return typeof data === "number" ? data : 0;
}
