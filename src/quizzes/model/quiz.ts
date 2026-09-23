import { attributionLine } from "@/submissions/model/submission";

export const QUIZ_QUESTION_KINDS = ["multiple_choice", "short_answer"] as const;
export type QuizQuestionKind = (typeof QUIZ_QUESTION_KINDS)[number];

export type QuizWindowState = "download_only" | "not_yet" | "open" | "closed";

export function quizWindowState(
  quiz: { acceptsFrom: string | null; acceptsUntil: string | null },
  now: Date,
): QuizWindowState {
  if (!quiz.acceptsFrom && !quiz.acceptsUntil) return "download_only";
  const at = now.getTime();
  if (quiz.acceptsFrom) {
    const start = new Date(quiz.acceptsFrom).getTime();
    if (!Number.isNaN(start) && at < start) return "not_yet";
  }
  if (quiz.acceptsUntil) {
    const end = new Date(quiz.acceptsUntil).getTime();
    if (!Number.isNaN(end) && at >= end) return "closed";
  }
  return "open";
}

export function quizAcceptsEntries(state: QuizWindowState): boolean {
  return state === "open";
}

/** Exact set match. Extra or missing choices are wrong. A question with no correct choice is not autogradable. */
export function multipleChoiceIsCorrect(
  selectedIds: readonly number[],
  correctIds: readonly number[],
): boolean | null {
  if (correctIds.length === 0) return null;
  const selected = [...new Set(selectedIds)].sort((a, b) => a - b);
  const correct = [...new Set(correctIds)].sort((a, b) => a - b);
  if (selected.length !== correct.length) return false;
  return selected.every((id, index) => id === correct[index]);
}

export function scoreMultipleChoice(
  questions: readonly {
    correctIds: readonly number[];
    selectedIds: readonly number[];
  }[],
): { score: number; scoreTotal: number } {
  let score = 0;
  let scoreTotal = 0;
  for (const question of questions) {
    const result = multipleChoiceIsCorrect(question.selectedIds, question.correctIds);
    if (result === null) continue;
    scoreTotal += 1;
    if (result) score += 1;
  }
  return { score, scoreTotal };
}

export function formatQuizScore(score: number, scoreTotal: number): string {
  return `${score} of ${scoreTotal}`;
}

export function accountIsStudentOnCourse(
  email: string | null | undefined,
  students: readonly { studentEmail: string | null }[],
): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return students.some(
    (student) => student.studentEmail?.trim().toLowerCase() === normalized,
  );
}

export function quizAttemptLabel(args: {
  parentName: string;
  studentName: string;
  submitterIsStudent: boolean;
}): string {
  if (args.submitterIsStudent) return args.studentName.trim() || "Student";
  return attributionLine(args.parentName, args.studentName);
}

/** First attempt for each student. `attempts` must already be newest first. */
export function latestAttemptsByStudent<T extends { studentProfileId: number }>(
  attempts: readonly T[],
): T[] {
  const seen = new Set<number>();
  const latest: T[] = [];
  for (const attempt of attempts) {
    if (seen.has(attempt.studentProfileId)) continue;
    seen.add(attempt.studentProfileId);
    latest.push(attempt);
  }
  return latest;
}

export function canShowAnswerKey(args: {
  teacherView: boolean;
  shareWithParents: boolean;
  viewerIsStudent: boolean;
}): boolean {
  if (args.teacherView) return true;
  return args.shareWithParents && !args.viewerIsStudent;
}
