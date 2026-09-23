import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import { formatQuizScore, latestAttemptsByStudent } from "@/quizzes/model/quiz";
import type { QuizAttemptAnswerRecord, QuizAttemptRecord } from "@/quizzes/databridge/quizzes";

export function QuizAttemptList({
  attempts,
  timeZone,
  showAll,
}: {
  attempts: Array<QuizAttemptRecord & { label: string; answers: QuizAttemptAnswerRecord[] }>;
  timeZone: string;
  showAll: boolean;
}) {
  if (attempts.length === 0) return null;
  const visible = showAll ? attempts : latestAttemptsByStudent(attempts);
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
        {showAll ? "Entries" : visible.length > 1 ? "Latest entries" : "Your entry"}
      </h2>
      <ul className="mt-2 flex flex-col gap-3">
        {visible.map((attempt) => (
          <li
            key={attempt.id}
            className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          >
            <p className="text-[14.5px] font-bold text-[var(--ink)]">{attempt.label}</p>
            <p className="text-[12.5px] text-[var(--ink-faint)]">
              {formatSubmittedAt(attempt.submittedAt, timeZone)}
              {attempt.autograded && attempt.score != null && attempt.scoreTotal != null
                ? ` · ${formatQuizScore(attempt.score, attempt.scoreTotal)}`
                : " · Submitted"}
            </p>
            {showAll ? (
              <ul className="mt-3 flex flex-col gap-2">
                {attempt.answers.map((answer) => (
                  <li key={`${attempt.id}-${answer.questionId}`} className="text-[14px]">
                    <p className="font-semibold text-[var(--ink)]">
                      {answer.promptSnapshot.trim() || "Question"}
                    </p>
                    <p className="text-[var(--ink-soft)]">
                      {answer.selectedSummary.trim() || "No answer"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
