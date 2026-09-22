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
