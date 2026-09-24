import { useEffect, useId, useState } from "react";
import {
  AcademicCapIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSidebarStore } from "@/app/layouts/stores/sidebar";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";

export type DestinationOption = {
  id: number;
  title: string;
};

type AssignmentKind = "class" | "course";

export function AssignSelectedBar({
  selectedCount,
  classes,
  courses,
  classId,
  courseId,
  saving,
  error,
  onClassIdChange,
  onCourseIdChange,
  onAddToClass,
  onEnrollInCourse,
  onClear,
}: {
  selectedCount: number;
  classes: DestinationOption[];
  courses: DestinationOption[];
  classId: string;
  courseId: string;
  saving: boolean;
  error: string | null;
  onClassIdChange: (value: string) => void;
  onCourseIdChange: (value: string) => void;
  onAddToClass: () => void;
  onEnrollInCourse: () => void;
  onClear: () => void;
}) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const [assignmentKind, setAssignmentKind] = useState<AssignmentKind | null>(
    null,
  );

  useEffect(() => {
    if (selectedCount === 0) setAssignmentKind(null);
  }, [selectedCount]);

  if (selectedCount === 0) return null;

  function closeDialog() {
    if (saving) return;
    if (assignmentKind === "class") onClassIdChange("");
    if (assignmentKind === "course") onCourseIdChange("");
    setAssignmentKind(null);
  }

  return (
    <>
      <div
        className={[
          "pointer-events-none fixed z-30 flex",
          "inset-x-0 bottom-0 justify-stretch pb-[env(safe-area-inset-bottom)]",
          "md:bottom-4 md:justify-center md:pb-0 md:pr-4",
          collapsed ? "md:left-[4.25rem] md:pl-20" : "md:left-[16.5rem] md:pl-20",
        ].join(" ")}
      >
        <section className="pointer-events-auto w-full border-t border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[0_-8px_24px_rgba(28,25,23,0.08)] md:w-auto md:max-w-full md:rounded-[12px] md:border md:shadow-[var(--shadow)]">
          <div className="flex items-center gap-2">
            <p className="mr-auto shrink-0 text-[14px] font-extrabold text-[var(--ink)]">
              {selectedCount === 1
                ? "1 student selected"
                : `${selectedCount} students selected`}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="max-sm:shrink-0 max-sm:!px-2.5 max-sm:!py-2"
              disabled={saving}
              aria-label="Add to class"
              onClick={() => setAssignmentKind("class")}
            >
              <UserGroupIcon className="h-5 w-5" aria-hidden />
              <span className="max-sm:sr-only">Add to class</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="max-sm:shrink-0 max-sm:!px-2.5 max-sm:!py-2"
              disabled={saving}
              aria-label="Enroll in course"
              onClick={() => setAssignmentKind("course")}
            >
              <AcademicCapIcon className="h-5 w-5" aria-hidden />
              <span className="max-sm:sr-only">Enroll in course</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="max-sm:shrink-0 max-sm:!px-2.5 max-sm:!py-2"
              disabled={saving}
              aria-label="Clear selection"
              onClick={onClear}
            >
              <XMarkIcon className="h-5 w-5" aria-hidden />
              <span className="max-sm:sr-only">Clear</span>
            </Button>
          </div>
        </section>
      </div>

      <AssignDestinationDialog
        kind={assignmentKind}
        selectedCount={selectedCount}
        options={assignmentKind === "class" ? classes : courses}
        value={assignmentKind === "class" ? classId : courseId}
        saving={saving}
        error={error}
        onChange={
          assignmentKind === "class" ? onClassIdChange : onCourseIdChange
        }
        onConfirm={
          assignmentKind === "class" ? onAddToClass : onEnrollInCourse
        }
        onClose={closeDialog}
      />
    </>
  );
}

function AssignDestinationDialog({
  kind,
  selectedCount,
  options,
  value,
  saving,
  error,
  onChange,
  onConfirm,
  onClose,
}: {
  kind: AssignmentKind | null;
  selectedCount: number;
  options: DestinationOption[];
  value: string;
  saving: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!kind) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [kind, onClose]);

  if (!kind) return null;

  const isClass = kind === "class";
  const noun = selectedCount === 1 ? "student" : "students";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        disabled={saving}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2 id={titleId} className="text-[15.5px] font-extrabold text-[var(--ink)]">
          {isClass ? "Add to class" : "Enroll in course"}
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          {selectedCount} {noun} selected. Choose{" "}
          {isClass ? "the class to add them to." : "the course to enroll them in."}
        </p>

        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            {isClass ? "Class" : "Course"}
          </span>
          <Select
            wrapperClassName="w-full"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={saving || options.length === 0}
            autoFocus
          >
            <option value="">
              {options.length === 0
                ? `No ${isClass ? "classes" : "courses"} yet`
                : `Choose a ${isClass ? "class" : "course"}`}
            </option>
            {options.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.title}
              </option>
            ))}
          </Select>
        </label>

        {error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !value}
            onClick={onConfirm}
          >
            {saving ? "Saving…" : isClass ? "Add to class" : "Enroll"}
          </Button>
        </div>
      </div>
    </div>
  );
}
