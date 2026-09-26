import type { BlockRecord } from "@/materials/databridge/blocks";
import { parseBlockKind } from "@/materials/model/kind";
import type { MaterialKind } from "@/materials/model/kind";
import {
  materialChangeTypeLabel,
  type MaterialVersionPreview,
} from "@/materials/model/versionSnapshot";
import { parseResourceItemType } from "@/resources/model/kinds";

export { materialChangeTypeLabel as resourceChangeTypeLabel };

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

function resourceTypeToKind(type: string | null): MaterialKind | null {
  if (type === "document") return "page";
  if (type === "link") return "link";
  if (type === "file") return "file";
  return null;
}

/** Read placement + blocks from an `org_resource_versions.snapshot` jsonb. */
export function previewFromResourceSnapshot(
  snapshot: unknown,
): MaterialVersionPreview | null {
  const root = asRecord(snapshot);
  if (!root) return null;
  const item = asRecord(root.item);
  if (!item) return null;

  const itemId = numberOrNull(item.id) ?? 0;
  const parsedType =
    typeof item.type === "string" ? parseResourceItemType(item.type) : null;
  const kind = resourceTypeToKind(parsedType);

  const blocksRaw = Array.isArray(root.blocks) ? root.blocks : [];
  const blocks = blocksRaw.flatMap((row, index): BlockRecord[] => {
    const block = asRecord(row);
    if (!block || typeof block.kind !== "string") return [];
    const blockKind = parseBlockKind(block.kind);
    if (!blockKind) return [];
    return [
      {
        id: numberOrNull(block.id) ?? index + 1,
        materialId: itemId,
        kind: blockKind,
        body: block.body ?? {},
        position: numberOrNull(block.position) ?? index,
        fileId: numberOrNull(block.file_id),
      },
    ];
  });

  return {
    title: typeof item.title === "string" ? item.title : "Untitled",
    description: typeof item.description === "string" ? item.description : "",
    url: stringOrNull(item.url),
    kind,
    fileId: numberOrNull(item.file_id),
    scheduledDate: null,
    dueDate: null,
    blocks,
  };
}
