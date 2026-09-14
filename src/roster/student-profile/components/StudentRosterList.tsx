import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
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
}: {
  students: StudentSummary[];
  orgSlug: string;
  emptyMessage: string;
  trailing?: (student: StudentSummary) => ReactNode;
  selectedIds?: number[];
  onToggle?: (id: number) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
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
                to={`/my/${orgSlug}/roster/${student.id}`}
                className="min-w-0 flex-1 hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                  {student.name}
                </span>
                {student.parentEmail ? (
                  <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)]">
                    {student.parentEmail}
                  </span>
                ) : null}
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
