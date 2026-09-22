import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { coursePath } from "@/courses/model/paths";
import { lessonPlanEditPath } from "@/lesson-plans/model/paths";
import { lessonPlanDaysToShow, weekdayDateLabel } from "@/lesson-plans/model/validate";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";
import {
  UnpublishControl,
  VisibilityBanner,
} from "@/materials/material/components/VisibilityBanner";
import { LessonPlanMaterialList } from "./components/LessonPlanMaterialList";
import { useLessonPlan } from "./hooks/useLessonPlan";
import { useToastOnError } from "@/ui/useToastOnError";

export function LessonPlanPage() {
  const page = useLessonPlan();
  const [confirmRemove, setConfirmRemove] = useState(false);
  useToastOnError(page.error);

  useEffect(() => {
    document.title = page.plan
      ? `${page.plan.title} · Course Wright`
      : "Lesson plan · Course Wright";
  }, [page.plan]);

  if (page.loading) {
    return (
      <PageLoading label="Loading lesson plan…" />
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

  const days = lessonPlanDaysToShow(page.days);
  const course = page.course;

  return (
    <div>
      <DetailPageHeader
        backTo={
          page.isParent
            ? `/my/${page.organization.slug}`
            : coursePath(page.organization.slug, page.course.id)
        }
        backLabel={
          page.isParent ? "Back to this week" : `Back to ${page.course.title}`
        }
        title={page.plan.title}
        meta={
          <>
            {page.canEdit && lessonPlanIsPublished(page.plan.visibility) ? (
              <PublishedBadge />
            ) : null}
            <Badge variant="neutral">
              Week of {weekdayDateLabel(page.plan.weekStart)}
            </Badge>
            <Badge variant="slate">{page.course.title}</Badge>
          </>
        }
        actions={
          page.canEdit ? (
            <>
              <ButtonLink
                variant="secondary"
                to={lessonPlanEditPath(
                  page.organization.slug,
                  page.course.id,
                  page.plan.id,
                )}
              >
                <PencilSquareIcon className="h-5 w-5" aria-hidden />
                Edit
              </ButtonLink>
              <Button
                variant="secondary"
                onClick={() => setConfirmRemove(true)}
                disabled={page.remove.isPending}
              >
                Remove
              </Button>
            </>
          ) : null
        }
      />
      <div className="px-5 py-6 md:px-8">
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

      {days.length > 0 ? (
        <div className="mt-8 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
          {days.map((day) => (
            <section
              key={day.date}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
            >
              <h2 className="text-[14px] font-extrabold text-[var(--ink)]">
                {weekdayDateLabel(day.date)}
              </h2>
              {day.body ? (
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--ink)]">
                  {day.body}
                </p>
              ) : null}
              {day.materials.length > 0 ? (
                <>
                  <div className="my-3 border-t border-[var(--line)]" />
                  <LessonPlanMaterialList
                    orgSlug={page.organization.slug}
                    courseId={course.id}
                    materials={day.materials}
                    showUnpublished={page.canEdit}
                  />
                </>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}

      <UnpublishControl
        visibility={page.plan.visibility}
        canEdit={page.canEdit}
        pending={page.setVisibility.isPending}
        onUnpublish={() => page.setVisibility.mutate("unpublished")}
      />
      </div>

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
