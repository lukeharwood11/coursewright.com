import { useState } from "react";
import { awardedPointsAreValid, formatPoints, roundPoints } from "@/quizzes/model/quiz";
import { feedbackTextIsValid } from "@/submissions/model/grade";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export function MaterialGradeForm({
  title,
  gradable,
  possible,
  earned,
  feedback,
  saving,
  onClose,
  onSave,
}: {
  title: string;
  gradable: boolean;
  possible: number | null;
  earned: number | null;
  feedback: string;
  saving: boolean;
  onClose: () => void;
  onSave: (grade: { points: number | null; feedback: string }) => void;
}) {
  const [pointsText, setPointsText] = useState(earned != null ? formatPoints(earned) : "");
  const [note, setNote] = useState(feedback);
  const points = Number(pointsText);
  const pointsOk =
    !gradable ||
    (possible != null && awardedPointsAreValid(points, possible));
  const ready = pointsOk && feedbackTextIsValid(note, gradable);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
          {gradable ? "Save grade" : "Save feedback"} · {title}
        </h2>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      {gradable && possible != null ? (
        <label className="mt-3 flex max-w-xs flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Points out of {formatPoints(possible)}
          </span>
          <Input
            type="number"
            min={0}
            max={possible}
            step={0.01}
            value={pointsText}
            aria-label="Points"
            onChange={(event) => setPointsText(event.target.value)}
          />
        </label>
      ) : (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
          This material is feedback only. It does not count in the final.
        </p>
      )}
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Feedback</span>
        <textarea
          className="min-h-24 w-full rounded-[6px] border border-[var(--line)] px-[13px] py-[11px] text-[14.5px]"
          value={note}
          maxLength={4000}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="mt-3">
        <Button
          type="button"
          disabled={!ready || saving}
          onClick={() =>
            onSave({
              points: gradable && possible != null ? roundPoints(points) : null,
              feedback: note,
            })
          }
        >
          {saving ? "Saving…" : gradable ? "Save grade" : "Save feedback"}
        </Button>
      </div>
    </section>
  );
}
