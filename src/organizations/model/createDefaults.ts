import { DEFAULT_HOME_DAYS } from "./homeDays";
import { DEFAULT_SCHOOL_DAYS } from "./schoolDays";

export const K12_GRADE_LABELS = [
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "K-2",
  "3-5",
  "6-8",
  "9-12",
] as const;

/** Defaults for fields the org picker does not ask yet (editable later in org settings). */
export const CREATE_ORG_DEFAULTS = {
  orgType: "other" as const,
  gradeScheme: "k12" as const,
  gradeLabels: [...K12_GRADE_LABELS],
  schoolDays: DEFAULT_SCHOOL_DAYS,
  homeDays: DEFAULT_HOME_DAYS,
};
