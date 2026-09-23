import { Input } from "@/ui/Input";
import {
  SUBMISSION_FILE_TYPES,
  submissionFileTypeLabel,
  type SubmissionFileType,
} from "@/submissions/model/fileTypes";
import {
  MAX_SUBMISSION_LIMIT,
  MIN_SUBMISSION_LIMIT,
} from "@/submissions/model/submission";

export function SubmissionSettingsFields({
  acceptSubmissions,
  allowPastDue,
  submissionLimit,
  fileTypes,
  onAcceptChange,
  onAllowPastDueChange,
  onLimitChange,
  onToggleType,
}: {
  acceptSubmissions: boolean;
  allowPastDue: boolean;
  submissionLimit: number;
  fileTypes: readonly SubmissionFileType[];
  onAcceptChange: (value: boolean) => void;
  onAllowPastDueChange: (value: boolean) => void;
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
          <label className="flex max-w-[8rem] flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Submissions allowed
            </span>
            <Input
              type="number"
              min={MIN_SUBMISSION_LIMIT}
              max={MAX_SUBMISSION_LIMIT}
              value={submissionLimit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
            />
            <span className="text-[12px] text-[var(--ink-faint)]">
              How many times a student may turn work in. Each time can include more than one file.
            </span>
          </label>
          <label className="flex items-start gap-2 text-[14px] text-[var(--ink)]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
              checked={allowPastDue}
              onChange={(event) => onAllowPastDueChange(event.target.checked)}
            />
            Allow submissions past due date
          </label>
        </div>
      ) : null}
    </div>
  );
}
