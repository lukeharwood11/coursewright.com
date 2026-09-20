import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { coursePath } from "@/courses/model/paths";
import {
  UnpublishControl,
  VisibilityBanner,
} from "@/materials/material/components/VisibilityBanner";
import { LessonPlanFormFields } from "./components/LessonPlanFormFields";
import { LESSON_PLAN_FORM_ID, useLessonPlanEdit } from "./hooks/useLessonPlanEdit";

export function LessonPlanEditPage() {
  const page = useLessonPlanEdit();

  useEffect(() => {
    document.title = page.isNew
      ? "New lesson plan · Course Wright"
      : page.title
        ? `Edit ${page.title} · Course Wright`
        : "Edit lesson plan · Course Wright";
  }, [page.isNew, page.title]);

  if (page.loading) {
    return (
      <PageLoading label="Loading…" />
    );
  }

  if (!page.canEdit) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Lesson plans
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          Only instructors and admins can add or edit lesson plans.
        </p>
      </div>
    );
  }

  if (page.notFound || !page.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          We couldn’t find that course.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="flex flex-wrap items-center gap-2 text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.isNew ? "New lesson plan" : "Edit lesson plan"}
            {!page.isNew && page.visibility === "published" ? <PublishedBadge /> : null}
          </h1>
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
            Write the week’s plan. Families see it on their calendar after you publish.
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              to={coursePath(page.organization.slug, page.course.id)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to {page.course.title}
            </Link>
          </p>
        </div>
        <PageFormActions
          formId={LESSON_PLAN_FORM_ID}
          saving={page.saving}
          hasChanges={page.hasChanges}
          cancelTo={page.cancelTo}
          saveLabel={page.isNew ? "Save lesson plan" : "Save lesson plan"}
        />
      </div>

      {!page.isNew ? (
        <VisibilityBanner
          visibility={page.visibility}
          canEdit={page.canEdit}
          pending={page.visibilityPending}
          onPublish={() => page.setVisibility.mutate("published")}
        />
      ) : (
        <p className="mt-4 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] px-4 py-3 text-[13.5px] text-[var(--amber-deep)]">
          New lesson plans start unpublished. Publish from the plan after you save.
        </p>
      )}

      <form id={LESSON_PLAN_FORM_ID} className="mt-6" onSubmit={page.onSubmit}>
        <LessonPlanFormFields
          title={page.title}
          weekNote={page.weekNote}
          weekStart={page.weekStart}
          days={page.days}
          materials={page.materials}
          units={page.units}
          onTitle={page.setTitle}
          onWeekNote={page.setWeekNote}
          onWeekStart={page.setWeekStart}
          onDayBody={page.setDayBody}
          onToggleMaterial={page.toggleDayMaterial}
        />
        {page.formError ? (
          <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
            {page.formError}
          </p>
        ) : null}
      </form>

      {!page.isNew ? (
        <UnpublishControl
          visibility={page.visibility}
          canEdit={page.canEdit}
          pending={page.visibilityPending}
          onUnpublish={() => page.setVisibility.mutate("unpublished")}
        />
      ) : null}
    </div>
  );
}
