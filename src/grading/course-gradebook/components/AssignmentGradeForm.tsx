import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type { AttemptAnswerDraft } from "@/grading/databridge/gradebook";
import { awardedPointsAreValid, formatPoints, roundPoints } from "@/quizzes/model/quiz";

export function AssignmentGradeForm({
  answers,
  note,
  saving,
  onNote,
  onClose,
  onSave,
}: {
  answers: AttemptAnswerDraft[];
  note: string;
  saving: boolean;
  onNote: (value: string) => void;
  onClose: () => void;
  onSave: (points: { questionId: number; points: number }[]) => void;
}) {
  const [drafts, setDrafts] = useState(() =>
    answers.map((answer) => ({
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
    const answer = answers.find((row) => row.questionId === draft.questionId);
    const possible = answer?.possible ?? 0;
    const value = Number(draft.text);
    const valid = answer != null && awardedPointsAreValid(value, possible);
    return { ...draft, possible, value: valid ? roundPoints(value) : null };
  });
  const ready = parsed.length > 0 && parsed.every((row) => row.value != null);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Save grade</h2>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {parsed.map((row) => {
          const answer = answers.find((item) => item.questionId === row.questionId);
          return (
            <li key={row.questionId}>
              <p className="text-[14px] font-bold text-[var(--ink)]">
                {answer?.prompt.trim() || "Question"}
              </p>
              <p className="text-[12.5px] text-[var(--ink-faint)]">
                Possible {formatPoints(row.possible)}
                {answer?.autoPoints != null ? ` · Autograded ${formatPoints(answer.autoPoints)}` : ""}
              </p>
              <Input
                className="mt-1 max-w-[8rem]"
                type="number"
                min={0}
                max={row.possible}
                step={0.01}
                value={row.text}
                aria-label="Points"
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
            </li>
          );
        })}
      </ul>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Note (optional)</span>
        <textarea
          className="min-h-20 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none focus:border-[var(--green)]"
          value={note}
          onChange={(event) => onNote(event.target.value)}
        />
      </label>
      <Button
        type="button"
        className="mt-3"
        disabled={!ready || saving}
        onClick={() =>
          onSave(
            parsed.flatMap((row) =>
              row.value == null ? [] : [{ questionId: row.questionId, points: row.value }],
            ),
          )
        }
      >
        {saving ? "Saving…" : "Save grade"}
      </Button>
    </section>
  );
}
