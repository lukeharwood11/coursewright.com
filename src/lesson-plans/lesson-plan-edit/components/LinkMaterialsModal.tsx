import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import {
  filterPickerGroups,
  groupMaterialsForPicker,
  type LessonPlanPickerMaterial,
} from "@/lesson-plans/model/materials";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { UnitRecord } from "@/units/databridge/units";

function MaterialKindIcon({ kind }: { kind: string | undefined }) {
  const Icon =
    kind === "link"
      ? LinkIcon
      : kind === "file"
        ? DocumentIcon
        : DocumentTextIcon;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" aria-hidden />;
}

function UnitBranch({
  unitTitle,
  materials,
  selected,
  onToggle,
}: {
  unitTitle: string;
  materials: LessonPlanPickerMaterial[];
  selected: Set<number>;
  onToggle: (materialId: number) => void;
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
          aria-label={open ? `Collapse ${unitTitle}` : `Expand ${unitTitle}`}
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
          <span className="min-w-0 truncate">{unitTitle}</span>
        </span>
      </div>
      {open ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {materials.map((material) => (
            <li key={material.id}>
              <MaterialRow
                material={material}
                checked={selected.has(material.id)}
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
  onToggle,
}: {
  material: LessonPlanPickerMaterial;
  checked: boolean;
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
      <MaterialKindIcon kind={material.kind} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[var(--ink)]">
          {material.title}
        </span>
        {material.visibility !== "published" ? (
          <span className="text-[12px] font-bold text-[var(--amber-deep)]">
            Unpublished
          </span>
        ) : null}
        {checked ? (
          <span className="block text-[12px] font-bold text-[var(--green-deep)]">Linked</span>
        ) : null}
      </span>
    </label>
  );
}

export function LessonPlanMaterialPicker({
  materials,
  units,
  selectedIds,
  onToggle,
  autoFocus = false,
}: {
  materials: MaterialRecord[];
  units: UnitRecord[];
  selectedIds: number[];
  onToggle: (materialId: number) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selected = new Set(selectedIds);
  const groups = filterPickerGroups(
    groupMaterialsForPicker(
      materials.map((material) => ({
        id: material.id,
        title: material.title,
        unitId: material.unitId,
        visibility: material.visibility,
        kind: material.kind,
      })),
      units,
    ),
    query,
  );

  return (
    <>
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">Search</span>
        <Input
          className="w-full"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by material or unit…"
          aria-label="Filter materials"
          autoFocus={autoFocus}
        />
      </label>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] p-2">
        {materials.length === 0 ? (
          <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
            Add materials to this course first.
          </p>
        ) : groups.length === 0 ? (
          <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
            No materials match that search.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5" aria-label="Course outline">
            {groups.map((group) =>
              group.unitTitle == null ? (
                group.materials.map((material) => (
                  <li key={material.id}>
                    <MaterialRow
                      material={material}
                      checked={selected.has(material.id)}
                      onToggle={onToggle}
                    />
                  </li>
                ))
              ) : (
                <UnitBranch
                  key={group.unitId}
                  unitTitle={group.unitTitle}
                  materials={group.materials}
                  selected={selected}
                  onToggle={onToggle}
                />
              ),
            )}
          </ul>
        )}
      </div>
    </>
  );
}
