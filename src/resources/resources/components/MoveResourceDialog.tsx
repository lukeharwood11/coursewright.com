import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import {
  listOrgResourceFolders,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import {
  buildFolderOutline,
  folderAncestorIds,
  folderIdsInSubtree,
  type FolderOutlineNode,
} from "@/resources/model/tree";

function FolderOutlineBranch({
  node,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: {
  node: FolderOutlineNode;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (folderId: number) => void;
  onToggle: (folderId: number) => void;
}) {
  const open = expandedIds.has(node.id);
  const selected = selectedId === node.id;
  const Folder = open ? FolderOpenIcon : FolderIcon;
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex min-w-0 items-center gap-0.5">
        {hasChildren ? (
          <button
            type="button"
            className="rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={() => onToggle(node.id)}
          >
            {open ? (
              <ChevronDownIcon className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : (
          <span className="inline-block w-5 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className={[
            "flex min-w-0 flex-1 items-center gap-1.5 rounded-[4px] px-1.5 py-1.5 text-left text-[13.5px] font-semibold",
            selected
              ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
              : "text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]",
          ].join(" ")}
          aria-pressed={selected}
          onClick={() => onSelect(node.id)}
        >
          <Folder
            className="h-4 w-4 shrink-0 text-[var(--green)]"
            aria-hidden
          />
          <span className="min-w-0 truncate">{node.name}</span>
        </button>
      </div>
      {open && hasChildren ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {node.children.map((child) => (
            <FolderOutlineBranch
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function MoveResourceDialog({
  open,
  organizationId,
  currentFolderId,
  excludeFolderId,
  excludeFolderIds,
  requireDifferentDestination = true,
  onClose,
  onMove,
  pending,
  error,
}: {
  open: boolean;
  organizationId: number;
  currentFolderId: number | null;
  excludeFolderId?: number | null;
  excludeFolderIds?: number[];
  requireDifferentDestination?: boolean;
  onClose: () => void;
  onMove: (folderId: number | null) => void;
  pending: boolean;
  error: string | null;
}) {
  const [destination, setDestination] = useState<number | null>(currentFolderId);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const foldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.all(organizationId),
    queryFn: () => listOrgResourceFolders(organizationId),
    enabled: open,
  });
  const folders = foldersQuery.data ?? [];
  const excluded = useMemo(() => {
    const roots = [
      ...(excludeFolderId != null ? [excludeFolderId] : []),
      ...(excludeFolderIds ?? []),
    ];
    const ids = new Set<number>();
    for (const rootId of roots) {
      for (const id of folderIdsInSubtree(folders, rootId)) ids.add(id);
    }
    return ids;
  }, [excludeFolderId, excludeFolderIds, folders]);
  const foldersById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );
  const outline = useMemo(
    () => buildFolderOutline(folders, excluded),
    [folders, excluded],
  );

  useEffect(() => {
    if (!open) return;
    setDestination(currentFolderId);
    const ancestors =
      currentFolderId != null
        ? folderAncestorIds(foldersById, currentFolderId)
        : [];
    setExpandedIds(new Set(ancestors));
  }, [currentFolderId, open, foldersById]);

  if (!open) return null;

  function toggleExpanded(folderId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  const rootSelected = destination === null;

  return (
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
        aria-labelledby="resource-move-title"
        className="relative flex max-h-[min(36rem,90vh)] w-full max-w-md flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id="resource-move-title"
          className="text-[15.5px] font-extrabold text-[var(--ink)]"
        >
          Move
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Choose a folder, or keep it at the top of Resources.
        </p>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] p-2">
          {foldersQuery.isLoading ? (
            <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
              Loading folders…
            </p>
          ) : foldersQuery.isError ? (
            <p className="px-2 py-3 text-[13.5px] text-[var(--amber-deep)]">
              Couldn’t load folders.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5" aria-label="Folder outline">
              <li>
                <button
                  type="button"
                  className={[
                    "flex w-full min-w-0 items-center gap-1.5 rounded-[4px] px-1.5 py-1.5 text-left text-[13.5px] font-semibold",
                    rootSelected
                      ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
                      : "text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]",
                  ].join(" ")}
                  aria-pressed={rootSelected}
                  onClick={() => setDestination(null)}
                >
                  <HomeIcon
                    className="h-4 w-4 shrink-0 text-[var(--green)]"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">Resources (top level)</span>
                </button>
              </li>
              {outline.map((node) => (
                <FolderOutlineBranch
                  key={node.id}
                  node={node}
                  selectedId={destination}
                  expandedIds={expandedIds}
                  onSelect={setDestination}
                  onToggle={toggleExpanded}
                />
              ))}
            </ul>
          )}
        </div>
        {error ? (
          <p className="mt-3 text-[13.5px] text-[var(--amber-deep)]">{error}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              pending ||
              (requireDifferentDestination && destination === currentFolderId)
            }
            onClick={() => onMove(destination)}
          >
            {pending ? "Moving…" : "Move"}
          </Button>
        </div>
      </div>
    </div>
  );
}
