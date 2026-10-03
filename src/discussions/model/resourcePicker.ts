import type { ResourceItemType, ResourceVisibility } from "@/resources/model/kinds";
import { folderPathLabel } from "@/resources/model/tree";

export type ResourcePickerItem = {
  id: number;
  title: string;
  folderId: number | null;
  type: ResourceItemType;
  visibility: ResourceVisibility;
};

export type ResourcePickerFolder = {
  id: number;
  parentId: number | null;
  name: string;
};

export type ResourcePickerGroup = {
  folderId: number | null;
  folderTitle: string | null;
  items: ResourcePickerItem[];
};

export type ResourceFlatRow = {
  item: ResourcePickerItem;
  folderTitle: string | null;
};

export function groupResourcesForPicker(
  items: ResourcePickerItem[],
  folders: ResourcePickerFolder[],
): ResourcePickerGroup[] {
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const byFolder = new Map<number | null, ResourcePickerItem[]>();

  for (const item of items) {
    const list = byFolder.get(item.folderId) ?? [];
    list.push(item);
    byFolder.set(item.folderId, list);
  }

  const sortItems = (rows: ResourcePickerItem[]) =>
    [...rows].sort((left, right) => left.title.localeCompare(right.title));

  const groups: ResourcePickerGroup[] = [];
  const rootItems = byFolder.get(null);
  if (rootItems?.length) {
    groups.push({
      folderId: null,
      folderTitle: null,
      items: sortItems(rootItems),
    });
  }

  const folderIds = [...byFolder.keys()].filter(
    (folderId): folderId is number => folderId != null,
  );
  folderIds.sort((left, right) => {
    const leftPath = folderPathLabel(foldersById, left);
    const rightPath = folderPathLabel(foldersById, right);
    return leftPath.localeCompare(rightPath);
  });

  for (const folderId of folderIds) {
    const folderItems = byFolder.get(folderId);
    if (!folderItems?.length) continue;
    groups.push({
      folderId,
      folderTitle: folderPathLabel(foldersById, folderId),
      items: sortItems(folderItems),
    });
  }

  return groups;
}

export function filterResourcePickerGroups(
  groups: ResourcePickerGroup[],
  query: string,
): ResourcePickerGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;

  return groups
    .map((group) => {
      const folderMatch =
        group.folderTitle?.toLowerCase().includes(needle) ?? false;
      if (folderMatch) return group;
      return {
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(needle),
        ),
      };
    })
    .filter((group) => group.items.length > 0);
}

export function flattenResourcePickerGroups(
  groups: ResourcePickerGroup[],
): ResourceFlatRow[] {
  const rows: ResourceFlatRow[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      rows.push({ item, folderTitle: group.folderTitle });
    }
  }
  return rows;
}
