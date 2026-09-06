import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { useStudentProfile } from "./hooks/useStudentProfile";

export function StudentProfilePage() {
  const { organization, student, loading, error, notFound } = useStudentProfile();

  useEffect(() => {
    document.title = student
      ? `${student.name} · Course Wright`
      : "Student · Course Wright";
  }, [student]);

  if (loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading student…</p>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that student
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          They may have been removed, or you may not have access.
        </p>
        {error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${organization.slug}/roster`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to roster
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {student.name}
        </h1>
        {student.gradeLevel ? (
          <Badge variant="neutral">{student.gradeLevel}</Badge>
        ) : null}
      </div>
      <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Parent email, enrollments, and family membership will live on this
        profile next.
      </p>
      <p className="mt-4 text-[13px]">
        <Link
          to={`/my/${organization.slug}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to roster
        </Link>
      </p>
    </div>
  );
}
