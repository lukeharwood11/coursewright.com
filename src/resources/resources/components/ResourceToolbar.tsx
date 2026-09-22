import { useId, useRef, useState } from "react";
import {
  ArrowUpTrayIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FolderIcon,
  LinkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import type { ResourceTypeFilter } from "@/resources/model/paths";
import {
  ResourceContextMenu,
  type ResourceMenuEntry,
} from "./ResourceContextMenu";

const FILTERS: Array<{ id: ResourceTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "document", label: "Documents" },
  { id: "file", label: "Files" },
  { id: "link", label: "Links" },
];

const segmentIdle =
  "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-60";

const segmentActive =
  "inline-flex items-center gap-1.5 bg-[var(--green-tint)] px-3 py-2 text-[13px] font-bold text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

const segmentShell =
  "inline-flex overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]";

export function ResourceToolbar({
  canEdit,
  typeFilter,
  onTypeFilter,
  onNewFolder,
  onNewDocument,
  onNewLink,
  onUpload,
  documentPending,
}: {
  canEdit: boolean;
  typeFilter: ResourceTypeFilter;
  onTypeFilter: (next: ResourceTypeFilter) => void;
  onNewFolder: () => void;
  onNewDocument: () => void;
  onNewLink: () => void;
  onUpload: () => void;
  documentPending: boolean;
}) {
  const menuId = useId();
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const newItems: ResourceMenuEntry[] = [
    {
      id: "folder",
      label: "Folder",
      icon: <FolderIcon className="h-4 w-4" />,
      onSelect: onNewFolder,
    },
    {
      id: "document",
      label: "Document",
      icon: <DocumentTextIcon className="h-4 w-4" />,
      separatorBefore: true,
      onSelect: onNewDocument,
    },
    {
      id: "link",
      label: "Link",
      icon: <LinkIcon className="h-4 w-4" />,
      onSelect: onNewLink,
    },
    {
      id: "upload",
      label: "Upload files",
      icon: <ArrowUpTrayIcon className="h-4 w-4" />,
      onSelect: onUpload,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {canEdit ? (
        <div className={segmentShell}>
          <button
            ref={newButtonRef}
            type="button"
            className={newMenuOpen ? segmentActive : segmentIdle}
            aria-haspopup="menu"
            aria-expanded={newMenuOpen}
            aria-controls={newMenuOpen ? menuId : undefined}
            disabled={documentPending}
            onClick={() => setNewMenuOpen((open) => !open)}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            New
            <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </button>
          <ResourceContextMenu
            id={menuId}
            open={newMenuOpen}
            label="New"
            items={newItems}
            anchorRef={newButtonRef}
            onClose={() => setNewMenuOpen(false)}
          />
        </div>
      ) : null}
      <div className={`ml-auto ${segmentShell}`} role="group" aria-label="Filter by type">
        {FILTERS.map((filter, index) => (
          <button
            key={filter.id}
            type="button"
            className={[
              typeFilter === filter.id ? segmentActive : segmentIdle,
              index > 0 ? "border-l border-[var(--line)]" : "",
            ].join(" ")}
            aria-pressed={typeFilter === filter.id}
            onClick={() => onTypeFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
