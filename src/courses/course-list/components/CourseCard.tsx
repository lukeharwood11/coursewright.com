import { Link } from "react-router-dom";
import { CalendarDaysIcon, MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { CourseIcon } from "@/courses/components/CourseIcon";
import type { CourseCatalogMeta, CourseSummary } from "@/courses/databridge/courses";
import {
  instructorRosterLabel,
  studentEnrollmentLabel,
} from "@/courses/model/catalogCard";
import { formatDateRange } from "@/courses/model/dates";
import { formatGradeLevels } from "@/courses/model/gradeLevels";
import { coursePath } from "@/courses/model/paths";
import { courseStatusLabel } from "@/courses/model/status";
import { isCoursePublished } from "@/courses/model/visibility";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";

const emptyCatalogMeta: CourseCatalogMeta = {
  instructors: [],
  activeEnrollmentCount: 0,
};

export function CourseCard({
  course,
  orgSlug,
  gradeLabels = [],
  catalogMeta = emptyCatalogMeta,
}: {
  course: CourseSummary;
  orgSlug: string;
  gradeLabels?: string[];
  catalogMeta?: CourseCatalogMeta;
}) {
  const dates = formatDateRange(course.startDate, course.endDate);
  const hasScheduleFooter = dates || course.location;
  const instructorNames = catalogMeta.instructors.map((person) => person.name);

  return (
    <Link
      to={coursePath(orgSlug, course.id)}
      className="flex h-full min-h-[9.5rem] flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 hover:border-[var(--green)] hover:bg-[var(--green-tint)] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
    >
      <div className="flex flex-wrap gap-1.5">
        {!isCoursePublished(course.visibility) ? (
          <Badge variant="amber">Unpublished</Badge>
        ) : null}
        <Badge variant={course.status === "active" ? "green" : "neutral"}>
          {courseStatusLabel(course.status)}
        </Badge>
        {course.subject ? <Badge variant="slate">{course.subject}</Badge> : null}
        {course.gradeLevels.length > 0 ? (
          <Badge variant="neutral">
            {formatGradeLevels(course.gradeLevels, gradeLabels)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex items-start gap-3">
        {course.iconKey ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line-soft)] bg-[var(--green-tint)] text-[var(--green)]"
            aria-hidden
          >
            <CourseIcon iconKey={course.iconKey} className="h-6 w-6" />
          </span>
        ) : null}
        <h2
          className="min-w-0 flex-1 line-clamp-2 text-[18px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {course.title}
        </h2>
      </div>

      {course.description ? (
        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          {course.description}
        </p>
      ) : null}

      <div className="mt-auto space-y-2 border-t border-[var(--line-soft)] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {catalogMeta.instructors.length > 0 ? (
            <span className="flex -space-x-1.5 shrink-0" aria-hidden>
              {catalogMeta.instructors.slice(0, 3).map((person) => (
                <Avatar key={person.userId} name={person.name} size={24} />
              ))}
            </span>
          ) : null}
          <p className="min-w-0 truncate text-[12.5px] font-semibold text-[var(--ink-soft)]">
            {instructorRosterLabel(instructorNames)}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-faint)]">
          <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{studentEnrollmentLabel(catalogMeta.activeEnrollmentCount)}</span>
        </p>
        {hasScheduleFooter ? (
          <div className="space-y-1 text-[12.5px] text-[var(--ink-faint)]">
            {dates ? (
              <p className="flex items-start gap-1.5">
                <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{dates}</span>
              </p>
            ) : null}
            {course.location ? (
              <p className="flex items-start gap-1.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span className="line-clamp-2">{course.location}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
