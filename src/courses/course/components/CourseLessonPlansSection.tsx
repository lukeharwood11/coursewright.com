import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import type { LessonPlanListItem } from "@/lesson-plans/databridge/lessonPlans";
import { lessonPlanPath, newLessonPlanPath } from "@/lesson-plans/model/paths";
import { weekdayDateLabel } from "@/lesson-plans/model/validate";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";
import { newAnnouncementPath } from "@/announcements/model/paths";

function PlanRow({
  orgSlug,
  plan,
  showStatus,
}: {
  orgSlug: string;
  plan: LessonPlanListItem;
  showStatus: boolean;
}) {
  const countLabel =
    plan.materialCount === 1 ? "1 material" : `${plan.materialCount} materials`;

  return (
    <li>
      <Link
        to={lessonPlanPath(orgSlug, plan.courseId, plan.id)}
        className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--green-tint)]"
      >
        <span className="text-[14.5px] font-semibold text-[var(--ink)]">{plan.title}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          {showStatus ? (
            <Badge variant={lessonPlanIsPublished(plan.visibility) ? "green" : "amber"}>
              {lessonPlanIsPublished(plan.visibility) ? "Published" : "Unpublished"}
            </Badge>
          ) : null}
          <span className="text-[12.5px] text-[var(--ink-soft)]">
            Week of {weekdayDateLabel(plan.weekStart)}
          </span>
          <span className="text-[12.5px] text-[var(--ink-faint)]">{countLabel}</span>
        </span>
      </Link>
    </li>
  );
}

export function CourseLessonPlansSection({
  orgSlug,
  courseId,
  plans,
  canEdit,
  isParent,
}: {
  orgSlug: string;
  courseId: number;
  plans: LessonPlanListItem[];
  canEdit: boolean;
  isParent: boolean;
}) {
  const visible = isParent
    ? plans.filter((row) => lessonPlanIsPublished(row.visibility))
    : plans;

  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Lesson plans</h2>
      <p className="mt-0.5 text-[13px] text-[var(--ink-faint)]">
        A week’s plan for families, with the materials that go with each day.
      </p>

      {visible.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
          {canEdit
            ? "Add a lesson plan when you want this week’s work in one place on the family calendar."
            : "No published lesson plans from this course right now."}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {visible.map((plan) => (
            <PlanRow
              key={plan.id}
              orgSlug={orgSlug}
              plan={plan}
              showStatus={canEdit}
            />
          ))}
        </ul>
      )}

      {canEdit ? (
        <div className="mt-3 flex flex-col gap-2">
          <ButtonLink variant="ghost" fullWidth to={newLessonPlanPath(orgSlug, courseId)}>
            Add lesson plan
          </ButtonLink>
          <ButtonLink
            variant="ghost"
            fullWidth
            to={newAnnouncementPath(orgSlug, {
              audience: "course",
              courseId,
            })}
          >
            Announce to this course
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
