import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export type EventMaterialOption = {
  id: number;
  title: string;
  courseTitle: string;
};

function groupByCourse(
  options: EventMaterialOption[],
): Array<{ courseTitle: string; materials: EventMaterialOption[] }> {
  const byCourse = new Map<string, EventMaterialOption[]>();
  for (const option of options) {
    const list = byCourse.get(option.courseTitle) ?? [];
    list.push(option);
    byCourse.set(option.courseTitle, list);
  }
  return [...byCourse.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([courseTitle, materials]) => ({
      courseTitle,
      materials: [...materials].sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

function filterGroups(
  groups: Array<{ courseTitle: string; materials: EventMaterialOption[] }>,
  query: string,
): Array<{ courseTitle: string; materials: EventMaterialOption[] }> {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;

  return groups
    .map((group) => {
      if (group.courseTitle.toLowerCase().includes(needle)) return group;
      return {
        ...group,
        materials: group.materials.filter((material) =>
          material.title.toLowerCase().includes(needle),
        ),
      };
    })
    .filter((group) => group.materials.length > 0);
}

function courseCount(options: EventMaterialOption[]): number {
  return new Set(options.map((option) => option.courseTitle)).size;
}

function CourseBranch({
  courseTitle,
  materials,
  selected,
  onToggle,
  defaultOpen,
}: {
  courseTitle: string;
  materials: EventMaterialOption[];
  selected: Set<number>;
  onToggle: (materialId: number) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Folder = open ? FolderOpenIcon : FolderIcon;

  return (
    <li>
      <div className="flex min-w-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
          aria-expanded={open}
          aria-label={open ? `Collapse ${courseTitle}` : `Expand ${courseTitle}`}
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
          <span className="min-w-0 truncate">{courseTitle}</span>
        </span>
      </div>
      {open ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {materials.map((material) => (
            <li key={material.id}>
              <MaterialRow
                material={material}
                checked={selected.has(material.id)}
                showCourse={false}
                onToggle={onToggle}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function MaterialRow({
  material,
  checked,
  showCourse,
  onToggle,
}: {
  material: EventMaterialOption;
  checked: boolean;
  showCourse: boolean;
  onToggle: (materialId: number) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-[4px] px-1.5 py-1.5 hover:bg-[var(--green-tint)]">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={checked}
        onChange={() => onToggle(material.id)}
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[var(--ink)]">
          {material.title}
        </span>
        {showCourse ? (
          <span className="block text-[12px] text-[var(--ink-faint)]">
            {material.courseTitle}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function LinkMaterialsModal({
  open,
  options,
  selectedIds,
  onToggle,
  onClose,
}: {
  open: boolean;
  options: EventMaterialOption[];
  selectedIds: number[];
  onToggle: (materialId: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const selected = new Set(selectedIds);

  useEffect(() => {
    if (!open) return;
    setQuery("");

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const groups = filterGroups(groupByCourse(options), query);
  const multiCourse = courseCount(options) > 1;

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
          Link materials
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Choose materials to show with this event.
        </p>
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">Search</span>
          <Input
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              multiCourse ? "Filter by material or course…" : "Filter materials…"
            }
            aria-label="Filter materials"
            autoFocus
          />
        </label>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] p-2">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
              Add materials to a course first.
            </p>
          ) : groups.length === 0 ? (
            <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
              No materials match that search.
            </p>
          ) : multiCourse ? (
            <ul className="flex flex-col gap-0.5" aria-label="Courses">
              {groups.map((group) => (
                <CourseBranch
                  key={group.courseTitle}
                  courseTitle={group.courseTitle}
                  materials={group.materials}
                  selected={selected}
                  onToggle={onToggle}
                  defaultOpen
                />
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-0.5" aria-label="Materials">
              {groups[0]?.materials.map((material) => (
                <li key={material.id}>
                  <MaterialRow
                    material={material}
                    checked={selected.has(material.id)}
                    showCourse={false}
                    onToggle={onToggle}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-[var(--ink-faint)]">
            {selectedIds.length === 0
              ? "None selected"
              : `${selectedIds.length} selected`}
          </p>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
