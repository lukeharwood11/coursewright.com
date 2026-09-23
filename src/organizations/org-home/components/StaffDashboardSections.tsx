import { Link } from "react-router-dom";
import {
  BookOpenIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type {
  StaffAttentionKind,
  StaffDashboard,
} from "@/organizations/model/staffDashboard";
import { peopleCountLabel } from "@/organizations/model/staffDashboard";
import { coursesPath, coursePath, newCoursePath } from "@/courses/model/paths";
import { materialPath } from "@/materials/model/paths";
import { ButtonLink } from "@/ui/Button";
import { StaffCourseCard } from "./StaffCourseCard";

const attentionIcon = {
  no_enrollments: UsersIcon,
  unpublished_with_roster: EyeSlashIcon,
} as const satisfies Record<StaffAttentionKind, typeof UsersIcon>;

export function StaffGettingStarted({
  orgSlug,
  needsCourse,
  needsStudents,
}: {
  orgSlug: string;
  needsCourse: boolean;
  needsStudents: boolean;
}) {
  const rosterPath = `/my/${orgSlug}/roster`;
  return (
    <section
      className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--green-tint)] p-4"
      aria-label="Getting started"
    >
      <h2 className="text-[13px] font-extrabold text-[var(--green-deep)]">
        Getting started
      </h2>
      <ol className="mt-3 flex flex-col gap-2 text-[14px] text-[var(--ink)]">
        {needsCourse ? (
          <li className="flex flex-wrap items-center gap-2">
            <span>1. Create a course — you can print without a roster.</span>
            <ButtonLink to={newCoursePath(orgSlug)} className="px-2.5 py-1 text-[12.5px]">
              Create course
            </ButtonLink>
          </li>
        ) : (
          <li className="text-[var(--ink-soft)]">1. Course ready</li>
        )}
        <li className="flex flex-wrap items-center gap-2">
          <span>
            2.{" "}
            {needsStudents
              ? "Add students on the roster when you’re ready."
              : "Students are on the roster."}
          </span>
          {needsStudents ? (
            <ButtonLink
              variant="secondary"
              to={rosterPath}
              className="px-2.5 py-1 text-[12.5px]"
            >
              Open roster
            </ButtonLink>
          ) : null}
        </li>
        <li className="text-[var(--ink-soft)]">
          3. Enroll students and publish a course when students should see it.
        </li>
      </ol>
    </section>
  );
}

export function StaffAttentionList({
  orgSlug,
  items,
}: {
  orgSlug: string;
  items: StaffDashboard["attention"];
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Needs attention">
      <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--ink-faint)]">
        Needs attention
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => {
          const Icon = attentionIcon[item.kind];
          return (
            <li key={item.id}>
              <Link
                to={
                  item.kind === "no_enrollments"
                    ? `${coursePath(orgSlug, item.courseId)}/roster`
                    : coursePath(orgSlug, item.courseId)
                }
                className="flex items-center gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-3 hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--amber-tint)] text-[var(--amber-deep)]"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 text-[14px] font-semibold leading-snug text-[var(--ink)]">
                  {item.message}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StaffCoursesPreview({
  orgSlug,
  dashboard,
}: {
  orgSlug: string;
  dashboard: StaffDashboard;
}) {
  return (
    <section aria-label="Courses">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--ink-faint)]">
          Courses
        </h2>
        {dashboard.courses.length > 0 ? (
          <Link
            to={coursesPath(orgSlug)}
            className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            {dashboard.hasMoreCourses
              ? `View all ${dashboard.courses.length}`
              : "View all courses"}
          </Link>
        ) : null}
      </div>

      {dashboard.previewCourses.length === 0 ? (
        <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No courses yet. Create one to plan materials and share with students.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {dashboard.previewCourses.map((course) => (
            <li key={course.id}>
              <StaffCourseCard
                course={course}
                orgSlug={orgSlug}
                catalogMeta={dashboard.catalogByCourseId[course.id]}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StaffWeekSummary({
  orgSlug,
  dashboard,
}: {
  orgSlug: string;
  dashboard: StaffDashboard;
}) {
  return (
    <section aria-label="This week">
      <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--ink-faint)]">
        This week
      </h2>
      <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">{dashboard.week.label}</p>

      {dashboard.importantNow.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--ink-faint)]">
            Important now
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {dashboard.importantNow.map((item) => (
              <li key={item.id}>
                <Link
                  to={materialPath({
                    orgSlug,
                    courseId: item.courseId,
                    unitId: item.unitId,
                    materialId: item.materialId,
                  })}
                  className="flex items-center gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-3 hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--amber-tint)] text-[var(--amber-deep)]"
                    aria-hidden
                  >
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug text-[var(--ink)]">
                      {item.materialTitle}
                    </span>
                    {item.materialDescription ? (
                      <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
                        {item.materialDescription}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
                      {item.courseTitle}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {dashboard.datedMaterialTotal === 0 ? (
        <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No dated materials fall in this week across active courses.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {dashboard.weekByCourse.map((row) => (
            <li key={row.courseId}>
              <Link
                to={coursePath(orgSlug, row.courseId)}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--green)] hover:bg-[var(--green-tint)]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <BookOpenIcon
                    className="h-5 w-5 shrink-0 text-[var(--green)]"
                    aria-hidden
                  />
                  <span className="truncate text-[14.5px] font-bold text-[var(--ink)]">
                    {row.courseTitle}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-[var(--ink-soft)]">
                  {row.datedMaterialCount === 1
                    ? "1 dated material"
                    : `${row.datedMaterialCount} dated materials`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StaffPeopleSnapshot({
  orgSlug,
  people,
}: {
  orgSlug: string;
  people: StaffDashboard["people"];
}) {
  return (
    <section aria-label="People">
      <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--ink-faint)]">
        People
      </h2>
      <div className="mt-3">
        <Link
          to={`/my/${orgSlug}/roster`}
          className="flex items-start gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3.5 hover:border-[var(--green)] hover:bg-[var(--green-tint)]"
        >
          <UsersIcon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--green)]" aria-hidden />
          <span>
            <span className="block text-[15px] font-extrabold text-[var(--ink)]">
              {peopleCountLabel(people.studentCount, "student", "students")}
            </span>
            <span className="mt-0.5 block text-[13px] text-[var(--ink-soft)]">
              {peopleCountLabel(people.classCount, "class", "classes")} on the roster
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
