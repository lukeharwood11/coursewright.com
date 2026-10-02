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

/** What a teacher rates. Criteria replace the parent outcome. Archived outcomes are skipped. */
export type RatingTarget = {
  key: string;
  outcomeId: number;
  criterionId: number | null;
  outcomeStatement: string;
  criterionStatement: string | null;
};

export function ratingTargetKey(outcomeId: number, criterionId: number | null): string {
  return criterionId == null ? `outcome:${outcomeId}` : `criterion:${criterionId}`;
}

export function ratingTargets(outcomes: readonly CourseOutcome[]): RatingTarget[] {
  const targets: RatingTarget[] = [];
  for (const outcome of activeOutcomes(outcomes)) {
    if (outcome.criteria.length === 0) {
      targets.push({
        key: ratingTargetKey(outcome.id, null),
        outcomeId: outcome.id,
        criterionId: null,
        outcomeStatement: outcome.statement,
        criterionStatement: null,
      });
      continue;
    }
    for (const criterion of outcome.criteria) {
      targets.push({
        key: ratingTargetKey(outcome.id, criterion.id),
        outcomeId: outcome.id,
        criterionId: criterion.id,
        outcomeStatement: outcome.statement,
        criterionStatement: criterion.statement,
      });
    }
  }
  return targets;
}

export type SavedRating = {
  id: number;
  studentId: number;
  outcomeId: number;
  criterionId: number | null;
  ratingOptionId: number | null;
};

export function ratingForCell(
  ratings: readonly SavedRating[],
  studentId: number,
  target: RatingTarget,
): SavedRating | null {
  return (
    ratings.find(
      (rating) =>
        rating.studentId === studentId &&
        rating.outcomeId === target.outcomeId &&
        rating.criterionId === target.criterionId,
    ) ?? null
  );
}

export type FamilyRatingRow = {
  courseId: number;
  courseTitle: string;
  outcomeStatement: string;
  criterionStatement: string | null;
  label: string;
};

export type FamilyRatingGroup = {
  courseId: number;
  courseTitle: string;
  lines: { text: string; label: string }[];
};

export function groupFamilyRatings(rows: readonly FamilyRatingRow[]): FamilyRatingGroup[] {
  const groups: FamilyRatingGroup[] = [];
  for (const row of rows) {
    const text = row.criterionStatement
      ? `${row.outcomeStatement} — ${row.criterionStatement}`
      : row.outcomeStatement;
    const existing = groups.find((group) => group.courseId === row.courseId);
    const line = { text, label: row.label };
    if (existing) existing.lines.push(line);
    else {
      groups.push({
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        lines: [line],
      });
    }
  }
  return groups;
}
