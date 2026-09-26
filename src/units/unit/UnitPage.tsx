import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { Input } from "@/ui/Input";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PageFormActions } from "@/ui/PageFormActions";
import { useToastOnError } from "@/ui/useToastOnError";
import { formatDateRange } from "@/courses/model/dates";
import { coursePath } from "@/courses/model/paths";
import { UnitAddMenu } from "./components/UnitAddMenu";
import { UnitOutlineList } from "./components/UnitOutlineList";
import { unitPath, unitPrintPath } from "@/units/model/paths";
import { useUnit } from "./hooks/useUnit";

const UNIT_SETTINGS_FORM_ID = "unit-settings-form";

export function UnitPage() {
  const page = useUnit();
  const [editing, setEditing] = useState(false);
  const [confirmRemoveUnit, setConfirmRemoveUnit] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useToastOnError(page.error);

  useEffect(() => {
    if (!page.unit) return;
    setTitle(page.unit.title);
    setStartDate(page.unit.startDate ?? "");
    setEndDate(page.unit.endDate ?? "");
  }, [page.unit]);

  useEffect(() => {
    document.title = page.unit
      ? `${page.unit.title} · Course Wright`
      : "Unit · Course Wright";
  }, [page.unit]);

  if (page.loading) {
    return (
      <PageLoading label="Loading unit…" />
    );
  }

  if (page.notFound || !page.unit || !page.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that unit
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={
              page.isParent
                ? `/my/${page.organization.slug}`
                : coursePath(page.organization.slug, page.courseId)
            }
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to course
          </Link>
        </p>
      </div>
    );
  }

  const dates = formatDateRange(page.unit.startDate, page.unit.endDate);
  const course = page.course;
  const unit = page.unit;
  const printHref = unitPrintPath(
    page.organization.slug,
    course.id,
    unit.id,
  );
  const viewHref = unitPath(page.organization.slug, course.id, unit.id);
  const hasChanges =
    page.canEdit &&
    editing &&
    !unit.deletedAt &&
    (title !== unit.title ||
      startDate !== (unit.startDate ?? "") ||
      endDate !== (unit.endDate ?? ""));

  function resetUnitFields() {
    setTitle(unit.title);
    setStartDate(unit.startDate ?? "");
    setEndDate(unit.endDate ?? "");
  }

  function leaveEdit() {
    resetUnitFields();
    setEditing(false);
  }

  return (
    <div>
      <DetailPageHeader
        backTo={coursePath(page.organization.slug, course.id)}
        backLabel={`Back to ${course.title}`}
        title={unit.title}
        meta={
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            {course.title}
            {dates ? ` · ${dates}` : ""}
          </span>
        }
        actions={
          <>
            {page.canEdit && !unit.deletedAt && editing ? (
              <PageFormActions
                formId={UNIT_SETTINGS_FORM_ID}
                saving={page.saveUnit.isPending}
                hasChanges={hasChanges}
                cancelTo={viewHref}
                onCancel={leaveEdit}
                saveLabel="Save unit"
              />
            ) : null}
            {page.canEdit && !unit.deletedAt && !editing ? (
              <Button type="button" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : null}
            <ButtonLink variant="secondary" to={printHref}>
              <PrinterIcon className="h-5 w-5" aria-hidden />
              Print unit
            </ButtonLink>
          </>
        }
      />
      <div className="px-5 py-6 md:px-8">
      {unit.deletedAt ? (
        <div className="mt-4 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] p-4">
          <p className="text-[14px] text-[var(--amber-deep)]">
            This unit was removed. Restore it to show it on the course again.
          </p>
          {page.canEdit ? (
            <div className="mt-3">
              <Button onClick={() => page.restore.mutate()}>Restore</Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {page.canEdit && !unit.deletedAt && editing ? (
        <form
          id={UNIT_SETTINGS_FORM_ID}
          className="mt-6 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!hasChanges) return;
            page.saveUnit.mutate(
              {
                title: title.trim() || page.unit!.title,
                startDate: startDate || null,
                endDate: endDate || null,
              },
              { onSuccess: () => setEditing(false) },
            );
          }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 md:col-span-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
              <Input
                className="w-full"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Start</span>
              <Input
                className="w-full"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">End</span>
              <Input
                className="w-full"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmRemoveUnit(true)}
              disabled={page.removeUnit.isPending}
            >
              Remove unit
            </Button>
          </div>
        </form>
      ) : null}

      <section className="mt-6">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Materials</h2>
        {page.materials.length > 0 || page.quizzes.length > 0 ? (
          <div className="mt-2">
            <UnitOutlineList
              orgSlug={page.organization.slug}
              courseId={course.id}
              unitId={unit.id}
              materials={page.materials}
              quizzes={page.quizzes}
              attemptByQuizId={page.attemptByQuizId}
              importantIds={page.importantIds}
              canEdit={page.canEdit && !unit.deletedAt}
              fromUnitPage
              onReorder={(ordered) => page.reorderOutline.mutate({ ordered })}
            />
          </div>
        ) : (
          <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
            No materials in this unit yet.
          </p>
        )}
        {page.canEdit && !unit.deletedAt ? (
          <div className="mt-3">
            <UnitAddMenu
              organizationId={page.organization.id}
              orgSlug={page.organization.slug}
              courseId={course.id}
              unitId={unit.id}
              fromUnitPage
            />
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={confirmRemoveUnit}
        title="Remove this unit?"
        body="You can restore it later if you need it again."
        confirmLabel={page.removeUnit.isPending ? "Removing…" : "Remove unit"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemoveUnit(false)}
        onConfirm={() => {
          setConfirmRemoveUnit(false);
          page.removeUnit.mutate();
        }}
      />
      </div>
    </div>
  );
}
