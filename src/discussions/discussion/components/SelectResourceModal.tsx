import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import {
  PickerPaginationBar,
  pickerModalListScrollClass,
  pickerModalListShellClass,
  pickerModalPagerSlotClass,
  slicePickerPage,
} from "@/ui/PickerPagination";
import {
  filterResourcePickerGroups,
  flattenResourcePickerGroups,
  groupResourcesForPicker,
  type ResourcePickerFolder,
  type ResourcePickerItem,
} from "@/discussions/model/resourcePicker";
import type { ResourceItemType } from "@/resources/model/kinds";

function ResourceKindIcon({ type }: { type: ResourceItemType }) {
  const Icon =
    type === "link"
      ? LinkIcon
      : type === "file"
        ? DocumentIcon
        : DocumentTextIcon;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" aria-hidden />;
}

function ResourceRow({
  item,
  checked,
  onToggle,
  folderTitle,
}: {
  item: ResourcePickerItem;
  checked: boolean;
  onToggle: (itemId: number) => void;
  folderTitle?: string | null;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-[4px] px-1.5 py-1.5 hover:bg-[var(--green-tint)]">
      <input
        type="radio"
        className="mt-0.5"
        name="resource-picker"
        checked={checked}
        onChange={() => onToggle(item.id)}
      />
      <ResourceKindIcon type={item.type} />
      <span className="min-w-0">
        {folderTitle ? (
          <span className="block text-[11.5px] font-bold text-[var(--ink-faint)]">
            {folderTitle}
          </span>
        ) : null}
        <span className="block text-[13.5px] font-semibold text-[var(--ink)]">
          {item.title}
        </span>
        {item.visibility !== "published" ? (
          <span className="text-[12px] font-bold text-[var(--amber-deep)]">
            Unpublished
          </span>
        ) : null}
      </span>
    </label>
  );
}

function FolderBranch({
  folderTitle,
  items,
  selectedId,
  onToggle,
}: {
  folderTitle: string;
  items: ResourcePickerItem[];
  selectedId: number | null;
  onToggle: (itemId: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const Folder = open ? FolderOpenIcon : FolderIcon;

  return (
    <li>
      <div className="flex min-w-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
          aria-expanded={open}
          aria-label={open ? `Collapse ${folderTitle}` : `Expand ${folderTitle}`}
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
          <span className="min-w-0 truncate">{folderTitle}</span>
        </span>
      </div>
      {open ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {items.map((item) => (
            <li key={item.id}>
              <ResourceRow
                item={item}
                checked={selectedId === item.id}
                onToggle={onToggle}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function SelectResourceModal({
  open,
  items,
  folders,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
}: {
  open: boolean;
  items: ResourcePickerItem[];
  folders: ResourcePickerFolder[];
  selectedId: number | null;
  onSelect: (itemId: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const baseGroups = useMemo(
    () => groupResourcesForPicker(items, folders),
    [items, folders],
  );

  const getFilteredGroups = useCallback(
    (needle: string) => filterResourcePickerGroups(baseGroups, needle),
    [baseGroups],
  );

  const filteredGroups = useMemo(
    () => getFilteredGroups(query),
    [getFilteredGroups, query],
  );
  const flatRows = useMemo(
    () => flattenResourcePickerGroups(filteredGroups),
    [filteredGroups],
  );
  const paged = useMemo(() => slicePickerPage(flatRows, page), [flatRows, page]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPage(1);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > paged.pageCount) setPage(paged.pageCount);
  }, [page, paged.pageCount]);

  if (!open) return null;

  const showGrouped = !paged.needsPagination;

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
        className="relative flex max-h-[min(40rem,90vh)] w-full max-w-lg flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[20px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add a resource
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Link a document, file, or link from your organization&apos;s Resources.
        </p>
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">Search</span>
          <Input
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by resource or folder…"
            aria-label="Filter resources"
            autoFocus
          />
        </label>
        <div className={`mt-3 ${pickerModalListShellClass}`}>
          <div className={pickerModalListScrollClass}>
            {items.length === 0 ? (
              <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
                No resources you can attach here yet.
              </p>
            ) : flatRows.length === 0 ? (
              <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
                No resources match that search.
              </p>
            ) : showGrouped ? (
              <ul className="flex flex-col gap-0.5" aria-label="Resources">
                {filteredGroups.map((group) =>
                  group.folderTitle == null ? (
                    group.items.map((item) => (
                      <li key={item.id}>
                        <ResourceRow
                          item={item}
                          checked={selectedId === item.id}
                          onToggle={onSelect}
                        />
                      </li>
                    ))
                  ) : (
                    <FolderBranch
                      key={group.folderId}
                      folderTitle={group.folderTitle}
                      items={group.items}
                      selectedId={selectedId}
                      onToggle={onSelect}
                    />
                  ),
                )}
              </ul>
            ) : (
              <ul className="flex flex-col gap-0.5" aria-label="Resources">
                {paged.items.map(({ item, folderTitle }) => (
                  <li key={item.id}>
                    <ResourceRow
                      item={item}
                      folderTitle={folderTitle}
                      checked={selectedId === item.id}
                      onToggle={onSelect}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={pickerModalPagerSlotClass}>
            {paged.needsPagination ? (
              <PickerPaginationBar
                page={paged.page}
                pageCount={paged.pageCount}
                total={paged.total}
                onPage={setPage}
              />
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-[var(--ink-faint)]">
            {selectedId == null ? "None selected" : "1 selected"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={selectedId == null}
              onClick={onConfirm}
            >
              Add resource
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
