export const PERIOD_FEEDBACK_MAX = 4000;

export type PeriodFeedbackDraft = {
  studentId: number;
  body: string;
};

export function periodFeedbackBody(raw: string): string | null {
  const body = raw.trim();
  if (!body) return null;
  if (body.length > PERIOD_FEEDBACK_MAX) return null;
  return body;
}

export function periodFeedbackError(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > PERIOD_FEEDBACK_MAX) {
    return `Use ${PERIOD_FEEDBACK_MAX} characters or fewer.`;
  }
  return null;
}

export type FamilyPeriodFeedback = {
  courseId: number;
  courseTitle: string;
  cycleId: number;
  cycleLabel: string;
  body: string;
};

export function groupPeriodFeedback(
  rows: readonly FamilyPeriodFeedback[],
): { courseId: number; courseTitle: string; comments: { cycleId: number; cycleLabel: string; body: string }[] }[] {
  const groups = new Map<number, { courseTitle: string; comments: FamilyPeriodFeedback[] }>();
  for (const row of rows) {
    const group = groups.get(row.courseId) ?? { courseTitle: row.courseTitle, comments: [] };
    group.comments.push(row);
    groups.set(row.courseId, group);
  }
  return [...groups.entries()]
    .map(([courseId, group]) => ({
      courseId,
      courseTitle: group.courseTitle,
      comments: group.comments
        .slice()
        .sort((a, b) => a.cycleLabel.localeCompare(b.cycleLabel))
        .map((comment) => ({
          cycleId: comment.cycleId,
          cycleLabel: comment.cycleLabel,
          body: comment.body,
        })),
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}
