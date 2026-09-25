import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  HomeIcon,
  LinkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import {
  listChildFolders,
  listOrgResourceFolders,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import {
  listOrgResourceItems,
  listResourceItems,
  resourceItemQueryKeys,
} from "@/resources/databridge/items";
import type { ResourceItemRecord } from "@/resources/databridge/items";
import type { ResourceFolderRecord } from "@/resources/databridge/folders";
import type { ResourceItemType } from "@/resources/model/kinds";
import { folderPathLabel } from "@/resources/model/tree";
import type { CourseResourceLinkRecord } from "@/courses/databridge/courseResourceLinks";

function itemIcon(type: ResourceItemType) {
  if (type === "document") return DocumentTextIcon;
  if (type === "link") return LinkIcon;
  return PaperClipIcon;
}

function LinkAction({
  linked,
  pending,
  onLink,
  label,
}: {
  linked: boolean;
  pending: boolean;
  onLink: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending || linked}
      className="shrink-0 !px-2.5 !py-1 text-[12px]"
      onClick={onLink}
    >
      {linked ? "Linked" : label}
    </Button>
  );
}

function ResourcePickerItemRow({
  item,
  linked,
  pending,
  onLink,
  path,
}: {
  item: ResourceItemRecord;
  linked: boolean;
  pending: boolean;
  onLink: () => void;
  path?: string;
}) {
  const Icon = itemIcon(item.type);
  return (
    <div className="flex min-w-0 items-center gap-2 px-1.5 py-1.5">
      <Icon className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-[var(--ink)]">
          {item.title}
        </span>
        {path ? (
          <span className="block truncate text-[12px] text-[var(--ink-faint)]">
            {path}
          </span>
        ) : null}
      </span>
      <LinkAction linked={linked} pending={pending} onLink={onLink} label="Link" />
    </div>
  );
}

function ResourcePickerFolderBranch({
  folder,
  organizationId,
  linkedFolderIds,
  linkedItemIds,
  pending,
  onLinkFolder,
  onLinkItem,
}: {
  folder: ResourceFolderRecord;
  organizationId: number;
  linkedFolderIds: Set<number>;
  linkedItemIds: Set<number>;
  pending: boolean;
  onLinkFolder: (folderId: number) => void;
  onLinkItem: (itemId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const Folder = open ? FolderOpenIcon : FolderIcon;
  const folderLinked = linkedFolderIds.has(folder.id);

  const childrenQuery = useQuery({
    queryKey: resourceFolderQueryKeys.children(organizationId, folder.id),
    queryFn: () =>
      listChildFolders({ organizationId, parentId: folder.id }),
    enabled: open,
  });
  const itemsQuery = useQuery({
    queryKey: resourceItemQueryKeys.list(organizationId, folder.id),
    queryFn: () =>
      listResourceItems({ organizationId, folderId: folder.id }),
    enabled: open,
  });

  const childFolders = childrenQuery.data ?? [];
  const childItems = itemsQuery.data ?? [];
  const loading = open && (childrenQuery.isLoading || itemsQuery.isLoading);

  return (
    <li>
      <div className="flex min-w-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
          aria-expanded={open}
          aria-label={open ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          )}
        </button>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1.5 text-[13.5px] font-bold text-[var(--ink)]">
          <Folder className="h-4 w-4 shrink-0 text-[var(--green)]" aria-hidden />
          <span className="min-w-0 truncate">{folder.name}</span>
        </span>
        <LinkAction
          linked={folderLinked}
          pending={pending}
          onLink={() => onLinkFolder(folder.id)}
          label="Link folder"
        />
      </div>
      {open ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {loading ? (
            <li className="px-1.5 py-1.5 text-[13px] text-[var(--ink-faint)]">
              Loading…
            </li>
          ) : null}
          {childFolders.map((child) => (
            <ResourcePickerFolderBranch
              key={child.id}
              folder={child}
              organizationId={organizationId}
              linkedFolderIds={linkedFolderIds}
              linkedItemIds={linkedItemIds}
              pending={pending}
              onLinkFolder={onLinkFolder}
              onLinkItem={onLinkItem}
            />
          ))}
          {childItems.map((item) => (
            <li key={item.id}>
              <ResourcePickerItemRow
                item={item}
                linked={linkedItemIds.has(item.id)}
                pending={pending}
                onLink={() => onLinkItem(item.id)}
              />
            </li>
          ))}
          {!loading &&
          childFolders.length === 0 &&
          childItems.length === 0 ? (
            <li className="px-1.5 py-1.5 text-[13px] text-[var(--ink-faint)]">
              Empty
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

function ResourcePickerTree({
  organizationId,
  linkedFolderIds,
  linkedItemIds,
  pending,
  onLinkFolder,
  onLinkItem,
}: {
  organizationId: number;
  linkedFolderIds: Set<number>;
  linkedItemIds: Set<number>;
  pending: boolean;
  onLinkFolder: (folderId: number) => void;
  onLinkItem: (itemId: number) => void;
}) {
  const [open, setOpen] = useState(true);

  const rootFoldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.children(organizationId, null),
    queryFn: () => listChildFolders({ organizationId, parentId: null }),
  });
  const rootItemsQuery = useQuery({
    queryKey: resourceItemQueryKeys.list(organizationId, null),
    queryFn: () => listResourceItems({ organizationId, folderId: null }),
  });

  const rootFolders = rootFoldersQuery.data ?? [];
  const rootItems = rootItemsQuery.data ?? [];
  const loading = rootFoldersQuery.isLoading || rootItemsQuery.isLoading;

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Resources">
      <li>
        <div className="flex min-w-0 items-center gap-0.5">
          <button
            type="button"
            className="rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
            aria-expanded={open}
            aria-label={open ? "Collapse Resources" : "Expand Resources"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? (
              <ChevronDownIcon className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            )}
          </button>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1.5 text-[13.5px] font-bold text-[var(--ink)]">
            <HomeIcon className="h-4 w-4 shrink-0 text-[var(--green)]" aria-hidden />
            <span>Resources</span>
          </span>
        </div>
        {open ? (
          <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
            {loading ? (
              <li className="px-1.5 py-1.5 text-[13px] text-[var(--ink-faint)]">
                Loading…
              </li>
            ) : null}
            {rootFolders.map((folder) => (
              <ResourcePickerFolderBranch
                key={folder.id}
                folder={folder}
                organizationId={organizationId}
                linkedFolderIds={linkedFolderIds}
                linkedItemIds={linkedItemIds}
                pending={pending}
                onLinkFolder={onLinkFolder}
                onLinkItem={onLinkItem}
              />
            ))}
            {rootItems.map((item) => (
              <li key={item.id}>
                <ResourcePickerItemRow
                  item={item}
                  linked={linkedItemIds.has(item.id)}
                  pending={pending}
                  onLink={() => onLinkItem(item.id)}
                />
              </li>
            ))}
            {!loading &&
            rootFolders.length === 0 &&
            rootItems.length === 0 ? (
              <li className="px-1.5 py-1.5 text-[13px] text-[var(--ink-faint)]">
                Nothing in Resources yet.
              </li>
            ) : null}
          </ul>
        ) : null}
      </li>
    </ul>
  );
}

function ResourcePickerSearchResults({
  organizationId,
  query,
  linkedFolderIds,
  linkedItemIds,
  pending,
  onLinkFolder,
  onLinkItem,
}: {
  organizationId: number;
  query: string;
  linkedFolderIds: Set<number>;
  linkedItemIds: Set<number>;
  pending: boolean;
  onLinkFolder: (folderId: number) => void;
  onLinkItem: (itemId: number) => void;
}) {
  const foldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.all(organizationId),
    queryFn: () => listOrgResourceFolders(organizationId),
  });
  const itemsQuery = useQuery({
    queryKey: resourceItemQueryKeys.visible(organizationId),
    queryFn: () => listOrgResourceItems(organizationId),
  });

  const normalized = query.trim().toLowerCase();
  const foldersById = useMemo(() => {
    const map = new Map<number, ResourceFolderRecord>();
    for (const folder of foldersQuery.data ?? []) map.set(folder.id, folder);
    return map;
  }, [foldersQuery.data]);

  const matchingFolders = useMemo(() => {
    if (!normalized) return [];
    return (foldersQuery.data ?? []).filter((folder) =>
      folder.name.toLowerCase().includes(normalized),
    );
  }, [foldersQuery.data, normalized]);

  const matchingItems = useMemo(() => {
    if (!normalized) return [];
    return (itemsQuery.data ?? []).filter((item) =>
      item.title.toLowerCase().includes(normalized),
    );
  }, [itemsQuery.data, normalized]);

  if (foldersQuery.isLoading || itemsQuery.isLoading) {
    return (
      <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">Loading…</p>
    );
  }

  if (matchingFolders.length === 0 && matchingItems.length === 0) {
    return (
      <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
        No folders or resources match that search.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Search results">
      {matchingFolders.map((folder) => (
        <li key={`folder-${folder.id}`}>
          <div className="flex min-w-0 items-center gap-2 px-1.5 py-1.5">
            <FolderIcon
              className="h-4 w-4 shrink-0 text-[var(--green)]"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-[var(--ink)]">
                {folder.name}
              </span>
              <span className="block truncate text-[12px] text-[var(--ink-faint)]">
                {folderPathLabel(foldersById, folder.id)}
              </span>
            </span>
            <LinkAction
              linked={linkedFolderIds.has(folder.id)}
              pending={pending}
              onLink={() => onLinkFolder(folder.id)}
              label="Link folder"
            />
          </div>
        </li>
      ))}
      {matchingItems.map((item) => (
        <li key={`item-${item.id}`}>
          <ResourcePickerItemRow
            item={item}
            linked={linkedItemIds.has(item.id)}
            pending={pending}
            onLink={() => onLinkItem(item.id)}
            path={
              item.folderId != null
                ? folderPathLabel(foldersById, item.folderId)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function LinkResourceDialog({
  open,
  organizationId,
  linkedFolderIds,
  linkedItemIds,
  onClose,
  onLinkFolder,
  onLinkItem,
  pending,
  error,
}: {
  open: boolean;
  organizationId: number;
  linkedFolderIds: Set<number>;
  linkedItemIds: Set<number>;
  onClose: () => void;
  onLinkFolder: (folderId: number) => void;
  onLinkItem: (itemId: number) => void;
  pending: boolean;
  error: string | null;
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useToastOnError(open ? error : null);

  if (!open) return null;

  const searching = query.trim().length > 0;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[min(40rem,90vh)] w-full max-w-lg flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <div className="shrink-0">
          <h2
            id={titleId}
            className="text-[20px] font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Link resource
          </h2>
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
            Choose a folder or item from your organization&apos;s Resources library.
          </p>
        </div>
        <label className="mt-4 flex shrink-0 flex-col gap-1">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
            Search
          </span>
          <Input
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by folder or resource…"
            aria-label="Filter resources"
            autoFocus
          />
        </label>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] p-2">
          {searching ? (
            <ResourcePickerSearchResults
              organizationId={organizationId}
              query={query}
              linkedFolderIds={linkedFolderIds}
              linkedItemIds={linkedItemIds}
              pending={pending}
              onLinkFolder={onLinkFolder}
              onLinkItem={onLinkItem}
            />
          ) : (
            <ResourcePickerTree
              organizationId={organizationId}
              linkedFolderIds={linkedFolderIds}
              linkedItemIds={linkedItemIds}
              pending={pending}
              onLinkFolder={onLinkFolder}
              onLinkItem={onLinkItem}
            />
          )}
        </div>
        <div className="mt-5 flex shrink-0 justify-end">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function linkedResourceIdSets(links: CourseResourceLinkRecord[]) {
  const folderIds = new Set<number>();
  const itemIds = new Set<number>();
  for (const link of links) {
    if (link.folderId != null) folderIds.add(link.folderId);
    if (link.itemId != null) itemIds.add(link.itemId);
  }
  return { folderIds, itemIds };
}
