import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { studentPath } from "@/grading/model/paths";
import type { StudentSummary } from "@/roster/databridge/students";

export function StudentRosterList({
  students,
  orgSlug,
  emptyMessage,
  trailing,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearSelection,
  classLabel,
  variant = "list",
}: {
  students: StudentSummary[];
  orgSlug: string;
  emptyMessage: string;
  trailing?: (student: StudentSummary) => ReactNode;
  classLabel?: (studentId: number) => string | null;
  selectedIds?: number[];
  onToggle?: (id: number) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  variant?: "list" | "directory";
}) {
  const selectable = Boolean(onToggle);
  const selectedSet = new Set(selectedIds ?? []);
  const allSelected =
    students.length > 0 && students.every((student) => selectedSet.has(student.id));

  if (students.length === 0) {
    return (
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        {emptyMessage}
      </p>
    );
  }

  if (variant === "directory") {
    const desktopColumns = selectable
      ? trailing
        ? "lg:grid-cols-[2rem_minmax(10rem,1.1fr)_minmax(10rem,1fr)_6rem_7rem]"
        : "lg:grid-cols-[2rem_minmax(10rem,1.1fr)_minmax(10rem,1fr)_6rem]"
      : trailing
        ? "lg:grid-cols-[minmax(10rem,1.1fr)_minmax(10rem,1fr)_6rem_7rem]"
        : "lg:grid-cols-[minmax(10rem,1.1fr)_minmax(10rem,1fr)_6rem]";
    const mobileColumns = selectable
      ? "grid-cols-[2rem_minmax(0,1fr)_auto]"
      : "grid-cols-[minmax(0,1fr)_auto]";

    return (
      <div className="mt-3 overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
        {selectable ? (
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[var(--paper)] px-4 py-2 lg:hidden">
            <button
              type="button"
              className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              onClick={allSelected ? onClearSelection : onSelectAll}
            >
              {allSelected ? "Clear selection" : "Select all matching"}
            </button>
          </div>
        ) : null}

        <div
          className={[
            "hidden items-center gap-3 border-b border-[var(--line-soft)] bg-[var(--paper)] px-4 py-2 text-[12px] font-bold text-[var(--ink-soft)] lg:grid",
            desktopColumns,
          ].join(" ")}
        >
          {selectable ? (
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--green)]"
              checked={allSelected}
              onChange={allSelected ? onClearSelection : onSelectAll}
              aria-label={allSelected ? "Clear selection" : "Select all matching"}
            />
          ) : null}
          <span>Student</span>
          <span>Classes</span>
          <span>Grade</span>
          {trailing ? <span className="sr-only">Actions</span> : null}
        </div>

        <ul className="divide-y divide-[var(--line-soft)]">
          {students.map((student) => {
            const checked = selectedSet.has(student.id);
            const classes = classLabel?.(student.id) || "No classes yet";
            return (
              <li
                key={student.id}
                className={[
                  "grid items-center gap-x-3 px-4 py-3",
                  mobileColumns,
                  desktopColumns,
                ].join(" ")}
              >
                {selectable ? (
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[var(--green)]"
                    checked={checked}
                    onChange={() => onToggle?.(student.id)}
                    aria-label={`Select ${student.name}`}
                  />
                ) : null}
                <Link
                  to={studentPath(orgSlug, student.id)}
                  className="min-w-0 hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                >
                  <span className="block truncate text-[15px] font-extrabold text-[var(--ink)]">
                    {student.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)] lg:hidden">
                    {classes}
                  </span>
                </Link>
                <span className="hidden min-w-0 truncate text-[13.5px] text-[var(--ink-soft)] lg:block">
                  {classes}
                </span>
                {student.gradeLevel ? (
                  <Badge variant="neutral">{student.gradeLevel}</Badge>
                ) : (
                  <span className="hidden text-[13px] text-[var(--ink-faint)] lg:block">
                    —
                  </span>
                )}
                {trailing ? (
                  <span className="col-span-full mt-2 justify-self-start lg:col-span-1 lg:mt-0 lg:justify-self-end">
                    {trailing(student)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {selectable ? (
        <div className="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            onClick={allSelected ? onClearSelection : onSelectAll}
          >
            {allSelected ? "Clear selection" : "Select all matching"}
          </button>
        </div>
      ) : null}
      <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
        {students.map((student) => {
          const checked = selectedSet.has(student.id);
          return (
            <li key={student.id} className="flex items-center gap-3 px-4 py-3">
              {selectable ? (
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[var(--green)]"
                  checked={checked}
                  onChange={() => onToggle?.(student.id)}
                  aria-label={`Select ${student.name}`}
                />
              ) : null}
              <Link
                to={studentPath(orgSlug, student.id)}
                className="min-w-0 flex-1 hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                  {student.name}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)]">
                  {classLabel?.(student.id) || "No classes yet"}
                </span>
              </Link>
              {student.gradeLevel ? (
                <Badge variant="neutral">{student.gradeLevel}</Badge>
              ) : null}
              {trailing ? (
                <span className="shrink-0">{trailing(student)}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
