import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  EyeSlashIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  GlobeAltIcon,
  LinkIcon,
  PencilSquareIcon,
  PrinterIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { ResourceFolderRecord } from "@/resources/databridge/folders";
import type { ResourceItemRecord } from "@/resources/databridge/items";
import { isPublishedResource } from "@/resources/model/kinds";
import type { ResourceTypeFilter } from "@/resources/model/paths";
import { resourceBrowsePath, resourceItemPath, resourceItemPrintPath } from "@/resources/model/paths";
import { selectionKey } from "@/resources/model/selection";
import type {
  FolderAclSource,
  ResourceActor,
  ResourceGrantRecord,
} from "@/resources/model/access";
import type { Rect } from "@/ui/AnchoredPopup";
import {
  ResourceContextMenu,
  pointRect,
  type ResourceMenuEntry,
} from "./ResourceContextMenu";
import { ResourceFolderBranch } from "./ResourceFolderBranch";
import { ResourceItemRow } from "./ResourceRows";

type FolderEntry = {
  folder: ResourceFolderRecord;
  canEdit: boolean;
};

type ItemEntry = {
  item: ResourceItemRecord;
  canEdit: boolean;
};

type RenameTarget = { kind: "folder" | "item"; id: number };

type MenuState = {
  rect: Rect | null;
  label: string;
  items: ResourceMenuEntry[];
};

const iconClass = "h-4 w-4";

export function ResourceBrowser({
  orgSlug,
  organizationId,
  folders,
  items,
  actor,
  grants,
  knownFolders,
  typeFilter,
  canEditHere,
  isStaff,
  renamePending,
  onRenameFolder,
  onRenameItem,
  onMoveFolder,
  onMoveItem,
  onAccessFolder,
  onAccessItem,
  onRemoveFolder,
  onRemoveItem,
  onPublish,
  onUnpublish,
  onDownload,
  onCreateFolder,
  onCreateDocument,
  onCreateLink,
  onUpload,
  selectedKeys,
  onToggleFolder,
  onToggleItem,
  onToggleAll,
}: {
  orgSlug: string;
  organizationId: number;
  folders: FolderEntry[];
  items: ItemEntry[];
  actor: ResourceActor;
  grants: ResourceGrantRecord[];
  knownFolders: Map<number, FolderAclSource>;
  typeFilter: ResourceTypeFilter;
  canEditHere: boolean;
  isStaff: boolean;
  renamePending: boolean;
  onRenameFolder: (id: number, name: string) => Promise<void>;
  onRenameItem: (id: number, title: string) => Promise<void>;
  onMoveFolder: (folder: ResourceFolderRecord) => void;
  onMoveItem: (item: ResourceItemRecord) => void;
  onAccessFolder: (folder: ResourceFolderRecord) => void;
  onAccessItem: (item: ResourceItemRecord) => void;
  onRemoveFolder: (folder: ResourceFolderRecord) => void;
  onRemoveItem: (item: ResourceItemRecord) => void;
  onPublish: (item: ResourceItemRecord) => void;
  onUnpublish: (item: ResourceItemRecord) => void;
  onDownload: (item: ResourceItemRecord) => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  onCreateLink: () => void;
  onUpload: () => void;
  selectedKeys: Set<string>;
  onToggleFolder: (folder: ResourceFolderRecord, canEdit: boolean) => void;
  onToggleItem: (item: ResourceItemRecord, canEdit: boolean) => void;
  onToggleAll: () => void;
}) {
  const navigate = useNavigate();
  const anchorRef = useRef<HTMLElement | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renaming, setRenaming] = useState<RenameTarget | null>(null);
  const empty = folders.length === 0 && items.length === 0;

  function closeMenu() {
    anchorRef.current = null;
    setMenu(null);
  }

  function createEntries(): ResourceMenuEntry[] {
    return [
      {
        id: "folder",
        label: "New folder",
        icon: <FolderPlusIcon className={iconClass} />,
        onSelect: onCreateFolder,
      },
      {
        id: "document",
        label: "New document",
        icon: <DocumentPlusIcon className={iconClass} />,
        onSelect: onCreateDocument,
      },
      {
        id: "link",
        label: "New link",
        icon: <LinkIcon className={iconClass} />,
        onSelect: onCreateLink,
      },
      {
        id: "upload",
        label: "Upload files",
        icon: <ArrowUpTrayIcon className={iconClass} />,
        onSelect: onUpload,
      },
    ];
  }

  function openMenu(
    anchor: { element?: HTMLElement; rect?: Rect },
    label: string,
    items: ResourceMenuEntry[],
  ) {
    if (anchor.element && menu && anchorRef.current === anchor.element) {
      closeMenu();
      return;
    }
    anchorRef.current = anchor.element ?? null;
    setMenu({ rect: anchor.rect ?? null, label, items });
  }

  function folderEntries(folder: ResourceFolderRecord): ResourceMenuEntry[] {
    const entries: ResourceMenuEntry[] = [
      {
        id: "open",
        label: "Open",
        icon: <FolderOpenIcon className={iconClass} />,
        onSelect: () => navigate(resourceBrowsePath(orgSlug, folder.id)),
      },
      {
        id: "rename",
        label: "Rename",
        icon: <PencilSquareIcon className={iconClass} />,
        onSelect: () => setRenaming({ kind: "folder", id: folder.id }),
      },
      {
        id: "move",
        label: "Move",
        icon: <ArrowRightIcon className={iconClass} />,
        onSelect: () => onMoveFolder(folder),
      },
    ];
    if (isStaff) {
      entries.push({
        id: "access",
        label: "Manage access",
        icon: <Cog6ToothIcon className={iconClass} />,
        onSelect: () => onAccessFolder(folder),
      });
    }
    entries.push({
      id: "remove",
      label: "Remove",
      icon: <TrashIcon className={iconClass} />,
      separatorBefore: true,
      onSelect: () => onRemoveFolder(folder),
    });
    return entries;
  }

  function itemEntries(item: ResourceItemRecord): ResourceMenuEntry[] {
    const entries: ResourceMenuEntry[] = [
      {
        id: "open",
        label: "Open",
        icon: <DocumentTextIcon className={iconClass} />,
        onSelect: () => navigate(resourceItemPath(orgSlug, item.id)),
      },
      {
        id: "rename",
        label: "Rename",
        icon: <PencilSquareIcon className={iconClass} />,
        onSelect: () => setRenaming({ kind: "item", id: item.id }),
      },
      {
        id: "move",
        label: "Move",
        icon: <ArrowRightIcon className={iconClass} />,
        onSelect: () => onMoveItem(item),
      },
    ];
    if (isStaff) {
      entries.push({
        id: "access",
        label: "Manage access",
        icon: <Cog6ToothIcon className={iconClass} />,
        onSelect: () => onAccessItem(item),
      });
    }
    entries.push({
      id: "visibility",
      label: isPublishedResource(item.visibility) ? "Unpublish" : "Publish",
      icon: isPublishedResource(item.visibility) ? (
        <EyeSlashIcon className={iconClass} />
      ) : (
        <GlobeAltIcon className={iconClass} />
      ),
      onSelect: () =>
        isPublishedResource(item.visibility) ? onUnpublish(item) : onPublish(item),
    });
    if (item.type !== "link") {
      entries.push({
        id: "print",
        label: "Print",
        icon: <PrinterIcon className={iconClass} />,
        onSelect: () => navigate(resourceItemPrintPath(orgSlug, item.id)),
      });
    }
    if (item.type === "file" && item.fileId != null) {
      entries.push({
        id: "download",
        label: "Download",
        icon: <ArrowDownTrayIcon className={iconClass} />,
        onSelect: () => onDownload(item),
      });
    }
    entries.push({
      id: "remove",
      label: "Remove",
      icon: <TrashIcon className={iconClass} />,
      separatorBefore: true,
      onSelect: () => onRemoveItem(item),
    });
    return entries;
  }

  function onRowContextMenu(
    event: MouseEvent,
    canEdit: boolean,
    label: string,
    entries: ResourceMenuEntry[],
  ) {
    if (!canEdit) return;
    event.preventDefault();
    event.stopPropagation();
    openMenu({ rect: pointRect(event.clientX, event.clientY) }, label, entries);
  }

  function onPaneContextMenu(event: MouseEvent) {
    if (!canEditHere) return;
    const target = event.target;
    if (target instanceof Element && target.closest("[data-resource-row]")) return;
    event.preventDefault();
    openMenu({ rect: pointRect(event.clientX, event.clientY) }, "Create", createEntries());
  }

  const topKeys = [
    ...folders.map(({ folder }) => selectionKey({ kind: "folder", id: folder.id })),
    ...items.map(({ item }) => selectionKey({ kind: "item", id: item.id })),
  ];
  const selectedTop = topKeys.filter((key) => selectedKeys.has(key)).length;
  const allSelected = topKeys.length > 0 && selectedTop === topKeys.length;
  const someSelected = selectedTop > 0 && !allSelected;

  return (
    <div
      className="flex min-h-[24rem] flex-1 flex-col overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
      onContextMenu={onPaneContextMenu}
    >
      {empty ? (
        <p className="flex flex-1 items-center justify-center px-4 py-16 text-center text-[14.5px] text-[var(--ink-soft)]">
          {typeFilter !== "all"
            ? "Nothing here matches that filter."
            : canEditHere
              ? "Nothing in this folder yet. Add a folder, or drop files here."
              : isStaff
                ? "Nothing in this folder yet."
                : "Nothing shared with you here yet."}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line-soft)]">
          <li className="flex items-center gap-2 px-2 py-2">
            <SelectAllCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={onToggleAll}
            />
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Select all</span>
          </li>
          {folders.map(({ folder, canEdit }) => (
            <ResourceFolderBranch
              key={`folder-${folder.id}`}
              orgSlug={orgSlug}
              organizationId={organizationId}
              folder={folder}
              canEdit={canEdit}
              typeFilter={typeFilter}
              actor={actor}
              grants={grants}
              knownFolders={knownFolders}
              renaming={renaming}
              renamePending={renamePending}
              onRenameFolder={(id, name) =>
                onRenameFolder(id, name).then(() => setRenaming(null))
              }
              onRenameItem={(id, title) =>
                onRenameItem(id, title).then(() => setRenaming(null))
              }
              onCancelRename={() => setRenaming(null)}
              onOpenMenu={(element, label, entries) => openMenu({ element }, label, entries)}
              onRowContextMenu={onRowContextMenu}
              buildFolderMenu={folderEntries}
              buildItemMenu={itemEntries}
              isSelected={(kind, id) => selectedKeys.has(selectionKey({ kind, id }))}
              onToggleFolder={onToggleFolder}
              onToggleItem={onToggleItem}
            />
          ))}
          {items.map(({ item, canEdit }) => (
            <li key={`item-${item.id}`}>
              <ResourceItemRow
                item={item}
                href={resourceItemPath(orgSlug, item.id)}
                canEdit={canEdit}
                renaming={renaming?.kind === "item" && renaming.id === item.id}
                renamePending={renamePending}
                selected={selectedKeys.has(selectionKey({ kind: "item", id: item.id }))}
                onToggleSelected={() => onToggleItem(item, canEdit)}
                onRename={(title) =>
                  onRenameItem(item.id, title).then(() => setRenaming(null))
                }
                onCancelRename={() => setRenaming(null)}
                onOpenMenu={(element) =>
                  openMenu({ element }, `${item.title} actions`, itemEntries(item))
                }
                onContextMenu={(event) =>
                  onRowContextMenu(
                    event,
                    canEdit,
                    `${item.title} actions`,
                    itemEntries(item),
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      {empty ? null : <div className="min-h-16 flex-1" />}
      <ResourceContextMenu
        open={menu != null}
        label={menu?.label ?? "Actions"}
        items={menu?.items ?? []}
        anchorRef={anchorRef}
        anchorRect={menu?.rect ?? null}
        onClose={closeMenu}
      />
    </div>
  );
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="ml-1 h-4 w-4 shrink-0 accent-[var(--green)]"
      checked={checked}
      aria-label="Select all"
      onChange={onChange}
    />
  );
}
