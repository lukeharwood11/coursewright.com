import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import { Button } from "@/ui/Button";
import {
  formatQuizScore,
  quizGradeStatus,
  quizGradeStatusLabel,
  quizGradingQueue,
  type QuizGradeStatus,
} from "@/quizzes/model/quiz";
import type { QuizAttemptAnswerRecord, QuizAttemptRecord } from "@/quizzes/databridge/quizzes";
import { Badge } from "@/ui/Badge";

type Attempt = QuizAttemptRecord & { label: string; answers: QuizAttemptAnswerRecord[] };

function statusVariant(status: QuizGradeStatus): "amber" | "slate" | "green" {
  if (status === "needs_grading") return "amber";
  if (status === "autograded") return "slate";
  return "green";
}

export function QuizSubmissionQueue({
  attempts,
  timeZone,
  onOpen,
  onGradeNext,
}: {
  attempts: Attempt[];
  timeZone: string;
  onOpen: (attemptId: number) => void;
  onGradeNext: () => void;
}) {
  const waiting = quizGradingQueue(attempts);
  const graded = attempts.filter((attempt) => quizGradeStatus(attempt) === "graded");
  const needs = waiting.filter((attempt) => quizGradeStatus(attempt) === "needs_grading").length;
  const autograded = waiting.length - needs;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Submissions</h2>
          <p className="mt-1 text-[14px] text-[var(--ink)]">
            {needs} need grading · {autograded} autograded · {graded.length} graded
          </p>
        </div>
        {waiting.length > 0 ? (
          <Button type="button" onClick={onGradeNext}>
            <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden />
            Grade next
          </Button>
        ) : null}
      </div>
      {attempts.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">No submissions yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          <QueueGroup
            title="Waiting"
            attempts={waiting}
            timeZone={timeZone}
            onOpen={onOpen}
            empty="Nothing is waiting."
          />
          <QueueGroup
            title="Graded"
            attempts={graded}
            timeZone={timeZone}
            onOpen={onOpen}
            empty="No teacher grades yet."
          />
        </div>
      )}
    </section>
  );
}

function QueueGroup({
  title,
  attempts,
  timeZone,
  onOpen,
  empty,
}: {
  title: string;
  attempts: Attempt[];
  timeZone: string;
  onOpen: (attemptId: number) => void;
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">{title}</h3>
      {attempts.length === 0 ? (
        <p className="mt-2 text-[14px] text-[var(--ink-faint)]">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {attempts.map((attempt) => {
            const status = quizGradeStatus(attempt);
            const score =
              attempt.score != null && attempt.scoreTotal != null
                ? formatQuizScore(attempt.score, attempt.scoreTotal)
                : null;
            return (
              <li key={attempt.id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 text-left hover:border-[var(--line)]"
                  onClick={() => onOpen(attempt.id)}
                >
                  <span>
                    <span className="block text-[14.5px] font-bold text-[var(--ink)]">
                      {attempt.label}
                    </span>
                    <span className="block text-[12.5px] text-[var(--ink-faint)]">
                      {formatSubmittedAt(attempt.submittedAt, timeZone)}
                      {score ? ` · ${score}` : ""}
                    </span>
                  </span>
                  <Badge variant={statusVariant(status)}>{quizGradeStatusLabel(status)}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
