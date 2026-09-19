import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { coursePath } from "@/courses/model/paths";
import { lessonPlanEditPath } from "@/lesson-plans/model/paths";
import { emptyDaysForWeek, weekdayDateLabel } from "@/lesson-plans/model/validate";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";
import {
  UnpublishControl,
  VisibilityBanner,
} from "@/materials/material/components/VisibilityBanner";
import { LessonPlanMaterialList } from "./components/LessonPlanMaterialList";
import { useLessonPlan } from "./hooks/useLessonPlan";

export function LessonPlanPage() {
  const page = useLessonPlan();
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    document.title = page.plan
      ? `${page.plan.title} · Course Wright`
      : "Lesson plan · Course Wright";
  }, [page.plan]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading lesson plan…</p>
      </div>
    );
  }

  if (page.unavailable) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          This plan isn’t ready yet
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Your teacher is still working on this week’s plan. Check back after they
          publish it.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${page.organization.slug}`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to this week
          </Link>
        </p>
      </div>
    );
  }

  if (page.notFound || !page.plan || !page.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that lesson plan
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
            Back
          </Link>
        </p>
      </div>
    );
  }

  const slots = emptyDaysForWeek(page.plan.weekStart);
  const byDate = new Map(page.days.map((day) => [day.date, day]));
  const course = page.course;


  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="flex flex-wrap items-center gap-2 text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.plan.title}
            {page.canEdit && lessonPlanIsPublished(page.plan.visibility) ? (
              <PublishedBadge />
            ) : null}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral">
              Week of {weekdayDateLabel(page.plan.weekStart)}
            </Badge>
            <Badge variant="slate">{page.course.title}</Badge>
          </div>
          <p className="mt-3 text-[13px]">
            <Link
              to={
                page.isParent
                  ? `/my/${page.organization.slug}`
                  : coursePath(page.organization.slug, page.course.id)
              }
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {page.isParent ? "Back to this week" : `Back to ${page.course.title}`}
            </Link>
          </p>
        </div>
        {page.canEdit ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              variant="secondary"
              to={lessonPlanEditPath(
                page.organization.slug,
                page.course.id,
                page.plan.id,
              )}
            >
              Edit
            </ButtonLink>
            <Button
              variant="secondary"
              onClick={() => setConfirmRemove(true)}
              disabled={page.remove.isPending}
            >
              Remove
            </Button>
          </div>
        ) : null}
      </div>

      <VisibilityBanner
        visibility={page.plan.visibility}
        canEdit={page.canEdit}
        pending={page.setVisibility.isPending}
        onPublish={() => page.setVisibility.mutate("published")}
      />

      {page.plan.weekNote ? (
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
          {page.plan.weekNote}
        </p>
      ) : null}

      <div className="mt-8 grid gap-3 md:grid-cols-7">
        {slots.map((slot) => {
          const day = byDate.get(slot.date);
          return (
            <section
              key={slot.date}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3"
            >
              <h2 className="text-[12.5px] font-bold text-[var(--ink)]">
                {weekdayDateLabel(slot.date)}
              </h2>
              {day?.body ? (
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--ink)]">
                  {day.body}
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-[var(--ink-faint)]">No plan for this day.</p>
              )}
              <div className="my-3 border-t border-[var(--line)]" />
              <LessonPlanMaterialList
                orgSlug={page.organization.slug}
                courseId={course.id}
                materials={day?.materials ?? []}
                showUnpublished={page.canEdit}
              />
            </section>
          );
        })}
      </div>

      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {page.error}
        </p>
      ) : null}

      <UnpublishControl
        visibility={page.plan.visibility}
        canEdit={page.canEdit}
        pending={page.setVisibility.isPending}
        onUnpublish={() => page.setVisibility.mutate("unpublished")}
      />

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this lesson plan?"
        body="Families won’t see it on their calendar anymore. You can make a new one later if you need it again."
        confirmLabel={page.remove.isPending ? "Removing…" : "Remove"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          page.remove.mutate();
        }}
      />
    </div>
  );
}
