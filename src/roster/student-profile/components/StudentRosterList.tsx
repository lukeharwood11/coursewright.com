import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import type { StudentSummary } from "@/roster/databridge/students";

export function StudentRosterList({
  students,
  orgSlug,
  emptyMessage,
  trailing,
}: {
  students: StudentSummary[];
  orgSlug: string;
  emptyMessage: string;
  trailing?: (student: StudentSummary) => ReactNode;
}) {
  if (students.length === 0) {
    return (
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {students.map((student) => (
        <li key={student.id} className="flex items-center gap-3 px-4 py-3">
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
      ))}
    </ul>
  );
}
