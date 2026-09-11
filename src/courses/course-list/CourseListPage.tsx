import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { formatDateRange } from "@/courses/model/dates";
import { coursePath } from "@/courses/model/paths";
import { courseStatusLabel } from "@/courses/model/status";
import { isCoursePublished } from "@/courses/model/visibility";
import { CreateCourseForm } from "./components/CreateCourseForm";
import { useCourseList, useCreateCourse } from "./hooks/useCourseList";

export function CourseListPage() {
  const { organization, courses, loading, error } = useCourseList();
  const create = useCreateCourse();

  useEffect(() => {
    document.title = `Courses · ${organization.name} · Course Wright`;
  }, [organization.name]);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Courses
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            Offerings families participate in. You can create a course and print
            without a roster.
          </p>
        </div>
        {!create.open ? (
          <Button onClick={() => create.setOpen(true)}>
            <PlusIcon className="h-5 w-5" aria-hidden />
            Create course
          </Button>
        ) : null}
      </div>

      {create.open ? (
        <CreateCourseForm
          title={create.title}
          description={create.description}
          location={create.location}
          subject={create.subject}
          startDate={create.startDate}
          endDate={create.endDate}
          status={create.status}
          gradeLevels={create.gradeLevels}
          gradeLabels={create.gradeLabels}
          mode={create.mode}
          sourceCourseId={create.sourceCourseId}
          sourceCourses={create.sourceCourses}
          error={create.formError}
          submitting={create.submitting}
          onTitleChange={create.setTitle}
          onDescriptionChange={create.setDescription}
          onLocationChange={create.setLocation}
          onSubjectChange={create.setSubject}
          onStartDateChange={create.setStartDate}
          onEndDateChange={create.setEndDate}
          onStatusChange={create.setStatus}
          onToggleGrade={create.setGradeLevels}
          onModeChange={create.setMode}
          onSourceChange={create.setSourceCourseId}
          onSubmit={create.onSubmit}
          onCancel={() => create.setOpen(false)}
        />
      ) : null}

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading courses…</p>
      ) : null}

      {error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && courses.length === 0 && !create.open ? (
        <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No courses yet. Create one from scratch, or copy units and materials
          from another course. You don’t need a roster to print.
        </p>
      ) : null}

      {courses.length > 0 ? (
        <ul className="mt-6 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {courses.map((course) => {
            const dates = formatDateRange(course.startDate, course.endDate);
            return (
              <li key={course.id}>
                <Link
                  to={coursePath(organization.slug, course.id)}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                      {course.title}
                    </span>
                    {course.description ? (
                      <span className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                        {course.description}
                      </span>
                    ) : null}
                    {dates || course.location ? (
                      <span className="mt-1 block text-[12.5px] text-[var(--ink-faint)]">
                        {[dates, course.location].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  {course.subject ? (
                    <Badge variant="slate">{course.subject}</Badge>
                  ) : null}
                  {course.gradeLevels.length > 0 ? (
                    <Badge variant="neutral">{course.gradeLevels.join(", ")}</Badge>
                  ) : null}
                  {!isCoursePublished(course.visibility) ? (
                    <Badge variant="amber">Unpublished</Badge>
                  ) : null}
                  <Badge variant={course.status === "active" ? "green" : "neutral"}>
                    {courseStatusLabel(course.status)}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
