import { questionPointsAreValid, roundPoints } from "@/quizzes/model/quiz";

export const DEFAULT_MATERIAL_POINTS = 10;
export const MAX_MATERIAL_FEEDBACK = 4000;

export function materialPointsAreValid(points: number): boolean {
  return questionPointsAreValid(points);
}

export function parseMaterialPoints(text: string): number | null {
  const value = Number(text);
  if (!materialPointsAreValid(value)) return null;
  return roundPoints(value);
}

export function feedbackTextIsValid(text: string, gradable: boolean): boolean {
  const trimmed = text.trim();
  if (text.length > MAX_MATERIAL_FEEDBACK) return false;
  if (!gradable && trimmed.length === 0) return false;
  return true;
}

export type SubmissionGradeState = {
  versions: readonly unknown[];
  gradedAt: string | null;
};

export function submissionWaitingForGrade(row: SubmissionGradeState): boolean {
  return row.versions.length > 0 && row.gradedAt == null;
}
