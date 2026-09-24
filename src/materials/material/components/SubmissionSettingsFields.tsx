import { InfoHint } from "@/ui/InfoHint";
import { Input } from "@/ui/Input";
import {
  SUBMISSION_FILE_TYPES,
  submissionFileTypeLabel,
  type SubmissionFileType,
} from "@/submissions/model/fileTypes";
import { DEFAULT_MATERIAL_POINTS } from "@/submissions/model/grade";
import {
  MAX_SUBMISSION_LIMIT,
  MIN_SUBMISSION_LIMIT,
} from "@/submissions/model/submission";

export function SubmissionSettingsFields({
  acceptSubmissions,
  allowPastDue,
  gradable,
  pointsText,
  submissionLimit,
  fileTypes,
  onAcceptChange,
  onAllowPastDueChange,
  onGradableChange,
  onPointsChange,
  onLimitChange,
  onToggleType,
}: {
  acceptSubmissions: boolean;
  allowPastDue: boolean;
  gradable: boolean;
  pointsText: string;
  submissionLimit: number;
  fileTypes: readonly SubmissionFileType[];
  onAcceptChange: (value: boolean) => void;
  onAllowPastDueChange: (value: boolean) => void;
  onGradableChange: (value: boolean) => void;
  onPointsChange: (value: string) => void;
  onLimitChange: (value: number) => void;
  onToggleType: (kind: SubmissionFileType) => void;
}) {
  return (
    <div className="mt-4 border-t border-[var(--line-soft)] pt-4">
      <label className="flex items-start gap-2 text-[14.5px] text-[var(--ink)]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--green)]"
          checked={acceptSubmissions}
          onChange={(event) => onAcceptChange(event.target.checked)}
        />
        <span>
          <span className="font-bold">Accept submissions</span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
            Families can turn in a file for this material.
          </span>
        </span>
      </label>
      {acceptSubmissions ? (
        <div className="mt-3 flex flex-col gap-3 pl-6">
          <fieldset>
            <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
              Allowed files
            </legend>
            <ul className="mt-2 flex flex-col gap-1">
              {SUBMISSION_FILE_TYPES.map((kind) => (
                <li key={kind}>
                  <label className="flex items-center gap-2 text-[14px] text-[var(--ink)]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--green)]"
                      checked={fileTypes.includes(kind)}
                      onChange={() => onToggleType(kind)}
                    />
                    {submissionFileTypeLabel(kind)}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--ink-soft)]">
              <label htmlFor="submission-limit">Submissions allowed</label>
              <InfoHint label="About submissions allowed">
                How many times a student may turn work in. Each time can include more
                than one file.
              </InfoHint>
            </div>
            <Input
              id="submission-limit"
              className="mt-1 max-w-[8rem]"
              type="number"
              min={MIN_SUBMISSION_LIMIT}
              max={MAX_SUBMISSION_LIMIT}
              value={submissionLimit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
            />
          </div>
          <label className="flex items-start gap-2 text-[14px] text-[var(--ink)]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
              checked={allowPastDue}
              onChange={(event) => onAllowPastDueChange(event.target.checked)}
            />
            Allow submissions past due date
          </label>
          <label className="flex items-start gap-2 text-[14px] text-[var(--ink)]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
              checked={gradable}
              onChange={(event) => onGradableChange(event.target.checked)}
            />
            <span>
              <span className="font-bold">Gradable</span>
              <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
                Points count in the gradebook. Turn this off to leave feedback only.
              </span>
            </span>
          </label>
          <div>
            <label
              htmlFor="material-points"
              className="text-[13px] font-bold text-[var(--ink-soft)]"
            >
              Possible points
            </label>
            <Input
              id="material-points"
              className="mt-1 max-w-[8rem]"
              type="number"
              min={0.01}
              max={9999.99}
              step={0.01}
              inputMode="decimal"
              disabled={!gradable}
              value={gradable ? pointsText : ""}
              placeholder={String(DEFAULT_MATERIAL_POINTS)}
              onChange={(event) => onPointsChange(event.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
