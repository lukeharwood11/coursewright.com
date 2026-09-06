import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useCourse } from "./hooks/useCourse";

export function CoursePage() {
  const { role } = useOrgShell();
  const { organization, course, loading, error, notFound } = useCourse();
  const isParent = role === "parent";

  useEffect(() => {
    document.title = course
      ? `${course.title} · Course Wright`
      : "Course · Course Wright";
  }, [course]);

  if (loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading course…</p>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that course
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        {error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={isParent ? `/my/${organization.slug}` : `/my/${organization.slug}/courses`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            {isParent ? `Back to ${organization.name}` : "Back to courses"}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {course.title}
      </h1>
      <div className="mt-2">
        <Badge variant={course.status === "active" ? "green" : "neutral"}>
          {course.status === "active" ? "Active" : course.status}
        </Badge>
      </div>
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        {isParent
          ? "Units and materials for this course will show up here."
          : "Units, materials, print, and share will live on this page next."}
      </p>
      <p className="mt-4 text-[13px]">
        <Link
          to={isParent ? `/my/${organization.slug}` : `/my/${organization.slug}/courses`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          {isParent ? `Back to ${organization.name}` : "Back to courses"}
        </Link>
      </p>
    </div>
  );
}
