import { Link } from "react-router-dom";
import { AcademicCapIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import type { ClassCatalogMeta, ClassSummary } from "@/roster/databridge/classes";
import {
  classMemberLabel,
  classTeacherRosterLabel,
} from "@/roster/model/classCatalogCard";
import { Avatar } from "@/ui/Avatar";

const emptyCatalogMeta: ClassCatalogMeta = {
  leaders: [],
  memberCount: 0,
};

export function ClassCard({
  classGroup,
  orgSlug,
  catalogMeta = emptyCatalogMeta,
}: {
  classGroup: ClassSummary;
  orgSlug: string;
  catalogMeta?: ClassCatalogMeta;
}) {
  const teacherNames = catalogMeta.leaders.map((person) => person.name);

  return (
    <Link
      to={`/my/${orgSlug}/classes/${classGroup.id}`}
      className="flex h-full min-h-[9.5rem] flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 hover:border-[var(--green)] hover:bg-[var(--green-tint)] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line-soft)] bg-[var(--green-tint)] text-[var(--green)]"
          aria-hidden
        >
          <AcademicCapIcon className="h-6 w-6" />
        </span>
        <h2
          className="min-w-0 flex-1 line-clamp-2 text-[18px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {classGroup.title}
        </h2>
      </div>

      <div className="mt-auto space-y-2 border-t border-[var(--line-soft)] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {catalogMeta.leaders.length > 0 ? (
            <span className="flex -space-x-1.5 shrink-0" aria-hidden>
              {catalogMeta.leaders.slice(0, 3).map((person) => (
                <Avatar key={person.userId} name={person.name} size={24} />
              ))}
            </span>
          ) : null}
          <p className="min-w-0 truncate text-[12.5px] font-semibold text-[var(--ink-soft)]">
            {classTeacherRosterLabel(teacherNames)}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-faint)]">
          <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{classMemberLabel(catalogMeta.memberCount)}</span>
        </p>
      </div>
    </Link>
  );
}
