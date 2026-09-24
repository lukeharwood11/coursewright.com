import type { BlockRecord } from "@/materials/databridge/blocks";
import { parseBlockKind, parseMaterialKind, type MaterialKind } from "./kind";

/** What the version-history dialog can show for one snapshot. */
export type MaterialVersionPreview = {
  title: string;
  description: string;
  url: string | null;
  kind: MaterialKind | null;
  fileId: number | null;
  scheduledDate: string | null;
  dueDate: string | null;
  blocks: BlockRecord[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/** Read placement + blocks from a `material_versions.snapshot` jsonb. */
export function previewFromMaterialSnapshot(
  snapshot: unknown,
): MaterialVersionPreview | null {
  const root = asRecord(snapshot);
  if (!root) return null;
  const material = asRecord(root.material);
  if (!material) return null;

  const materialId = numberOrNull(material.id) ?? 0;
  const kind =
    typeof material.kind === "string" ? parseMaterialKind(material.kind) : null;
  const blocksRaw = Array.isArray(root.blocks) ? root.blocks : [];
  const blocks = blocksRaw.flatMap((item, index): BlockRecord[] => {
    const row = asRecord(item);
    if (!row || typeof row.kind !== "string") return [];
    const blockKind = parseBlockKind(row.kind);
    if (!blockKind) return [];
    return [
      {
        id: numberOrNull(row.id) ?? index + 1,
        materialId: numberOrNull(row.material_id) ?? materialId,
        kind: blockKind,
        body: row.body ?? {},
        position: numberOrNull(row.position) ?? index,
        fileId: numberOrNull(row.file_id),
      },
    ];
  });

  return {
    title: typeof material.title === "string" ? material.title : "Untitled",
    description: typeof material.description === "string" ? material.description : "",
    url: stringOrNull(material.url),
    kind,
    fileId: numberOrNull(material.file_id),
    scheduledDate: stringOrNull(material.scheduled_date),
    dueDate: stringOrNull(material.due_date),
    blocks,
  };
}

export function materialChangeTypeLabel(changeType: string): string {
  if (changeType === "create") return "Created";
  if (changeType === "update") return "Updated";
  if (changeType === "delete") return "Removed";
  if (changeType === "restore") return "Restored";
  if (changeType === "sync") return "Synced";
  if (changeType === "promote") return "Promoted";
  if (changeType === "deprecate") return "Deprecated";
  return changeType;
}
