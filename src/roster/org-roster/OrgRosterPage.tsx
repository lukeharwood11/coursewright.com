import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { useOrgRoster } from "./hooks/useOrgRoster";

export function OrgRosterPage() {
  const { organization, students, loading, error } = useOrgRoster();

  useEffect(() => {
    document.title = `Roster · ${organization.name} · Course Wright`;
  }, [organization.name]);

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Roster
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        Student profiles for this organization. Course enrollments live on each
        course.
      </p>
      <p className="mt-2 text-[13px]">
        <Link
          to={`/my/${organization.slug}/families`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Families
        </Link>
      </p>

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading roster…</p>
      ) : null}

      {error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && students.length === 0 ? (
        <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No student profiles yet. They often appear when someone is first
          enrolled in a course.
        </p>
      ) : null}

      {students.length > 0 ? (
        <ul className="mt-6 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                to={`/my/${organization.slug}/roster/${student.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                <span className="min-w-0 flex-1 truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                  {student.name}
                </span>
                {student.gradeLevel ? (
                  <Badge variant="neutral">{student.gradeLevel}</Badge>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
