export function folderIdsInSubtree(
  folders: Array<{ id: number; parentId: number | null }>,
  rootId: number,
): Set<number> {
  const ids = new Set<number>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const folder of folders) {
      if (
        folder.parentId != null &&
        ids.has(folder.parentId) &&
        !ids.has(folder.id)
      ) {
        ids.add(folder.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function folderPathLabel(
  foldersById: Map<number, { id: number; parentId: number | null; name: string }>,
  folderId: number,
): string {
  const names: string[] = [];
  const seen = new Set<number>();
  let current = foldersById.get(folderId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parentId != null ? foldersById.get(current.parentId) : undefined;
  }
  return names.join(" / ");
}

export type FolderOutlineNode = {
  id: number;
  name: string;
  children: FolderOutlineNode[];
};

/** Nested folder tree for outline pickers, excluding `excluded` ids. */
export function buildFolderOutline(
  folders: Array<{ id: number; parentId: number | null; name: string }>,
  excluded: Set<number> = new Set(),
): FolderOutlineNode[] {
  const byParent = new Map<number | null, Array<{ id: number; name: string }>>();
  const ids = new Set<number>();

  for (const folder of folders) {
    if (excluded.has(folder.id)) continue;
    ids.add(folder.id);
    const siblings = byParent.get(folder.parentId) ?? [];
    siblings.push({ id: folder.id, name: folder.name });
    byParent.set(folder.parentId, siblings);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  function childrenOf(parentId: number | null): FolderOutlineNode[] {
    return (byParent.get(parentId) ?? []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      children: childrenOf(folder.id),
    }));
  }

  const roots = childrenOf(null);
  // Orphans whose parent is missing (e.g. filtered by ACL) still appear as roots.
  for (const folder of folders) {
    if (excluded.has(folder.id)) continue;
    if (folder.parentId == null) continue;
    if (ids.has(folder.parentId) && !excluded.has(folder.parentId)) continue;
    if (roots.some((node) => node.id === folder.id)) continue;
    roots.push({
      id: folder.id,
      name: folder.name,
      children: childrenOf(folder.id),
    });
  }
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
}

/** Ancestor folder ids from root down to (but not including) `folderId`. */
export function folderAncestorIds(
  foldersById: Map<number, { id: number; parentId: number | null }>,
  folderId: number,
): number[] {
  const trail: number[] = [];
  const seen = new Set<number>();
  let current = foldersById.get(folderId);
  while (current?.parentId != null && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    trail.unshift(current.parentId);
    current = foldersById.get(current.parentId);
  }
  return trail;
}
