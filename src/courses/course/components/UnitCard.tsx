import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import { formatDateRange } from "@/courses/model/dates";
import { MaterialRow } from "@/materials/material/components/MaterialRow";
import type { MaterialRecord } from "@/materials/databridge/materials";
import { QuizRow } from "@/quizzes/quiz/components/QuizRow";
import type { QuizRecord } from "@/quizzes/databridge/quizzes";
import { mergeOutline } from "@/quizzes/model/outline";
import { UnitAddMenu } from "@/units/unit/components/UnitAddMenu";
import { unitPath, unitPrintPath } from "@/units/model/paths";
import type { UnitRecord } from "@/units/databridge/units";

export function UnitCard({
  orgSlug,
  organizationId,
  unit,
  index,
  materials,
  quizzes,
  attemptByQuizId,
  importantIds,
  canEdit,
  expanded,
  onToggle,
  onMoveUp,
  onMoveDown,
  isLast,
}: {
  orgSlug: string;
  organizationId: number;
  unit: UnitRecord;
  index: number;
  materials: MaterialRecord[];
  quizzes: QuizRecord[];
  attemptByQuizId?: Map<
    number,
    {
      score: number | null;
      scoreTotal: number | null;
      ungradedAnswerCount: number;
    }
  >;
  importantIds: Set<number>;
  canEdit: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isLast: boolean;
}) {
  const dates = formatDateRange(unit.startDate, unit.endDate);
  const outline = mergeOutline(materials, quizzes);
  const materialById = new Map(materials.map((material) => [material.id, material]));
  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const href = unitPath(orgSlug, unit.courseId, unit.id);
  const printHref = unitPrintPath(orgSlug, unit.courseId, unit.id);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--green-tint)] text-[13px] font-extrabold text-[var(--green-deep)]">
          {index + 1}
        </span>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onToggle}
        >
          <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
            {unit.title}
          </span>
          {dates ? (
            <span className="text-[12px] text-[var(--ink-faint)]">{dates}</span>
          ) : null}
        </button>
        {canEdit ? (
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              className="text-[var(--ink-faint)] disabled:opacity-30"
              disabled={index === 0}
              onClick={onMoveUp}
              aria-label="Move unit up"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="text-[var(--ink-faint)] disabled:opacity-30"
              disabled={isLast}
              onClick={onMoveDown}
              aria-label="Move unit down"
            >
              <ArrowDownIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <ButtonLink
          variant="secondary"
          to={printHref}
          className="shrink-0 px-2.5 py-1.5 text-[12px]"
        >
          <PrinterIcon className="h-4 w-4" aria-hidden />
          Print unit
        </ButtonLink>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-[var(--ink-faint)] ${expanded ? "rotate-180" : ""} motion-reduce:transition-none`}
          aria-hidden
        />
      </div>
      {expanded ? (
        <div className="border-t border-[var(--line-soft)]">
          <p className="px-4 pt-3 text-[13px]">
            <Link
              to={href}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Open unit
            </Link>
          </p>
          {outline.length > 0 ? (
            <ul>
              {outline.map((item) => {
                if (item.kind === "quiz") {
                  const quiz = quizById.get(item.id);
                  if (!quiz) return null;
                  return (
                    <QuizRow
                      key={`quiz-${quiz.id}`}
                      orgSlug={orgSlug}
                      courseId={unit.courseId}
                      unitId={unit.id}
                      quizId={quiz.id}
                      title={quiz.title}
                      description={quiz.description}
                      visibility={quiz.visibility}
                      acceptsFrom={quiz.acceptsFrom}
                      acceptsUntil={quiz.acceptsUntil}
                      acceptsTimezone={quiz.acceptsTimezone}
                      attempt={attemptByQuizId?.get(quiz.id) ?? null}
                    />
                  );
                }
                const material = materialById.get(item.id);
                if (!material) return null;
                return (
                  <MaterialRow
                    key={material.id}
                    orgSlug={orgSlug}
                    courseId={unit.courseId}
                    unitId={unit.id}
                    materialId={material.id}
                    title={material.title}
                    description={material.description}
                    kind={material.kind}
                    scheduledDate={material.scheduledDate}
                    dueDate={material.dueDate}
                    importantNow={importantIds.has(material.id)}
                    visibility={material.visibility}
                  />
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-3 text-[13.5px] text-[var(--ink-faint)]">
              No materials in this unit yet.
            </p>
          )}
          {canEdit ? (
            <div className="px-4 pb-4 pt-2">
              <UnitAddMenu
                organizationId={organizationId}
                orgSlug={orgSlug}
                courseId={unit.courseId}
                unitId={unit.id}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
