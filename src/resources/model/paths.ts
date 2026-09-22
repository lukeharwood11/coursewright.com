export function resourcesPath(orgSlug: string): string {
  return `/my/${orgSlug}/resources`;
}

export function resourceFolderPath(orgSlug: string, folderId: number): string {
  return `${resourcesPath(orgSlug)}/folders/${folderId}`;
}

export function resourceBrowsePath(orgSlug: string, folderId: number | null): string {
  return folderId == null ? resourcesPath(orgSlug) : resourceFolderPath(orgSlug, folderId);
}

export function resourceItemPath(orgSlug: string, itemId: number): string {
  return `${resourcesPath(orgSlug)}/items/${itemId}`;
}

export function resourceItemEditPath(orgSlug: string, itemId: number): string {
  return `${resourceItemPath(orgSlug, itemId)}/edit`;
}

export function resourceItemPrintPath(orgSlug: string, itemId: number): string {
  return `${resourceItemPath(orgSlug, itemId)}/print`;
}

export type ResourceTypeFilter = "all" | "document" | "file" | "link";

export function parseResourceTypeFilter(value: string | null): ResourceTypeFilter {
  if (value === "document" || value === "file" || value === "link") return value;
  return "all";
}

export function resourcesPathWithType(
  orgSlug: string,
  folderId: number | null,
  type: ResourceTypeFilter,
): string {
  const base = resourceBrowsePath(orgSlug, folderId);
  if (type === "all") return base;
  return `${base}?type=${type}`;
}
