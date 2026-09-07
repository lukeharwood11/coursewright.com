import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownIcon, ArrowUpIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { formatDateRange } from "@/courses/model/dates";
import { coursePath } from "@/courses/model/paths";
import { AddMaterialForm } from "@/materials/material/components/AddMaterialForm";
import { MaterialRow } from "@/materials/material/components/MaterialRow";
import { unitPrintPath } from "@/units/model/paths";
import { useUnit } from "./hooks/useUnit";

export function UnitPage() {
  const page = useUnit();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading unit…</p>
      </div>
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

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {unit.title}
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
            {course.title}
            {dates ? ` · ${dates}` : ""}
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              to={coursePath(page.organization.slug, course.id)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to {course.title}
            </Link>
          </p>
        </div>
        <ButtonLink variant="secondary" to={printHref}>
          <PrinterIcon className="h-5 w-5" aria-hidden />
          Print unit
        </ButtonLink>
      </div>

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

      {page.canEdit && !unit.deletedAt ? (
        <form
          className="mt-6 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            page.saveUnit.mutate({
              title: title.trim() || page.unit!.title,
              startDate: startDate || null,
              endDate: endDate || null,
            });
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
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Start</span>
              <Input
                className="w-full"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">End</span>
              <Input
                className="w-full"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={page.saveUnit.isPending}>
              {page.saveUnit.isPending ? "Saving…" : "Save unit"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!window.confirm("Remove this unit? You can restore it later.")) {
                  return;
                }
                page.removeUnit.mutate();
              }}
            >
              Remove unit
            </Button>
          </div>
        </form>
      ) : null}

      <section className="mt-6">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Materials</h2>
        {page.materials.length > 0 ? (
          <ul className="mt-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
            {page.materials.map((material, index) => (
              <li key={material.id} className="flex items-stretch">
                {page.canEdit && !unit.deletedAt ? (
                  <div className="flex flex-col justify-center gap-1 border-t border-[var(--line-soft)] px-2 first:border-t-0">
                    <button
                      type="button"
                      className="text-[var(--ink-faint)] disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() =>
                        page.reorderMaterial.mutate({ id: material.id, direction: "up" })
                      }
                      aria-label="Move up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="text-[var(--ink-faint)] disabled:opacity-30"
                      disabled={index === page.materials.length - 1}
                      onClick={() =>
                        page.reorderMaterial.mutate({
                          id: material.id,
                          direction: "down",
                        })
                      }
                      aria-label="Move down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <MaterialRow
                    orgSlug={page.organization.slug}
                    courseId={course.id}
                    unitId={unit.id}
                    materialId={material.id}
                    title={material.title}
                    description={material.description}
                    kind={material.kind}
                    scheduledDate={material.scheduledDate}
                    importantNow={page.importantIds.has(material.id)}
                    visibility={material.visibility}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
            No materials in this unit yet.
          </p>
        )}
        {page.canEdit && !unit.deletedAt ? (
          <div className="mt-3">
            <AddMaterialForm
              organizationId={page.organization.id}
              orgSlug={page.organization.slug}
              courseId={course.id}
              unitId={unit.id}
              label="Add material to this unit"
            />
          </div>
        ) : null}
      </section>

      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]">{page.error}</p>
      ) : null}
    </div>
  );
}
