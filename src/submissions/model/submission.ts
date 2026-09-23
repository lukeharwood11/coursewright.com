import {
  fileAllowedForSubmission,
  MAX_FILES_PER_TURN_IN,
  turnInTypeMessage,
  type SubmissionFileType,
} from "./fileTypes";

export const DEFAULT_SUBMISSION_LIMIT = 2;
export const MIN_SUBMISSION_LIMIT = 1;
export const MAX_SUBMISSION_LIMIT = 10;

export function clampSubmissionLimit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SUBMISSION_LIMIT;
  return Math.min(MAX_SUBMISSION_LIMIT, Math.max(MIN_SUBMISSION_LIMIT, Math.round(value)));
}

export function submissionLimitValid(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_SUBMISSION_LIMIT &&
    value <= MAX_SUBMISSION_LIMIT
  );
}

/** One turn-in uses one slot, no matter how many files are in the batch. */
export function finishedCountAfterTurnIn(finishedCount: number, fileCount: number): number {
  if (fileCount < 1) return finishedCount;
  return finishedCount + 1;
}

export function submissionSlotOpen(finishedCount: number, limit: number): boolean {
  return finishedCount < limit;
}

export function pastDueBlocksTurnIn(args: {
  allowPastDue: boolean;
  dueAt: string | null;
  now: Date;
}): boolean {
  if (args.allowPastDue || !args.dueAt) return false;
  const due = new Date(args.dueAt).getTime();
  if (Number.isNaN(due)) return false;
  return args.now.getTime() > due;
}

export function attributionLine(parentName: string, childName: string): string {
  const parent = parentName.trim() || "Parent";
  const child = childName.trim() || "student";
  return `${parent} on behalf of ${child}`;
}

export type TurnInFile = { name: string; type: string };

export function turnInBatchError(
  files: readonly TurnInFile[],
  allowed: readonly SubmissionFileType[],
): string | null {
  if (files.length < 1) return "Choose at least one file.";
  if (files.length > MAX_FILES_PER_TURN_IN) {
    return `Turn in up to ${MAX_FILES_PER_TURN_IN} files at a time.`;
  }
  const rejected = files.find(
    (file) => !fileAllowedForSubmission(allowed, file.name, file.type),
  );
  if (rejected) return turnInTypeMessage(allowed);
  return null;
}
