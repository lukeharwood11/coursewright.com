import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PlusIcon } from "@heroicons/react/24/outline";
import { resourceShareMessage } from "@/sharing/model/copyLink";
import { Button } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import { CourseHeader } from "./components/CourseHeader";
import { CourseVisibilityBanner } from "./components/CourseVisibilityBanner";
import {
  CourseOutline,
  CourseOutlineToggle,
} from "./components/CourseOutline";
import { CourseSidebar } from "./components/CourseSidebar";
import { CourseEventsSection } from "./components/CourseEventsSection";
import { CourseLessonPlansSection } from "./components/CourseLessonPlansSection";
import { useCourseEvents } from "./hooks/useCourseEvents";
import { UnitCard } from "./components/UnitCard";
import { useCourse } from "./hooks/useCourse";
import { coursesPath } from "@/courses/model/paths";

export function CoursePage() {
  const {
    organization,
    gradeLabels,
    canEdit,
    isParent,
    course,
    units,
    topLevelMaterials,
    materialsByUnitId,
    quizzesByUnitId,
    attemptByQuizId,
    instructors,
    students,
    importantIds,
    lessonPlans,
    loading,
    error,
    notFound,
    addUnit,
    reorderUnit,
    setVisibility,
  } = useCourse();
  const eventsQuery = useCourseEvents(course?.id ?? NaN, Boolean(course));
  useToastOnError(error);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [addingUnit, setAddingUnit] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");
  const [outlineOpen, setOutlineOpen] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1280px)").matches,
  );

  useEffect(() => {
    document.title = course
      ? `${course.title} · Course Wright`
      : "Course · Course Wright";
  }, [course]);

  const defaultExpanded = useMemo(() => {
    const next: Record<number, boolean> = {};
    units.forEach((unit) => {
      next[unit.id] = true;
    });
    return next;
  }, [units]);

  if (loading) {
    return (
      <PageLoading label="Loading course…" />
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
        <p className="mt-4 text-[13px]">
          <Link
            to={coursesPath(organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to courses
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <CourseHeader
        orgSlug={organization.slug}
        courseId={course.id}
        title={course.title}
        description={course.description}
        location={course.location}
        subject={course.subject}
        status={course.status}
        visibility={course.visibility}
        startDate={course.startDate}
        endDate={course.endDate}
        gradeLevels={course.gradeLevels}
        gradeLabels={gradeLabels}
        canEdit={canEdit}
        isParent={isParent}
        onShare={() => {
          void navigator.clipboard.writeText(window.location.href);
          toast(resourceShareMessage(course.visibility));
        }}
      />
      <div className="px-5 py-6 md:px-8">
      <CourseVisibilityBanner
        visibility={course.visibility}
        canEdit={canEdit}
        pending={setVisibility.isPending}
        onPublish={() => setVisibility.mutate("published")}
      />
      {!outlineOpen ? (
        <div className="mt-6">
          <CourseOutlineToggle onOpen={() => setOutlineOpen(true)} />
        </div>
      ) : null}

      <div
        className={`grid gap-6 ${
          outlineOpen
            ? "mt-6 xl:grid-cols-[14rem_minmax(0,1fr)_16rem]"
            : "mt-4 lg:grid-cols-[minmax(0,1fr)_16rem]"
        }`}
      >
        <CourseOutline
          orgSlug={organization.slug}
          courseId={course.id}
          units={units}
          topLevelMaterials={topLevelMaterials}
          materialsByUnitId={materialsByUnitId}
          quizzesByUnitId={quizzesByUnitId}
          open={outlineOpen}
          onClose={() => setOutlineOpen(false)}
        />
        <div className="min-w-0">
          <CourseLessonPlansSection
            orgSlug={organization.slug}
            courseId={course.id}
            plans={lessonPlans}
            canEdit={canEdit}
            isParent={isParent}
          />
          <CourseEventsSection
            orgSlug={organization.slug}
            courseId={course.id}
            events={eventsQuery.data ?? []}
            canEdit={canEdit}
          />

          <section className="mt-8">
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Units</h2>
            <div className="mt-2 flex flex-col gap-3">
              {units.map((unit, index) => (
                <UnitCard
                  key={unit.id}
                  orgSlug={organization.slug}
                  organizationId={organization.id}
                  unit={unit}
                  index={index}
                  materials={materialsByUnitId[unit.id] ?? []}
                  quizzes={quizzesByUnitId[unit.id] ?? []}
                  attemptByQuizId={attemptByQuizId}
                  importantIds={importantIds}
                  canEdit={canEdit}
                  expanded={expanded[unit.id] ?? defaultExpanded[unit.id] ?? true}
                  onToggle={() =>
                    setExpanded((current) => ({
                      ...current,
                      [unit.id]: !(current[unit.id] ?? true),
                    }))
                  }
                  onMoveUp={() =>
                    reorderUnit.mutate({ id: unit.id, direction: "up" })
                  }
                  onMoveDown={() =>
                    reorderUnit.mutate({ id: unit.id, direction: "down" })
                  }
                  isLast={index === units.length - 1}
                />
              ))}
            </div>
            {units.length === 0 ? (
              <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
                Create a new unit to start adding material.
              </p>
            ) : null}
            {canEdit ? (
              addingUnit ? (
                <form
                  className="mt-3 flex flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addUnit.mutate(unitTitle, {
                      onSuccess: () => {
                        setUnitTitle("");
                        setAddingUnit(false);
                      },
                    });
                  }}
                >
                  <Input
                    value={unitTitle}
                    onChange={(event) => setUnitTitle(event.target.value)}
                    placeholder="Unit title"
                    required
                  />
                  <Button type="submit" disabled={addUnit.isPending}>
                    {addUnit.isPending ? "Adding…" : "Add unit"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAddingUnit(false)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <div className="mt-3">
                  <Button variant="ghost" fullWidth onClick={() => setAddingUnit(true)}>
                    <PlusIcon className="h-5 w-5" aria-hidden />
                    Add unit
                  </Button>
                </div>
              )
            ) : null}
          </section>
        </div>
        <CourseSidebar
          orgSlug={organization.slug}
          courseId={course.id}
          instructors={instructors}
          students={students}
          canEdit={canEdit}
        />
      </div>
      </div>
    </div>
  );
}
