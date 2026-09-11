import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { resourceShareMessage } from "@/sharing/model/copyLink";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { AddMaterialForm } from "@/materials/material/components/AddMaterialForm";
import { MaterialRow } from "@/materials/material/components/MaterialRow";
import { CourseHeader, PrintHint } from "./components/CourseHeader";
import { CourseVisibilityBanner } from "./components/CourseVisibilityBanner";
import { CourseSidebar } from "./components/CourseSidebar";
import { UnitCard } from "./components/UnitCard";
import { useCourse } from "./hooks/useCourse";
import { coursesPath } from "@/courses/model/paths";

export function CoursePage() {
  const {
    organization,
    canEdit,
    role,
    course,
    copiedFromTitle,
    units,
    topLevelMaterials,
    materialsByUnitId,
    instructors,
    students,
    importantIds,
    loading,
    error,
    notFound,
    addUnit,
    reorderUnit,
    setVisibility,
  } = useCourse();
  const isParent = role === "parent";
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [addingUnit, setAddingUnit] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");

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
            to={isParent ? `/my/${organization.slug}` : coursesPath(organization.slug)}
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
        copiedFromTitle={copiedFromTitle}
        canEdit={canEdit}
        isParent={isParent}
        onShare={() => {
          void navigator.clipboard.writeText(window.location.href);
          toast(resourceShareMessage(course.visibility));
        }}
      />
      <CourseVisibilityBanner
        visibility={course.visibility}
        canEdit={canEdit}
        pending={setVisibility.isPending}
        onPublish={() => setVisibility.mutate("published")}
        onUnpublish={() => setVisibility.mutate("unpublished")}
      />
      <PrintHint />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <section>
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
              Materials
            </h2>
            {topLevelMaterials.length > 0 ? (
              <ul className="mt-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
                {topLevelMaterials.map((material) => (
                  <MaterialRow
                    key={material.id}
                    orgSlug={organization.slug}
                    courseId={course.id}
                    unitId={null}
                    materialId={material.id}
                    title={material.title}
                    description={material.description}
                    kind={material.kind}
                    scheduledDate={material.scheduledDate}
                    importantNow={importantIds.has(material.id)}
                    visibility={material.visibility}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
                Materials without a unit show up here, above the units.
              </p>
            )}
            {canEdit ? (
              <div className="mt-3">
                <AddMaterialForm
                  organizationId={organization.id}
                  orgSlug={organization.slug}
                  courseId={course.id}
                  unitId={null}
                  label="Add material"
                />
              </div>
            ) : null}
          </section>

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
                Units are optional. Add one when you want to group materials.
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
      {error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]">{error}</p>
      ) : null}
    </div>
  );
}
