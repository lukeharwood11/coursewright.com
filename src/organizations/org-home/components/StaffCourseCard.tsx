import { Link } from "react-router-dom";
import { CourseIcon } from "@/courses/components/CourseIcon";
import type { CourseCatalogMeta, CourseSummary } from "@/courses/databridge/courses";
import { studentEnrollmentLabel } from "@/courses/model/catalogCard";
import { coursePath } from "@/courses/model/paths";
import { courseStatusLabel } from "@/courses/model/status";
import { isCoursePublished } from "@/courses/model/visibility";
import { Badge } from "@/ui/Badge";

const emptyMeta: CourseCatalogMeta = {
  instructors: [],
  activeEnrollmentCount: 0,
};

export function StaffCourseCard({
  course,
  orgSlug,
  catalogMeta = emptyMeta,
}: {
  course: CourseSummary;
  orgSlug: string;
  catalogMeta?: CourseCatalogMeta;
}) {
  return (
    <Link
      to={coursePath(orgSlug, course.id)}
      className="flex h-full flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3.5 hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
    >
      <div className="flex flex-wrap gap-1.5">
        {!isCoursePublished(course.visibility) ? (
          <Badge variant="amber">Unpublished</Badge>
        ) : null}
        <Badge variant={course.status === "active" ? "green" : "neutral"}>
          {courseStatusLabel(course.status)}
        </Badge>
        {course.subject ? <Badge variant="slate">{course.subject}</Badge> : null}
      </div>
      <div className="mt-2.5 flex items-start gap-2.5">
        {course.iconKey ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line-soft)] bg-[var(--green-tint)] text-[var(--green)]"
            aria-hidden
          >
            <CourseIcon iconKey={course.iconKey} className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 text-[16px] font-semibold leading-snug text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {course.title}
          </p>
          <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
            {studentEnrollmentLabel(catalogMeta.activeEnrollmentCount)}
          </p>
        </div>
      </div>
    </Link>
  );
}
