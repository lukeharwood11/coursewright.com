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
import { SegmentButton, SegmentGroup } from "@/ui/Tabs";
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
        <>
          <SegmentGroup>
            <SegmentButton
              ref={newButtonRef}
              pressed={newMenuOpen}
              aria-haspopup="menu"
              aria-expanded={newMenuOpen}
              aria-controls={newMenuOpen ? menuId : undefined}
              disabled={documentPending}
              onClick={() => setNewMenuOpen((open) => !open)}
            >
              <PlusIcon className="h-4 w-4" aria-hidden />
              New
              <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </SegmentButton>
          </SegmentGroup>
          <ResourceContextMenu
            id={menuId}
            open={newMenuOpen}
            label="New"
            items={newItems}
            anchorRef={newButtonRef}
            onClose={() => setNewMenuOpen(false)}
          />
        </>
      ) : null}
      <SegmentGroup className="ml-auto" label="Filter by type">
        {FILTERS.map((filter) => (
          <SegmentButton
            key={filter.id}
            pressed={typeFilter === filter.id}
            onClick={() => onTypeFilter(filter.id)}
          >
            {filter.label}
          </SegmentButton>
        ))}
      </SegmentGroup>
    </div>
  );
}
