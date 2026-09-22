import type { ResourceItemType } from "./kinds";

export type SelectedResourceFolder = {
  kind: "folder";
  id: number;
  parentId: number | null;
  aclInherit: boolean;
  canEdit: boolean;
};

export type SelectedResourceItem = {
  kind: "item";
  id: number;
  folderId: number | null;
  type: ResourceItemType;
  fileId: number | null;
  title: string;
  canEdit: boolean;
};

export type SelectedResource = SelectedResourceFolder | SelectedResourceItem;

export function selectionKey(row: { kind: "folder" | "item"; id: number }): string {
  return `${row.kind}:${row.id}`;
}

export function toggleSelection(
  rows: SelectedResource[],
  row: SelectedResource,
): SelectedResource[] {
  const key = selectionKey(row);
  if (rows.some((item) => selectionKey(item) === key)) {
    return rows.filter((item) => selectionKey(item) !== key);
  }
  return [...rows, row];
}

export function mergeSelection(
  rows: SelectedResource[],
  incoming: SelectedResource[],
  select: boolean,
): SelectedResource[] {
  const incomingKeys = new Set(incoming.map(selectionKey));
  if (!select) {
    return rows.filter((row) => !incomingKeys.has(selectionKey(row)));
  }
  const map = new Map(rows.map((row) => [selectionKey(row), row]));
  for (const row of incoming) map.set(selectionKey(row), row);
  return [...map.values()];
}

export function selectionActions(rows: SelectedResource[]) {
  const items = rows.filter((row): row is SelectedResourceItem => row.kind === "item");
  const everyEditable = rows.length > 0 && rows.every((row) => row.canEdit);
  const editableItems = items.filter((item) => item.canEdit);
  return {
    count: rows.length,
    canMove: everyEditable,
    canRemove: everyEditable,
    canPublish: editableItems.length > 0,
    printableIds: items.filter((item) => item.type !== "link").map((item) => item.id),
    files: items
      .filter(
        (item): item is SelectedResourceItem & { fileId: number } =>
          item.type === "file" && item.fileId != null,
      )
      .map((item) => ({ title: item.title, fileId: item.fileId })),
    folders: rows.filter(
      (row): row is SelectedResourceFolder => row.kind === "folder" && row.canEdit,
    ),
    editableItems,
  };
}
