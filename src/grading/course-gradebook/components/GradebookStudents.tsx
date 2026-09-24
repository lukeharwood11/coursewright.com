import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { formatGradeDisplay } from "@/grading/model/scale";
import type { GradingScale } from "@/grading/model/scale";
import type { GradebookRow } from "@/grading/databridge/gradebook";
import { FinalOverrideControls } from "./FinalOverrideControls";

type QuizColumn = { id: number; title: string };
type MaterialColumn = { id: number; title: string };
type FinalDraft = { label: string; note: string };

export function GradebookStudents({
  rows,
  quizzes,
  materials,
  scale,
  studentPathFor,
  draftFor,
  savingFinal,
  onDraftChange,
  onSaveFinal,
  onClearFinal,
  onOpenAttempt,
  onOpenSubmission,
}: {
  rows: GradebookRow[];
  quizzes: QuizColumn[];
  materials: MaterialColumn[];
  scale: GradingScale;
  studentPathFor: (studentProfileId: number) => string;
  draftFor: (row: GradebookRow) => FinalDraft;
  savingFinal: boolean;
  onDraftChange: (enrollmentId: number, draft: FinalDraft) => void;
  onSaveFinal: (row: GradebookRow, label: string, note: string) => void;
  onClearFinal: (row: GradebookRow) => void;
  onOpenAttempt: (attemptId: number) => void;
  onOpenSubmission: (submissionId: number) => void;
}) {
  const [expandedEnrollments, setExpandedEnrollments] = useState<Set<number>>(() => new Set());

  if (rows.length === 0) {
    return <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No grades yet.</p>;
  }

  function toggleEnrollment(enrollmentId: number) {
    setExpandedEnrollments((current) => {
      const next = new Set(current);
      if (next.has(enrollmentId)) {
        next.delete(enrollmentId);
      } else {
        next.add(enrollmentId);
      }
      return next;
    });
  }

  return (
    <ul className="mt-3 flex flex-col gap-3">
      {rows.map((row) => {
        const expanded = expandedEnrollments.has(row.enrollmentId);
        const panelId = `gradebook-student-${row.enrollmentId}`;
        const draft = draftFor(row);
        const shown = formatGradeDisplay({
          percent: row.finalPercent,
          scale,
          overrideLabel: scale.mode === "none" || !row.overrideLabel ? null : row.overrideLabel,
        });
        const attemptedCount = quizzes.reduce(
          (count, quiz) =>
            row.items.some((item) => item.quizId === quiz.id) ? count + 1 : count,
          0,
        );
        const needsGradeCount = quizzes.reduce(
          (count, quiz) =>
            row.items.some((item) => item.quizId === quiz.id && !item.locked) ? count + 1 : count,
          0,
        );
        const materialAttempted = materials.reduce(
          (count, material) =>
            row.items.some((item) => item.materialId === material.id) ? count + 1 : count,
          0,
        );
        const materialNeeds = materials.reduce(
          (count, material) =>
            row.items.some((item) => item.materialId === material.id && !item.locked)
              ? count + 1
              : count,
          0,
        );
        const quizSummary =
          quizzes.length === 0 && materials.length === 0
            ? "No quizzes or gradable materials"
            : [
                quizzes.length > 0
                  ? `${attemptedCount} of ${quizzes.length} quizzes`
                  : null,
                materials.length > 0
                  ? `${materialAttempted} of ${materials.length} materials`
                  : null,
                needsGradeCount + materialNeeds > 0
                  ? `${needsGradeCount + materialNeeds} need a grade`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ");

        return (
          <li
            key={row.enrollmentId}
            className="overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link
                  to={studentPathFor(row.studentProfileId)}
                  className="break-words font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
                >
                  {row.studentName}
                </Link>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">{quizSummary}</p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-5">
                <div className="text-left sm:text-right">
                  <p className="text-[12px] font-bold text-[var(--ink-soft)]">Final</p>
                  <p className="text-[14.5px] font-extrabold text-[var(--ink)]">{shown}</p>
                  {row.overrideLabel && row.overriddenAt ? (
                    <p className="mt-0.5 text-[12px] text-[var(--ink-faint)]">
                      {row.overriddenByName ? `${row.overriddenByName} · ` : ""}
                      {new Date(row.overriddenAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] font-bold text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] motion-reduce:transition-none"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  aria-label={`${expanded ? "Hide" : "Show"} grades for ${row.studentName}`}
                  onClick={() => toggleEnrollment(row.enrollmentId)}
                >
                  {expanded ? "Hide details" : "Show details"}
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform motion-reduce:transition-none ${
                      expanded ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
              </div>
            </div>

            {expanded ? (
              <div
                id={panelId}
                className={`grid gap-5 border-t border-[var(--line-soft)] p-4 ${
                  scale.mode === "none"
                    ? ""
                    : "lg:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)]"
                }`}
              >
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">Quizzes and materials</h3>
                  {quizzes.length === 0 && materials.length === 0 ? (
                    <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
                      No quizzes or gradable materials in this course.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
                      {quizzes.map((quiz) => {
                        const item = row.items.find((entry) => entry.quizId === quiz.id);
                        if (!item) {
                          return (
                            <li
                              key={quiz.id}
                              className="flex items-center justify-between gap-3 py-3 text-[14px]"
                            >
                              <span className="min-w-0 break-words text-[var(--ink-soft)]">
                                {quiz.title}
                              </span>
                              <span className="shrink-0 text-[var(--ink-faint)]">—</span>
                            </li>
                          );
                        }
                        const cell = item.locked
                          ? formatGradeDisplay({ percent: item.percent, scale })
                          : "Needs grade";
                        return (
                          <li key={quiz.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 rounded-[4px] py-3 text-left text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                              onClick={() => {
                                if (item.attemptId != null) onOpenAttempt(item.attemptId);
                              }}
                            >
                              <span className="min-w-0 break-words text-[var(--ink-soft)]">
                                {quiz.title}
                              </span>
                              <span className="shrink-0 font-semibold text-[var(--ink)] hover:text-[var(--green-deep)]">
                                {cell}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {materials.map((material) => {
                        const item = row.items.find((entry) => entry.materialId === material.id);
                        const submissionId = item?.submissionId;
                        if (!item || submissionId == null) {
                          return (
                            <li
                              key={`material-${material.id}`}
                              className="flex items-center justify-between gap-3 py-3 text-[14px]"
                            >
                              <span className="min-w-0 break-words text-[var(--ink-soft)]">
                                {material.title}
                              </span>
                              <span className="shrink-0 text-[var(--ink-faint)]">—</span>
                            </li>
                          );
                        }
                        const cell = item.locked
                          ? formatGradeDisplay({ percent: item.percent, scale })
                          : "Needs grade";
                        return (
                          <li key={`material-${material.id}`}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 rounded-[4px] py-3 text-left text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                              onClick={() => onOpenSubmission(submissionId)}
                            >
                              <span className="min-w-0 break-words text-[var(--ink-soft)]">
                                {material.title}
                              </span>
                              <span className="shrink-0 font-semibold text-[var(--ink)] hover:text-[var(--green-deep)]">
                                {cell}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {scale.mode === "none" ? null : (
                  <div className="border-t border-[var(--line-soft)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <h3 className="mb-2 text-[13px] font-bold text-[var(--ink-soft)]">
                      Final grade
                    </h3>
                    <FinalOverrideControls
                      studentName={row.studentName}
                      scale={scale}
                      draft={draft}
                      hasOverride={Boolean(row.overrideLabel)}
                      saving={savingFinal}
                      onDraftChange={(next) => onDraftChange(row.enrollmentId, next)}
                      onSave={() => onSaveFinal(row, draft.label, draft.note)}
                      onClear={() => onClearFinal(row)}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
