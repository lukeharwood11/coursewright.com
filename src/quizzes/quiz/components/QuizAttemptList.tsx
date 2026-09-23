import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import { Button } from "@/ui/Button";
import {
  attemptIsFullyGraded,
  formatQuizScore,
  latestAttemptsByStudent,
  quizAnswerGrade,
} from "@/quizzes/model/quiz";
import type { QuizAttemptAnswerRecord, QuizAttemptRecord } from "@/quizzes/databridge/quizzes";
import { QuizAnswerGradeBadge } from "./QuizAnswerGradeBadge";

export function QuizAttemptList({
  attempts,
  timeZone,
  showAll,
  canGrade = false,
  gradingKey = null,
  onGrade,
}: {
  attempts: Array<QuizAttemptRecord & { label: string; answers: QuizAttemptAnswerRecord[] }>;
  timeZone: string;
  showAll: boolean;
  canGrade?: boolean;
  gradingKey?: string | null;
  onGrade?: (args: {
    attemptId: number;
    questionId: number;
    isCorrect: boolean;
  }) => void;
}) {
  if (attempts.length === 0) return null;
  const visible = showAll ? attempts : latestAttemptsByStudent(attempts);
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
        {showAll ? "Entries" : visible.length > 1 ? "Latest entries" : "Your entry"}
      </h2>
      <ul className="mt-2 flex flex-col gap-3">
        {visible.map((attempt) => {
          const fullyGraded = attemptIsFullyGraded(attempt.answers);
          const showScore =
            attempt.score != null &&
            attempt.scoreTotal != null &&
            (showAll || fullyGraded);
          return (
            <li
              key={attempt.id}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
            >
              <p className="text-[14.5px] font-bold text-[var(--ink)]">{attempt.label}</p>
              <p className="text-[12.5px] text-[var(--ink-faint)]">
                {formatSubmittedAt(attempt.submittedAt, timeZone)}
                {showScore
                  ? ` · ${formatQuizScore(attempt.score!, attempt.scoreTotal!)}`
                  : " · Submitted"}
                {showAll && attempt.score != null && !fullyGraded
                  ? " · Waiting on short answers"
                  : null}
              </p>
              {showAll ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {attempt.answers.map((answer) => {
                    const grade = quizAnswerGrade(answer.isCorrect);
                    const busy =
                      gradingKey === `${attempt.id}:${answer.questionId}`;
                    return (
                      <li key={`${attempt.id}-${answer.questionId}`} className="text-[14px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--ink)]">
                            {answer.promptSnapshot.trim() || "Question"}
                          </p>
                          <QuizAnswerGradeBadge grade={grade} />
                        </div>
                        <p className="text-[var(--ink-soft)]">
                          {answer.selectedSummary.trim() || "No answer"}
                        </p>
                        {canGrade && onGrade && grade === "pending" ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-2.5 py-1.5 text-[12px]"
                              disabled={busy}
                              onClick={() =>
                                onGrade({
                                  attemptId: attempt.id,
                                  questionId: answer.questionId,
                                  isCorrect: true,
                                })
                              }
                            >
                              Mark correct
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-2.5 py-1.5 text-[12px]"
                              disabled={busy}
                              onClick={() =>
                                onGrade({
                                  attemptId: attempt.id,
                                  questionId: answer.questionId,
                                  isCorrect: false,
                                })
                              }
                            >
                              Mark incorrect
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
