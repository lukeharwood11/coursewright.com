import { useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import type { ResourceItemRecord } from "@/resources/databridge/items";
import { isPublishedResource } from "@/resources/model/kinds";
import {
  resourceCreatedLabel,
  resourceUpdatedLabel,
  resourceWasUpdated,
} from "@/resources/model/resourceMeta";

const nameClass =
  "min-w-0 truncate rounded-[4px] px-1.5 py-2 text-[14.5px] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

const clusterClass = "group/row inline-flex min-w-0 max-w-full items-center";

const menuButtonClass =
  "rounded-[6px] p-1.5 text-[var(--ink-faint)] hover:text-[var(--green-deep)] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] max-sm:opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 sm:group-focus-within/row:opacity-100";

function InlineRename({
  initial,
  label,
  pending,
  onSave,
  onCancel,
}: {
  initial: string;
  label: string;
  pending: boolean;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const cancelRef = useRef(false);
  const startedRef = useRef(false);

  function commit() {
    if (cancelRef.current || startedRef.current || pending) return;
    const next = value.trim();
    if (!next || next === initial.trim()) {
      onCancel();
      return;
    }
    startedRef.current = true;
    void onSave(next).then(
      () => undefined,
      () => {
        startedRef.current = false;
      },
    );
  }

  return (
    <form
      className="w-56 max-w-full px-1.5 py-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        commit();
      }}
    >
      <input
        autoFocus
        aria-label={label}
        value={value}
        disabled={pending}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancelRef.current = true;
            onCancel();
          }
        }}
        className="w-full rounded-[4px] border border-[var(--green)] bg-[var(--surface)] px-2 py-1 text-[14.5px] font-semibold text-[var(--ink)] outline-none"
      />
    </form>
  );
}

function ResourceRowMeta({
  creatorName,
  createdAt,
  updatedAt,
}: {
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}) {
  const creator = creatorName.trim();
  const created = resourceCreatedLabel(createdAt);
  const updated = resourceWasUpdated(createdAt, updatedAt)
    ? resourceUpdatedLabel(updatedAt)
    : "";
  const compact = updated || created;
  if (!creator && !compact) return null;

  return (
    <div className="ml-auto hidden shrink-0 items-center gap-4 pl-4 text-[12.5px] font-semibold text-[var(--ink-faint)] sm:flex">
      {creator ? (
        <span className="hidden max-w-[9rem] truncate md:inline lg:max-w-[12rem]" title={creator}>
          {creator}
        </span>
      ) : null}
      {created ? <span className="hidden whitespace-nowrap lg:inline">{created}</span> : null}
      {compact ? <span className="whitespace-nowrap lg:hidden">{compact}</span> : null}
      {updated ? <span className="hidden whitespace-nowrap lg:inline">{updated}</span> : null}
    </div>
  );
}

function RowMenuButton({
  label,
  onOpen,
}: {
  label: string;
  onOpen: (element: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      className={menuButtonClass}
      aria-label={label}
      aria-haspopup="menu"
      onClick={(event) => onOpen(event.currentTarget)}
    >
      <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
    </button>
  );
}

export function ResourceFolderRow({
  name,
  href,
  creatorName,
  createdAt,
  updatedAt,
  expanded,
  canEdit,
  renaming,
  renamePending,
  selected,
  onToggleSelected,
  onToggle,
  onRename,
  onCancelRename,
  onOpenMenu,
  onContextMenu,
}: {
  name: string;
  href: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  expanded: boolean;
  canEdit: boolean;
  renaming: boolean;
  renamePending: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onToggle: () => void;
  onRename: (name: string) => Promise<void>;
  onCancelRename: () => void;
  onOpenMenu: (element: HTMLElement) => void;
  onContextMenu: (event: MouseEvent) => void;
}) {
  const Folder = expanded ? FolderOpenIcon : FolderIcon;
  return (
    <div data-resource-row="" className="flex min-w-0 items-center px-2" onContextMenu={onContextMenu}>
      <RowCheckbox
        checked={selected}
        label={`Select ${name}`}
        onChange={onToggleSelected}
      />
      {renaming ? (
        <InlineRename
          initial={name}
          label={`Rename ${name}`}
          pending={renamePending}
          onSave={onRename}
          onCancel={onCancelRename}
        />
      ) : (
        <div className={clusterClass}>
          <button
            type="button"
            className="rounded-[4px] p-1.5 text-[var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
            onClick={onToggle}
          >
            <Folder className="h-5 w-5" aria-hidden />
          </button>
          <Link to={href} className={`${nameClass} font-bold text-[var(--ink)]`} title={name}>
            {name}
          </Link>
          {canEdit ? (
            <RowMenuButton label={`Actions for ${name}`} onOpen={onOpenMenu} />
          ) : null}
        </div>
      )}
      {renaming ? null : (
        <ResourceRowMeta
          creatorName={creatorName}
          createdAt={createdAt}
          updatedAt={updatedAt}
        />
      )}
    </div>
  );
}

function RowCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      className="ml-1 h-4 w-4 shrink-0 accent-[var(--green)]"
      checked={checked}
      aria-label={label}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
    />
  );
}

function ItemKindIcon({ type }: { type: ResourceItemRecord["type"] }) {
  const Icon =
    type === "document" ? DocumentTextIcon : type === "link" ? LinkIcon : PaperClipIcon;
  return <Icon className="h-5 w-5 shrink-0 text-[var(--ink-faint)]" aria-hidden />;
}

export function ResourceItemRow({
  item,
  href,
  canEdit,
  renaming,
  renamePending,
  selected,
  onToggleSelected,
  onRename,
  onCancelRename,
  onOpenMenu,
  onContextMenu,
}: {
  item: ResourceItemRecord;
  href: string;
  canEdit: boolean;
  renaming: boolean;
  renamePending: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onRename: (title: string) => Promise<void>;
  onCancelRename: () => void;
  onOpenMenu: (element: HTMLElement) => void;
  onContextMenu: (event: MouseEvent) => void;
}) {
  return (
    <div data-resource-row="" className="flex min-w-0 items-center px-2" onContextMenu={onContextMenu}>
      <RowCheckbox
        checked={selected}
        label={`Select ${item.title}`}
        onChange={onToggleSelected}
      />
      {renaming ? (
        <InlineRename
          initial={item.title}
          label={`Rename ${item.title}`}
          pending={renamePending}
          onSave={onRename}
          onCancel={onCancelRename}
        />
      ) : (
        <div className={clusterClass}>
          <span className="p-1.5">
            <ItemKindIcon type={item.type} />
          </span>
          <Link to={href} className={`${nameClass} font-semibold text-[var(--ink)]`} title={item.title}>
            {item.title}
          </Link>
          {isPublishedResource(item.visibility) ? null : (
            <Badge variant="amber">Unpublished</Badge>
          )}
          {canEdit ? (
            <RowMenuButton label={`Actions for ${item.title}`} onOpen={onOpenMenu} />
          ) : null}
        </div>
      )}
      {renaming ? null : (
        <ResourceRowMeta
          creatorName={item.creatorName}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      )}
    </div>
  );
}
