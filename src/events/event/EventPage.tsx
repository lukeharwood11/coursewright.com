import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPinIcon, PencilSquareIcon, PrinterIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { eventTargetSummary } from "@/events/model/audience";
import { eventEditPath, eventPrintPath } from "@/events/model/paths";
import { formatEventWhen } from "@/events/model/schedule";
import { materialPath } from "@/materials/model/paths";
import { useEvent } from "./hooks/useEvent";

const PageContentView = lazy(async () => {
  const module = await import("@/materials/material/components/PageContentView");
  return { default: module.PageContentView };
});

export function EventPage() {
  const page = useEvent();

  useEffect(() => {
    document.title = page.event
      ? `${page.event.title} · Course Wright`
      : "Event · Course Wright";
  }, [page.event]);

  if (page.loading) return <PageLoading label="Loading event…" />;

  if (page.notFound || !page.event) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that event
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${page.organization.slug}/calendar`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to calendar
          </Link>
        </p>
      </div>
    );
  }

  const event = page.event;
  const names = event.audience === "course" ? event.courseTitles : event.classTitles;
  const when = formatEventWhen(event);

  return (
    <div>
      <DetailPageHeader
        backTo={`/my/${page.organization.slug}/calendar`}
        backLabel="Back to calendar"
        title={event.title}
        description={
          <div className="space-y-1 text-[14px] text-[var(--ink-soft)]">
            <p>{when}</p>
            <p className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink)]">
              <MapPinIcon className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" aria-hidden />
              {event.location}
            </p>
            <p>{eventTargetSummary(names)}</p>
          </div>
        }
        actions={
          <>
            <ButtonLink variant="secondary" to={eventPrintPath(page.organization.slug, event.id)}>
              <PrinterIcon className="h-5 w-5" aria-hidden />
              Print
            </ButtonLink>
            {page.canEdit ? (
              <ButtonLink variant="secondary" to={eventEditPath(page.organization.slug, event.id)}>
                <PencilSquareIcon className="h-5 w-5" aria-hidden />
                Edit
              </ButtonLink>
            ) : null}
            {page.canEdit ? (
              <Button variant="secondary" onClick={() => page.setConfirmRemove(true)}>
                <TrashIcon className="h-5 w-5" aria-hidden />
                Remove
              </Button>
            ) : null}
          </>
        }
      />

      <div className="px-5 py-6 md:px-8">
        <Suspense fallback={<PageLoading embedded label="Loading page…" />}>
          <PageContentView
            blocks={event.blocks}
            viewKey={`event-${event.id}`}
            showAnswers={page.canEdit}
          />
        </Suspense>

        {event.materials.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Materials</h2>
            <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
              {event.materials.map((material) => (
                <li key={material.id}>
                  <Link
                    to={materialPath({
                      orgSlug: page.organization.slug,
                      courseId: material.courseId,
                      unitId: material.unitId,
                      materialId: material.id,
                    })}
                    className="block px-4 py-3 text-[14.5px] font-semibold text-[var(--ink)] hover:bg-[var(--green-tint)]"
                  >
                    {material.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={page.confirmRemove}
        title="Remove this event?"
        body="It comes off the calendar for everyone it was shared with."
        confirmLabel={page.removing ? "Removing…" : "Remove"}
        cancelLabel="Keep event"
        onCancel={() => page.setConfirmRemove(false)}
        onConfirm={() => page.remove()}
      />
    </div>
  );
}
