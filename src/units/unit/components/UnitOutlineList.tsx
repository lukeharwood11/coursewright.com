import { useMemo } from "react";
import type { MaterialRecord } from "@/materials/databridge/materials";
import { MaterialRow } from "@/materials/material/components/MaterialRow";
import type { QuizRecord } from "@/quizzes/databridge/quizzes";
import { QuizRow } from "@/quizzes/quiz/components/QuizRow";
import {
  mergeOutline,
  outlineItemKey,
  type OutlineItem,
} from "@/quizzes/model/outline";
import { DragHandle } from "@/ui/DragHandle";
import { VerticalReorderList } from "@/ui/VerticalReorderList";

export function UnitOutlineList({
  orgSlug,
  courseId,
  unitId,
  materials,
  quizzes,
  attemptByQuizId,
  importantIds,
  canEdit,
  fromUnitPage = false,
  onReorder,
}: {
  orgSlug: string;
  courseId: number;
  unitId: number;
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
  fromUnitPage?: boolean;
  onReorder: (ordered: OutlineItem[]) => void;
}) {
  const outline = useMemo(
    () => mergeOutline(materials, quizzes),
    [materials, quizzes],
  );
  const materialById = new Map(materials.map((material) => [material.id, material]));
  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

  if (outline.length === 0) {
    return null;
  }

  return (
    <VerticalReorderList
      items={outline}
      getKey={outlineItemKey}
      disabled={!canEdit}
      onOrderCommit={onReorder}
      className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
      itemClassName="flex items-stretch border-t border-[var(--line-soft)] first:border-t-0"
      renderItem={(item, { dragHandleProps }) => {
        if (item.kind === "quiz") {
          const quiz = quizById.get(item.id);
          if (!quiz) return null;
          return (
            <>
              <div className="min-w-0 flex-1">
                <QuizRow
                  as="div"
                  orgSlug={orgSlug}
                  courseId={courseId}
                  unitId={unitId}
                  fromUnitPage={fromUnitPage}
                  quizId={quiz.id}
                  title={quiz.title}
                  description={quiz.description}
                  visibility={quiz.visibility}
                  acceptsFrom={quiz.acceptsFrom}
                  acceptsUntil={quiz.acceptsUntil}
                  acceptsTimezone={quiz.acceptsTimezone}
                  attempt={attemptByQuizId?.get(quiz.id) ?? null}
                  className="border-t-0"
                />
              </div>
              {dragHandleProps ? (
                <div className="flex items-center pr-1">
                  <DragHandle {...dragHandleProps} />
                </div>
              ) : null}
            </>
          );
        }
        const material = materialById.get(item.id);
        if (!material) return null;
        return (
          <>
            <div className="min-w-0 flex-1">
              <MaterialRow
                as="div"
                orgSlug={orgSlug}
                courseId={courseId}
                unitId={unitId}
                fromUnitPage={fromUnitPage}
                materialId={material.id}
                title={material.title}
                description={material.description}
                kind={material.kind}
                scheduledDate={material.scheduledDate}
                dueDate={material.dueDate}
                importantNow={importantIds.has(material.id)}
                visibility={material.visibility}
                className="border-t-0"
              />
            </div>
            {dragHandleProps ? (
              <div className="flex items-center pr-1">
                <DragHandle {...dragHandleProps} />
              </div>
            ) : null}
          </>
        );
      }}
    />
  );
}
