import { useState, type MouseEvent } from "react";
import type { ResourceFolderRecord } from "@/resources/databridge/folders";
import type { ResourceItemRecord } from "@/resources/databridge/items";
import type {
  FolderAclSource,
  ResourceActor,
  ResourceGrantRecord,
} from "@/resources/model/access";
import type { ResourceTypeFilter } from "@/resources/model/paths";
import { resourceBrowsePath, resourceItemPath } from "@/resources/model/paths";
import { useExpandedResourceFolder } from "../hooks/useExpandedResourceFolder";
import type { ResourceMenuEntry } from "./ResourceContextMenu";
import { ResourceFolderRow, ResourceItemRow } from "./ResourceRows";

type RenameTarget = { kind: "folder" | "item"; id: number };

export function ResourceFolderBranch({
  orgSlug,
  organizationId,
  folder,
  canEdit,
  typeFilter,
  actor,
  grants,
  knownFolders,
  renaming,
  renamePending,
  onRenameFolder,
  onRenameItem,
  onCancelRename,
  onOpenMenu,
  onRowContextMenu,
  buildFolderMenu,
  buildItemMenu,
}: {
  orgSlug: string;
  organizationId: number;
  folder: ResourceFolderRecord;
  canEdit: boolean;
  typeFilter: ResourceTypeFilter;
  actor: ResourceActor;
  grants: ResourceGrantRecord[];
  knownFolders: Map<number, FolderAclSource>;
  renaming: RenameTarget | null;
  renamePending: boolean;
  onRenameFolder: (id: number, name: string) => Promise<void>;
  onRenameItem: (id: number, title: string) => Promise<void>;
  onCancelRename: () => void;
  onOpenMenu: (element: HTMLElement, label: string, items: ResourceMenuEntry[]) => void;
  onRowContextMenu: (
    event: MouseEvent,
    canEdit: boolean,
    label: string,
    entries: ResourceMenuEntry[],
  ) => void;
  buildFolderMenu: (folder: ResourceFolderRecord) => ResourceMenuEntry[];
  buildItemMenu: (item: ResourceItemRecord) => ResourceMenuEntry[];
}) {
  const [expanded, setExpanded] = useState(false);
  const contents = useExpandedResourceFolder({
    organizationId,
    folder,
    enabled: expanded,
    typeFilter,
    actor,
    grants,
    knownFolders,
  });
  const empty = contents.folders.length === 0 && contents.items.length === 0;

  return (
    <li>
      <ResourceFolderRow
        name={folder.name}
        href={resourceBrowsePath(orgSlug, folder.id)}
        creatorName={folder.creatorName}
        createdAt={folder.createdAt}
        updatedAt={folder.updatedAt}
        expanded={expanded}
        canEdit={canEdit}
        renaming={renaming?.kind === "folder" && renaming.id === folder.id}
        renamePending={renamePending}
        onToggle={() => setExpanded((open) => !open)}
        onRename={(name) => onRenameFolder(folder.id, name)}
        onCancelRename={onCancelRename}
        onOpenMenu={(element) =>
          onOpenMenu(element, `${folder.name} actions`, buildFolderMenu(folder))
        }
        onContextMenu={(event) =>
          onRowContextMenu(event, canEdit, `${folder.name} actions`, buildFolderMenu(folder))
        }
      />
      {expanded ? (
        <ul className="ml-6 border-l border-[var(--line-soft)] py-1 pl-2">
          {contents.loading ? (
            <li className="px-2 py-1.5 text-[13px] text-[var(--ink-faint)]">Loading…</li>
          ) : contents.error ? (
            <li className="px-2 py-1.5 text-[13px] text-[var(--amber-deep)]">
              Couldn’t load this folder.
            </li>
          ) : empty ? (
            <li className="px-2 py-1.5 text-[13px] text-[var(--ink-faint)]">Empty</li>
          ) : (
            <>
              {contents.folders.map(({ folder: child, canEdit: childCanEdit }) => (
                <ResourceFolderBranch
                  key={`folder-${child.id}`}
                  orgSlug={orgSlug}
                  organizationId={organizationId}
                  folder={child}
                  canEdit={childCanEdit}
                  typeFilter={typeFilter}
                  actor={actor}
                  grants={grants}
                  knownFolders={contents.foldersById}
                  renaming={renaming}
                  renamePending={renamePending}
                  onRenameFolder={onRenameFolder}
                  onRenameItem={onRenameItem}
                  onCancelRename={onCancelRename}
                  onOpenMenu={onOpenMenu}
                  onRowContextMenu={onRowContextMenu}
                  buildFolderMenu={buildFolderMenu}
                  buildItemMenu={buildItemMenu}
                />
              ))}
              {contents.items.map(({ item, canEdit: itemCanEdit }) => (
                <li key={`item-${item.id}`}>
                  <ResourceItemRow
                    item={item}
                    href={resourceItemPath(orgSlug, item.id)}
                    canEdit={itemCanEdit}
                    renaming={renaming?.kind === "item" && renaming.id === item.id}
                    renamePending={renamePending}
                    onRename={(title) => onRenameItem(item.id, title)}
                    onCancelRename={onCancelRename}
                    onOpenMenu={(element) =>
                      onOpenMenu(element, `${item.title} actions`, buildItemMenu(item))
                    }
                    onContextMenu={(event) =>
                      onRowContextMenu(
                        event,
                        itemCanEdit,
                        `${item.title} actions`,
                        buildItemMenu(item),
                      )
                    }
                  />
                </li>
              ))}
            </>
          )}
        </ul>
      ) : null}
    </li>
  );
}
