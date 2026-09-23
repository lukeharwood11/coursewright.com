import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import {
  attemptIsFullyGraded,
  formatQuizScore,
  latestAttemptsByStudent,
} from "@/quizzes/model/quiz";
import type { QuizAttemptAnswerRecord, QuizAttemptRecord } from "@/quizzes/databridge/quizzes";

export function QuizAttemptList({
  attempts,
  timeZone,
}: {
  attempts: Array<QuizAttemptRecord & { label: string; answers: QuizAttemptAnswerRecord[] }>;
  timeZone: string;
}) {
  if (attempts.length === 0) return null;
  const visible = latestAttemptsByStudent(attempts);
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
        {visible.length > 1 ? "Latest entries" : "Your entry"}
      </h2>
      <ul className="mt-2 flex flex-col gap-3">
        {visible.map((attempt) => {
          const fullyGraded = attemptIsFullyGraded(attempt.answers);
          const showScore =
            attempt.score != null && attempt.scoreTotal != null && fullyGraded;
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
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
