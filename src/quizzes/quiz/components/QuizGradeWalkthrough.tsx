import { useState } from "react";
import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type { QuizAttemptAnswerRecord, QuizAttemptRecord } from "@/quizzes/databridge/quizzes";
import {
  awardedPointsAreValid,
  formatPoints,
  formatQuizScore,
  quizGradeStatus,
  quizGradeStatusLabel,
  roundPoints,
} from "@/quizzes/model/quiz";

type Attempt = QuizAttemptRecord & { label: string; answers: QuizAttemptAnswerRecord[] };

export function QuizGradeWalkthrough({
  attempt,
  timeZone,
  saving,
  hasNext,
  onBack,
  onSave,
}: {
  attempt: Attempt;
  timeZone: string;
  saving: boolean;
  hasNext: boolean;
  onBack: () => void;
  onSave: (points: { questionId: number; points: number }[], thenNext: boolean) => void;
}) {
  const [drafts, setDrafts] = useState(() =>
    attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      text:
        answer.teacherPoints != null
          ? formatPoints(answer.teacherPoints)
          : answer.autoPoints != null
            ? formatPoints(answer.autoPoints)
            : "",
    })),
  );
  const parsed = drafts.map((draft) => {
    const answer = attempt.answers.find((row) => row.questionId === draft.questionId);
    const possible = answer?.pointsPossible ?? 0;
    const value = Number(draft.text);
    const valid = answer != null && awardedPointsAreValid(value, possible);
    return { ...draft, possible, value: valid ? roundPoints(value) : null, answer };
  });
  const ready = parsed.every((row) => row.value != null);
  const earned = parsed.reduce((sum, row) => sum + (row.value ?? 0), 0);
  const possible = parsed.reduce((sum, row) => sum + row.possible, 0);
  const status = quizGradeStatus(attempt);

  function save(thenNext: boolean) {
    if (!ready) return;
    onSave(
      parsed.flatMap((row) =>
        row.value == null ? [] : [{ questionId: row.questionId, points: row.value }],
      ),
      thenNext,
    );
  }

  return (
    <section className="mt-8 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-[var(--ink)]">{attempt.label}</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
            {formatSubmittedAt(attempt.submittedAt, timeZone)}
            {" · "}
            {status === "graded" ? "Your grade" : quizGradeStatusLabel(status)}
            {ready ? ` · ${formatQuizScore(earned, possible)}` : ""}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onBack}>
          All submissions
        </Button>
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {parsed.map((row, index) => {
          const answer = row.answer;
          if (!answer) return null;
          const auto = answer.autoPoints;
          const changed = row.value != null && auto != null && row.value !== auto;
          return (
            <li
              key={answer.questionId}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
            >
              <p className="text-[15px] font-bold text-[var(--ink)]">
                {index + 1}. {answer.promptSnapshot.trim() || "Question"}
              </p>
              <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
                {answer.selectedSummary.trim() || answer.answerText.trim() || "No answer"}
              </p>
              <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
                Possible points: {formatPoints(row.possible)}
                {auto != null ? ` · Autograded ${formatPoints(auto)}` : " · Not autograded"}
              </p>
              <label className="mt-3 flex max-w-xs flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">Your grade</span>
                <Input
                  type="number"
                  min={0}
                  max={row.possible}
                  step={0.01}
                  inputMode="decimal"
                  value={row.text}
                  onChange={(event) =>
                    setDrafts((current) =>
                      current.map((draft) =>
                        draft.questionId === row.questionId
                          ? { ...draft, text: event.target.value }
                          : draft,
                      ),
                    )
                  }
                />
              </label>
              {changed ? (
                <p className="mt-2 text-[12.5px] text-[var(--ink-soft)]">
                  This replaces the autograded {formatPoints(auto!)}.
                </p>
              ) : auto != null && row.value != null ? (
                <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
                  Same as the autograde. Saving still counts as your grade.
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!ready || saving} onClick={() => save(false)}>
          {saving ? "Saving…" : "Save grade"}
        </Button>
        <Button type="button" disabled={!ready || saving || !hasNext} onClick={() => save(true)}>
          {hasNext ? "Save and next" : "No more waiting"}
        </Button>
      </div>
    </section>
  );
}
