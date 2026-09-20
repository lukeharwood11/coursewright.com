import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { InfoHint } from "@/ui/InfoHint";
import type { LessonPlanListItem } from "@/lesson-plans/databridge/lessonPlans";
import { lessonPlanPath, newLessonPlanPath } from "@/lesson-plans/model/paths";
import { weekdayDateLabel } from "@/lesson-plans/model/validate";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";

const LESSON_PLAN_HINT =
  "A week’s plan for families, with the materials that go with each day.";

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
      <div className="flex items-center gap-1.5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Lesson plans</h2>
        <InfoHint label="What is a lesson plan?">{LESSON_PLAN_HINT}</InfoHint>
      </div>

      {visible.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
          {canEdit
            ? "No lesson plans yet."
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
        <div className="mt-3">
          <ButtonLink variant="ghost" fullWidth to={newLessonPlanPath(orgSlug, courseId)}>
            <PlusIcon className="h-5 w-5" aria-hidden />
            Add lesson plan
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
