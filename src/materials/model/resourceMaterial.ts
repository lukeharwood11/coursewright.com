import type { MaterialKind } from "./kind";
import { resourceBrowsePath, resourceItemPath } from "@/resources/model/paths";

export function resourceMaterialHref(args: {
  orgSlug: string;
  kind: MaterialKind;
  resourceFolderId: number | null;
  resourceItemId: number | null;
}): string | null {
  if (args.kind !== "resource") return null;
  if (args.resourceFolderId != null) {
    return resourceBrowsePath(args.orgSlug, args.resourceFolderId);
  }
  if (args.resourceItemId != null) {
    return resourceItemPath(args.orgSlug, args.resourceItemId);
  }
  return null;
}

export function resourceMaterialTargetSets(
  materials: ReadonlyArray<{
    kind: MaterialKind;
    resourceFolderId: number | null;
    resourceItemId: number | null;
  }>,
): { folderIds: Set<number>; itemIds: Set<number> } {
  const folderIds = new Set<number>();
  const itemIds = new Set<number>();
  for (const material of materials) {
    if (material.kind !== "resource") continue;
    if (material.resourceFolderId != null) folderIds.add(material.resourceFolderId);
    if (material.resourceItemId != null) itemIds.add(material.resourceItemId);
  }
  return { folderIds, itemIds };
}
