export const RESOURCE_ITEM_TYPES = ["document", "link", "file"] as const;
export type ResourceItemType = (typeof RESOURCE_ITEM_TYPES)[number];

export const RESOURCE_ACCESS_MODES = ["staff", "parents", "members", "restricted"] as const;
export type ResourceAccessMode = (typeof RESOURCE_ACCESS_MODES)[number];

export const RESOURCE_VISIBILITIES = ["unpublished", "published"] as const;
export type ResourceVisibility = (typeof RESOURCE_VISIBILITIES)[number];

export const RESOURCE_GRANT_PERMISSIONS = ["read", "write"] as const;
export type ResourceGrantPermission = (typeof RESOURCE_GRANT_PERMISSIONS)[number];

export function parseResourceItemType(value: string): ResourceItemType | null {
  return RESOURCE_ITEM_TYPES.includes(value as ResourceItemType)
    ? (value as ResourceItemType)
    : null;
}

export function parseResourceAccessMode(value: string): ResourceAccessMode {
  return RESOURCE_ACCESS_MODES.includes(value as ResourceAccessMode)
    ? (value as ResourceAccessMode)
    : "staff";
}

export function parseResourceVisibility(value: string): ResourceVisibility {
  return value === "published" ? "published" : "unpublished";
}

export function parseResourceGrantPermission(value: string): ResourceGrantPermission {
  return value === "write" ? "write" : "read";
}

export function resourceItemTypeLabel(type: ResourceItemType): string {
  if (type === "document") return "Document";
  if (type === "link") return "Link";
  return "File";
}

export function resourceAccessModeLabel(mode: ResourceAccessMode): string {
  if (mode === "staff") return "Staff only";
  if (mode === "parents") return "All parents";
  if (mode === "members") return "Everyone in the organization";
  return "Specific people";
}

export function isPublishedResource(visibility: ResourceVisibility): boolean {
  return visibility === "published";
}

export function titleFromFilename(filename: string): string {
  const trimmed = filename.trim() || "File";
  return trimmed.slice(0, 300);
}
