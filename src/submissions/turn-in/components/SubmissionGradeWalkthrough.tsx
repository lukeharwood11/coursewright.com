import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import { awardedPointsAreValid, formatPoints, roundPoints } from "@/quizzes/model/quiz";
import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import { feedbackTextIsValid } from "@/submissions/model/grade";
import { attributionLine } from "@/submissions/model/submission";
import type {
  MaterialSubmissionRecord,
  SubmissionFileRecord,
} from "@/submissions/databridge/submissions";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { SubmissionFileList } from "./SubmissionFileList";

export function SubmissionGradeWalkthrough({
  submission,
  gradable,
  pointsPossible,
  saving,
  hasNext,
  onBack,
  onSave,
  onOpen,
  onDownload,
}: {
  submission: MaterialSubmissionRecord;
  gradable: boolean;
  pointsPossible: number | null;
  saving: boolean;
  hasNext: boolean;
  onBack: () => void;
  onSave: (grade: { points: number | null; feedback: string }, thenNext: boolean) => void;
  onOpen: (file: SubmissionFileRecord) => void;
  onDownload: (file: SubmissionFileRecord) => void;
}) {
  const [pointsText, setPointsText] = useState(
    submission.pointsEarned != null ? formatPoints(submission.pointsEarned) : "",
  );
  const [feedback, setFeedback] = useState(submission.feedback);
  const pointsValue = Number(pointsText);
  const pointsOk =
    !gradable ||
    (pointsPossible != null && awardedPointsAreValid(pointsValue, pointsPossible));
  const ready = pointsOk && feedbackTextIsValid(feedback, gradable);

  function save(thenNext: boolean) {
    if (!ready) return;
    onSave(
      { points: gradable ? roundPoints(pointsValue) : null, feedback },
      thenNext,
    );
  }

  return (
    <section className="mt-8 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-[var(--ink)]">{submission.studentName}</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
            {submission.gradedAt ? "Saved" : "Waiting"}
            {gradable && pointsPossible != null ? ` · ${formatPoints(pointsPossible)} possible` : ""}
            {!gradable ? " · Feedback only" : ""}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          All submissions
        </Button>
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {submission.versions.map((version) => (
          <li
            key={version.id}
            className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          >
            <p className="text-[15px] font-bold text-[var(--ink)]">
              {attributionLine(version.parentName, submission.studentName)}
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
              {formatSubmittedAt(version.submittedAt)}
            </p>
            <SubmissionFileList
              files={version.files}
              onOpen={onOpen}
              onDownload={onDownload}
            />
          </li>
        ))}
      </ol>
      {gradable && pointsPossible != null ? (
        <label className="mt-4 flex max-w-xs flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Points</span>
          <Input
            type="number"
            min={0}
            max={pointsPossible}
            step={0.01}
            inputMode="decimal"
            value={pointsText}
            onChange={(event) => setPointsText(event.target.value)}
          />
          <span className="text-[12.5px] text-[var(--ink-faint)]">
            Out of {formatPoints(pointsPossible)}
          </span>
        </label>
      ) : null}
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          {gradable ? "Feedback" : "Feedback"}
        </span>
        <textarea
          className="min-h-28 w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)]"
          value={feedback}
          maxLength={4000}
          onChange={(event) => setFeedback(event.target.value)}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!ready || saving} onClick={() => save(false)}>
          <CheckIcon className="h-4 w-4" aria-hidden />
          {saving ? "Saving…" : gradable ? "Save grade" : "Save feedback"}
        </Button>
        <Button type="button" disabled={!ready || saving || !hasNext} onClick={() => save(true)}>
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
          {hasNext ? "Save and next" : "No more waiting"}
        </Button>
      </div>
    </section>
  );
}
