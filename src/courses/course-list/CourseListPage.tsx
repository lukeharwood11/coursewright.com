import { useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { CourseCard } from "./components/CourseCard";
import { CreateCourseForm } from "./components/CreateCourseForm";
import { useCourseList, useCreateCourse } from "./hooks/useCourseList";

export function CourseListPage() {
  const { organization, courses, catalogByCourseId, loading, error } = useCourseList();
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
          iconKey={create.iconKey}
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
          onIconKeyChange={create.setIconKey}
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
        <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="min-h-0">
              <CourseCard
                course={course}
                orgSlug={organization.slug}
                catalogMeta={catalogByCourseId[course.id]}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
