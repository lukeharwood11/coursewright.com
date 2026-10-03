import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import {
  dayResourceKey,
  filterPickerNodes,
  type LessonPlanDayResourceRef,
  type LessonPlanResourcePickerNode,
} from "@/lesson-plans/model/dayResources";

function ResourceKindIcon({ kind }: { kind: LessonPlanResourcePickerNode["itemType"] }) {
  const Icon =
    kind === "folder"
      ? FolderIcon
      : kind === "link"
        ? LinkIcon
        : kind === "file"
          ? DocumentIcon
          : DocumentTextIcon;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" aria-hidden />;
}

function AccessWarning({ warning }: { warning: string | null }) {
  if (!warning) return null;
  return (
    <span className="mt-0.5 flex items-start gap-1 text-[12px] font-bold text-[var(--amber-deep)]">
      <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {warning}
    </span>
  );
}

function ResourceRow({
  node,
  checked,
  onToggle,
}: {
  node: LessonPlanResourcePickerNode;
  checked: boolean;
  onToggle: (resource: LessonPlanDayResourceRef) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-[4px] px-1.5 py-1.5 hover:bg-[var(--green-tint)]">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={checked}
        onChange={() => onToggle({ kind: node.kind, id: node.id })}
      />
      <ResourceKindIcon kind={node.itemType} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[var(--ink)]">
          {node.title}
        </span>
        <AccessWarning warning={node.familyAccessWarning} />
      {checked ? (
        <span className="mt-0.5 block text-[12px] font-bold text-[var(--green-deep)]">Linked</span>
      ) : null}
      </span>
    </label>
  );
}

function FolderBranch({
  node,
  selected,
  onToggle,
}: {
  node: LessonPlanResourcePickerNode;
  selected: Set<string>;
  onToggle: (resource: LessonPlanDayResourceRef) => void;
}) {
  const [open, setOpen] = useState(true);
  const Folder = open ? FolderOpenIcon : FolderIcon;
  return (
    <li>
      <div className="flex min-w-0 items-start gap-0.5">
        <button
          type="button"
          className="mt-1 rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
          aria-expanded={open}
          aria-label={open ? `Collapse ${node.title}` : `Expand ${node.title}`}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <ResourceRow
            node={{ ...node, itemType: "folder" }}
            checked={selected.has(dayResourceKey(node))}
            onToggle={onToggle}
          />
          <span className="sr-only">
            <Folder className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
      {open && node.children.length > 0 ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {node.children.map((child) =>
            child.kind === "folder" ? (
              <FolderBranch
                key={dayResourceKey(child)}
                node={child}
                selected={selected}
                onToggle={onToggle}
              />
            ) : (
              <li key={dayResourceKey(child)}>
                <ResourceRow
                  node={child}
                  checked={selected.has(dayResourceKey(child))}
                  onToggle={onToggle}
                />
              </li>
            ),
          )}
        </ul>
      ) : null}
    </li>
  );
}

export function LessonPlanResourcePicker({
  nodes,
  selected,
  courseHasLinks,
  loading,
  onToggle,
  autoFocus = false,
}: {
  nodes: LessonPlanResourcePickerNode[];
  selected: LessonPlanDayResourceRef[];
  courseHasLinks: boolean;
  loading: boolean;
  onToggle: (resource: LessonPlanDayResourceRef) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selectedKeys = new Set(selected.map(dayResourceKey));
  const visible = filterPickerNodes(nodes, query);
  const searching = query.trim().length > 0;

  return (
    <>
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">Search</span>
        <Input
          className="w-full"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or folder…"
          aria-label="Filter resources"
          autoFocus={autoFocus}
        />
      </label>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] p-2">
        {loading ? (
          <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">Loading…</p>
        ) : !courseHasLinks ? (
          <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
            Link a resource on this course first.
          </p>
        ) : visible.length === 0 ? (
          <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
            No resources match that search.
          </p>
        ) : searching ? (
          <ul className="flex flex-col gap-0.5" aria-label="Course resources">
            {visible.map((node) => (
              <li key={dayResourceKey(node)}>
                <ResourceRow
                  node={node}
                  checked={selectedKeys.has(dayResourceKey(node))}
                  onToggle={onToggle}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-0.5" aria-label="Course resources">
            {visible.map((node) =>
              node.kind === "folder" ? (
                <FolderBranch
                  key={dayResourceKey(node)}
                  node={node}
                  selected={selectedKeys}
                  onToggle={onToggle}
                />
              ) : (
                <li key={dayResourceKey(node)}>
                  <ResourceRow
                    node={node}
                    checked={selectedKeys.has(dayResourceKey(node))}
                    onToggle={onToggle}
                  />
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </>
  );
}
