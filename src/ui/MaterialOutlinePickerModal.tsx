import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpenIcon,
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
  flattenPickerGroups,
  type FlatPickerMaterialRow,
  type LessonPlanPickerGroup,
  type LessonPlanPickerMaterial,
} from "@/lesson-plans/model/materials";

export type MaterialOutlinePickerCourseSection = {
  courseId: number;
  courseTitle: string;
  groups: LessonPlanPickerGroup[];
};

function MaterialKindIcon({ kind }: { kind: string | undefined }) {
  const Icon =
    kind === "link"
      ? LinkIcon
      : kind === "file"
        ? DocumentIcon
        : DocumentTextIcon;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" aria-hidden />;
}

function MaterialRow({
  material,
  checked,
  onToggle,
  unitTitle,
  courseTitle,
  selectionMode,
}: {
  material: LessonPlanPickerMaterial;
  checked: boolean;
  onToggle: (materialId: number) => void;
  unitTitle?: string | null;
  courseTitle?: string | null;
  selectionMode: "single" | "multiple";
}) {
  const inputType = selectionMode === "single" ? "radio" : "checkbox";

  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-[4px] px-1.5 py-1.5 hover:bg-[var(--green-tint)]">
      <input
        type={inputType}
        className="mt-0.5"
        name={selectionMode === "single" ? "material-picker" : undefined}
        checked={checked}
        onChange={() => onToggle(material.id)}
      />
      <MaterialKindIcon kind={material.kind} />
      <span className="min-w-0">
        {courseTitle ? (
          <span className="block text-[11.5px] font-bold text-[var(--ink-faint)]">
            {courseTitle}
          </span>
        ) : null}
        {unitTitle ? (
          <span className="block text-[11.5px] font-bold text-[var(--ink-faint)]">
            {unitTitle}
          </span>
        ) : null}
        <span className="block text-[13.5px] font-semibold text-[var(--ink)]">
          {material.title}
        </span>
        {material.visibility !== "published" ? (
          <span className="text-[12px] font-bold text-[var(--amber-deep)]">
            Unpublished
          </span>
        ) : null}
      </span>
    </label>
  );
}

function UnitBranch({
  unitTitle,
  materials,
  selected,
  onToggle,
  selectionMode,
}: {
  unitTitle: string;
  materials: LessonPlanPickerMaterial[];
  selected: Set<number>;
  onToggle: (materialId: number) => void;
  selectionMode: "single" | "multiple";
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
                selectionMode={selectionMode}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CourseBranch({
  courseTitle,
  groups,
  selected,
  onToggle,
  selectionMode,
}: {
  courseTitle: string;
  groups: LessonPlanPickerGroup[];
  selected: Set<number>;
  onToggle: (materialId: number) => void;
  selectionMode: "single" | "multiple";
}) {
  const [open, setOpen] = useState(true);

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
          <BookOpenIcon className="h-4 w-4 shrink-0 text-[var(--green)]" aria-hidden />
          <span className="min-w-0 truncate">{courseTitle}</span>
        </span>
      </div>
      {open ? (
        <ul className="ml-[1.25rem] border-l border-[var(--line-soft)] pl-2">
          {groups.map((group) =>
            group.unitTitle == null ? (
              group.materials.map((material) => (
                <li key={material.id}>
                  <MaterialRow
                    material={material}
                    checked={selected.has(material.id)}
                    onToggle={onToggle}
                    selectionMode={selectionMode}
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
                selectionMode={selectionMode}
              />
            ),
          )}
        </ul>
      ) : null}
    </li>
  );
}

function GroupedList({
  groups,
  courses,
  selected,
  onToggle,
  selectionMode,
}: {
  groups: LessonPlanPickerGroup[] | null;
  courses: MaterialOutlinePickerCourseSection[] | null;
  selected: Set<number>;
  onToggle: (materialId: number) => void;
  selectionMode: "single" | "multiple";
}) {
  if (courses != null) {
    return (
      <ul className="flex flex-col gap-0.5" aria-label="Courses">
        {courses.map((course) => (
          <CourseBranch
            key={course.courseId}
            courseTitle={course.courseTitle}
            groups={course.groups}
            selected={selected}
            onToggle={onToggle}
            selectionMode={selectionMode}
          />
        ))}
      </ul>
    );
  }

  if (groups == null) return null;

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Course outline">
      {groups.map((group) =>
        group.unitTitle == null ? (
          group.materials.map((material) => (
            <li key={material.id}>
              <MaterialRow
                material={material}
                checked={selected.has(material.id)}
                onToggle={onToggle}
                selectionMode={selectionMode}
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
            selectionMode={selectionMode}
          />
        ),
      )}
    </ul>
  );
}

type DisplayRow = FlatPickerMaterialRow & { courseTitle?: string | null };

export type MaterialOutlinePickerModel =
  | { kind: "groups"; groups: LessonPlanPickerGroup[] }
  | { kind: "courses"; courses: MaterialOutlinePickerCourseSection[] };

function flattenModelForDisplay(model: MaterialOutlinePickerModel): DisplayRow[] {
  if (model.kind === "groups") {
    return flattenPickerGroups(model.groups);
  }
  const rows: DisplayRow[] = [];
  for (const course of model.courses) {
    for (const row of flattenPickerGroups(course.groups)) {
      rows.push({ ...row, courseTitle: course.courseTitle });
    }
  }
  return rows;
}

export function MaterialOutlinePickerModal({
  open,
  title,
  description,
  searchPlaceholder = "Filter by material or unit…",
  emptyCatalogMessage,
  noMatchMessage = "No materials match that search.",
  catalogCount,
  getFilteredModel,
  selectedIds,
  onToggle,
  selectionMode = "multiple",
  onClose,
  primaryAction,
}: {
  open: boolean;
  title: string;
  description?: string;
  searchPlaceholder?: string;
  emptyCatalogMessage: string;
  noMatchMessage?: string;
  catalogCount: number;
  getFilteredModel: (query: string) => MaterialOutlinePickerModel;
  selectedIds: number[];
  onToggle: (materialId: number) => void;
  selectionMode?: "single" | "multiple";
  onClose: () => void;
  primaryAction?: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
  };
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const selected = new Set(selectedIds);

  const filteredModel = useMemo(
    () => getFilteredModel(query),
    [getFilteredModel, query],
  );
  const flatRows = useMemo(
    () => flattenModelForDisplay(filteredModel),
    [filteredModel],
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
  const groups = filteredModel.kind === "groups" ? filteredModel.groups : null;
  const courses = filteredModel.kind === "courses" ? filteredModel.courses : null;

  const footerHint =
    selectionMode === "single"
      ? selectedIds.length === 0
        ? "None selected"
        : "1 selected"
      : selectedIds.length === 0
        ? "None selected"
        : `${selectedIds.length} selected`;

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
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">{description}</p>
        ) : null}
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">Search</span>
          <Input
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Filter materials"
            autoFocus
          />
        </label>
        <div className={`mt-3 ${pickerModalListShellClass}`}>
          <div className={pickerModalListScrollClass}>
            {catalogCount === 0 ? (
              <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
                {emptyCatalogMessage}
              </p>
            ) : flatRows.length === 0 ? (
              <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
                {noMatchMessage}
              </p>
            ) : showGrouped ? (
              <GroupedList
                groups={groups}
                courses={courses}
                selected={selected}
                onToggle={onToggle}
                selectionMode={selectionMode}
              />
            ) : (
              <ul className="flex flex-col gap-0.5" aria-label="Course outline">
                {paged.items.map(({ material, unitTitle, courseTitle }) => (
                  <li key={material.id}>
                    <MaterialRow
                      material={material}
                      unitTitle={unitTitle}
                      courseTitle={courseTitle}
                      checked={selected.has(material.id)}
                      onToggle={onToggle}
                      selectionMode={selectionMode}
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
          <p className="text-[12.5px] text-[var(--ink-faint)]">{footerHint}</p>
          <div className="flex flex-wrap gap-2">
            {primaryAction ? (
              <>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={primaryAction.disabled}
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.label}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
