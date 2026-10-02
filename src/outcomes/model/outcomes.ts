export const OUTCOME_STATEMENT_MAX = 500;
export const RATING_LABEL_MAX = 80;

export const SUGGESTED_RATING_LABELS = [
  "N/A",
  "Not mastered",
  "In progress",
  "Mastered",
] as const;

export type RatingOption = {
  id: number;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type OutcomeCriterion = {
  id: number;
  outcomeId: number;
  statement: string;
  sortOrder: number;
};

export type CourseOutcome = {
  id: number;
  courseId: number;
  statement: string;
  sortOrder: number;
  archivedAt: string | null;
  criteria: OutcomeCriterion[];
};

export function normalizeOutcomeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateRatingLabel(
  label: string,
  existing: readonly { id: number; label: string }[],
  ignoreId?: number,
): string | null {
  const normalized = normalizeOutcomeText(label);
  if (!normalized) return "Enter a label.";
  if (normalized.length > RATING_LABEL_MAX) {
    return `Use ${RATING_LABEL_MAX} characters or fewer.`;
  }
  const clash = existing.some(
    (option) =>
      option.id !== ignoreId &&
      option.label.localeCompare(normalized, undefined, { sensitivity: "accent" }) === 0,
  );
  if (clash) return "That label is already in the list.";
  return null;
}

export function validateOutcomeStatement(statement: string): string | null {
  const normalized = normalizeOutcomeText(statement);
  if (!normalized) return "Write what students should be able to do.";
  if (normalized.length > OUTCOME_STATEMENT_MAX) {
    return `Use ${OUTCOME_STATEMENT_MAX} characters or fewer.`;
  }
  return null;
}

export function activeOutcomes(outcomes: readonly CourseOutcome[]): CourseOutcome[] {
  return outcomes
    .filter((outcome) => outcome.archivedAt == null)
    .slice()
    .sort(bySortThenId);
}

export function archivedOutcomes(outcomes: readonly CourseOutcome[]): CourseOutcome[] {
  return outcomes
    .filter((outcome) => outcome.archivedAt != null)
    .slice()
    .sort(bySortThenId);
}

export function sortedCriteria(criteria: readonly OutcomeCriterion[]): OutcomeCriterion[] {
  return criteria.slice().sort(bySortThenId);
}

export function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
}

export function sortOrdersForIds(ids: readonly number[]): { id: number; sortOrder: number }[] {
  return ids.map((id, sortOrder) => ({ id, sortOrder }));
}

function bySortThenId<T extends { sortOrder: number; id: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}
