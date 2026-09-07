export const MATERIAL_VISIBILITIES = ["published", "unpublished"] as const;
export type MaterialVisibility = (typeof MATERIAL_VISIBILITIES)[number];

export function parseMaterialVisibility(value: string): MaterialVisibility {
  return value === "published" ? "published" : "unpublished";
}

export function isPublished(visibility: MaterialVisibility): boolean {
  return visibility === "published";
}

export function visibilityLabel(visibility: MaterialVisibility): string {
  return visibility === "published" ? "Published" : "Unpublished";
}
