import { attributionLine } from "@/submissions/model/submission";

export const QUIZ_QUESTION_KINDS = [
  "multiple_choice",
  "short_answer",
  "number",
  "matching",
  "long_answer",
] as const;
export type QuizQuestionKind = (typeof QUIZ_QUESTION_KINDS)[number];

export const LONG_ANSWER_LINE_MIN = 1;
export const LONG_ANSWER_LINE_MAX = 20;
export const LONG_ANSWER_LINE_DEFAULT = 4;
export const MATCH_PAIR_MAX = 20;

export function parseCourseQuizKind(value: string): QuizQuestionKind {
  if (
    value === "short_answer" ||
    value === "number" ||
    value === "matching" ||
    value === "long_answer"
  ) {
    return value;
  }
  return "multiple_choice";
}

export function clampAnswerLines(value: number): number {
  if (!Number.isFinite(value)) return LONG_ANSWER_LINE_DEFAULT;
  return Math.min(LONG_ANSWER_LINE_MAX, Math.max(LONG_ANSWER_LINE_MIN, Math.round(value)));
}

/** Same number, including 3.5, 3.50, and 7/2. Null when the key is empty or not a number. */
export function quizNumberValue(raw: string): number | null {
  const text = raw.trim().replace(/^\+/, "");
  if (!text) return null;
  const fraction = text.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    const value = Number(fraction[1]) / denominator;
    return Number.isFinite(value) ? value : null;
  }
  if (!/^-?(?:\d+\.\d+|\d+|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function numbersMatch(submitted: string, key: string): boolean | null {
  const expected = quizNumberValue(key);
  if (expected == null) return null;
  const actual = quizNumberValue(submitted);
  if (actual == null) return false;
  const scale = Math.max(1, Math.abs(expected), Math.abs(actual));
  return Math.abs(actual - expected) <= 1e-9 * scale;
}

export function stableShuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  let state = (seed || 1) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}

export type MatchPrompt = { id: number; position: number; text: string };
export type MatchOption = { id: number; position: number; text: string };
export type MatchKey = { promptId: number; optionId: number };

export type MatchLayout = {
  left: { id: number; text: string }[];
  right: { id: number; letter: string; text: string }[];
};

function matchLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

function byPosition<T extends { position: number; id: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position || a.id - b.id);
}

/** Prompts stay in saved order. Options are mixed with a stable shuffle. */
export function matchLayout(
  prompts: readonly MatchPrompt[],
  options: readonly MatchOption[],
  seed: number,
): MatchLayout {
  const left = byPosition(prompts).filter((prompt) => prompt.text.trim() !== "");
  const right = stableShuffle(
    byPosition(options).filter((option) => option.text.trim() !== ""),
    seed,
  );
  return {
    left: left.map((prompt) => ({ id: prompt.id, text: prompt.text.trim() })),
    right: right.map((option, index) => ({
      id: option.id,
      letter: matchLetter(index),
      text: option.text.trim(),
    })),
  };
}

/** Correct option text for each prompt, after the same shuffle the family sees. */
export function matchKeyTexts(
  layout: MatchLayout,
  keys: readonly MatchKey[],
): Map<number, string> {
  const textByOption = new Map(layout.right.map((option) => [option.id, option.text]));
  const texts = new Map<number, string>();
  for (const key of keys) {
    const text = textByOption.get(key.optionId);
    if (text) texts.set(key.promptId, text);
  }
  return texts;
}

/** Letter of the correct option, after the same shuffle the family sees. */
export function matchKeyLetters(
  layout: MatchLayout,
  keys: readonly MatchKey[],
): Map<number, string> {
  const letterByOption = new Map(layout.right.map((option) => [option.id, option.letter]));
  const letters = new Map<number, string>();
  for (const key of keys) {
    const letter = letterByOption.get(key.optionId);
    if (letter) letters.set(key.promptId, letter);
  }
  return letters;
}

/** One point when every saved pair is chosen. Null when there is nothing to match. */
export function matchingIsCorrect(
  keys: readonly MatchKey[],
  picks: readonly { leftId: number; rightId: number }[],
): boolean | null {
  if (keys.length === 0) return null;
  if (picks.length !== keys.length) return false;
  const byLeft = new Map<number, number>();
  for (const pick of picks) {
    if (byLeft.has(pick.leftId)) return false;
    byLeft.set(pick.leftId, pick.rightId);
  }
  return keys.every((key) => byLeft.get(key.promptId) === key.optionId);
}

export type QuizWindowState = "download_only" | "not_yet" | "open" | "closed";

export function quizWindowState(
  quiz: {
    acceptEntries: boolean;
    acceptsFrom: string | null;
    acceptsUntil: string | null;
  },
  now: Date,
): QuizWindowState {
  if (!quiz.acceptEntries) return "download_only";
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

/** Up to two decimal places, without trailing zeros. 4.50 → "4.5", 4.00 → "4". */
export function formatPoints(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

export function roundPoints(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatQuizScore(score: number, scoreTotal: number): string {
  const shown = `${formatPoints(score)}/${formatPoints(scoreTotal)}`;
  if (scoreTotal <= 0) return `Score ${shown}`;
  const percent = Math.round((score / scoreTotal) * 100);
  return `Score ${shown} (${percent}%)`;
}

/**
 * Points for one question.
 * Multiple choice passes `misses` (wrong choices selected). Each correct choice is an equal
 * share, and each wrong choice subtracts that share, never below 0.
 * Matching passes `misses` as 0: each correct pair earns its share, and a wrong pair does not subtract.
 * A fully correct answer returns `points` exactly.
 */
export function awardedPoints(args: {
  points: number;
  hits: number;
  total: number;
  misses?: number;
}): number | null {
  const misses = args.misses ?? 0;
  if (args.total <= 0) return null;
  if (args.hits >= args.total && misses <= 0) return roundPoints(args.points);
  const raw = (args.points * (args.hits - misses)) / args.total;
  return roundPoints(Math.max(0, raw));
}

export function questionPointsAreValid(points: number): boolean {
  if (!Number.isFinite(points) || points <= 0 || points > 9999.99) return false;
  return Math.abs(points * 100 - Math.round(points * 100)) < 1e-6;
}

export function quizPossiblePoints(questions: readonly { points: number }[]): number {
  return roundPoints(
    questions.reduce((sum, question) => sum + (Number.isFinite(question.points) ? question.points : 0), 0),
  );
}

/** Teacher points replace the autograde. A missing teacher value keeps the autograded points. */
export function earnedQuizPoints(answer: {
  teacherPoints: number | null;
  autoPoints: number | null;
}): number | null {
  if (answer.teacherPoints != null) return answer.teacherPoints;
  return answer.autoPoints;
}

export function awardedPointsAreValid(points: number, possible: number): boolean {
  if (!Number.isFinite(points) || !Number.isFinite(possible)) return false;
  if (points < 0 || points > possible + 1e-9) return false;
  return Math.abs(points * 100 - Math.round(points * 100)) < 1e-6;
}

export type QuizAnswerGrade = "correct" | "incorrect" | "partial" | "pending";

/** Full points, partial points, zero, or not scored yet. */
export function quizAnswerGrade(
  earned: number | null,
  possible: number | null,
): QuizAnswerGrade {
  if (earned == null || possible == null) return "pending";
  if (earned <= 0) return "incorrect";
  if (earned + 1e-9 >= possible) return "correct";
  return "partial";
}

export function quizAnswerGradeLabel(
  grade: QuizAnswerGrade,
  earned: number | null = null,
  possible: number | null = null,
): string {
  if (grade === "pending" || earned == null || possible == null) return "Yet to be graded";
  return `${formatPoints(earned)} / ${formatPoints(possible)}`;
}

/** True when every answer has autograded or teacher points. */
export function attemptIsFullyGraded(
  answers: readonly { teacherPoints: number | null; autoPoints: number | null }[],
): boolean {
  if (answers.length === 0) return true;
  return answers.every((answer) => earnedQuizPoints(answer) != null);
}

export type QuizGradeStatus = "needs_grading" | "autograded" | "graded";

export function quizGradeStatus(attempt: {
  autograded: boolean;
  teacherGradedAt: string | null;
  answers: readonly { teacherPoints: number | null; autoPoints: number | null }[];
}): QuizGradeStatus {
  if (attempt.teacherGradedAt) return "graded";
  const waiting = attempt.answers.some((answer) => earnedQuizPoints(answer) == null);
  if (waiting || !attempt.autograded) return "needs_grading";
  return "autograded";
}

export function quizGradeStatusLabel(status: QuizGradeStatus): string {
  if (status === "needs_grading") return "Needs grading";
  if (status === "autograded") return "Autograded";
  return "Graded";
}

export function orderedAttemptAnswers<T extends { questionId: number }>(
  questionIds: readonly number[],
  answers: readonly T[],
): T[] {
  const byQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const ordered = questionIds.flatMap((questionId) => {
    const answer = byQuestion.get(questionId);
    return answer ? [answer] : [];
  });
  const seen = new Set(ordered.map((answer) => answer.questionId));
  return [...ordered, ...answers.filter((answer) => !seen.has(answer.questionId))];
}

/** Oldest waiting entries first: needs grading, then autograded and not yet verified. */
export function quizGradingQueue<
  T extends {
    id: number;
    submittedAt: string;
    autograded: boolean;
    teacherGradedAt: string | null;
    answers: readonly { teacherPoints: number | null; autoPoints: number | null }[];
  },
>(attempts: readonly T[]): T[] {
  return [...attempts]
    .filter((attempt) => quizGradeStatus(attempt) !== "graded")
    .sort((a, b) => {
      const rank = quizGradeStatus(a) === "needs_grading" ? 0 : 1;
      const other = quizGradeStatus(b) === "needs_grading" ? 0 : 1;
      if (rank !== other) return rank - other;
      return a.submittedAt.localeCompare(b.submittedAt);
    });
}

export type SavedQuizAnswerFields = {
  selected: Record<number, number[]>;
  text: Record<number, string>;
  matches: Record<number, Record<number, number>>;
};

/** Form field values from a stored attempt (for read-only review). */
export function savedQuizAnswerFields(
  answers: readonly {
    questionId: number;
    choiceIds: readonly number[];
    answerText: string;
    matchPairs: readonly { leftId: number; rightId: number }[];
  }[],
): SavedQuizAnswerFields {
  const selected: Record<number, number[]> = {};
  const text: Record<number, string> = {};
  const matches: Record<number, Record<number, number>> = {};
  for (const answer of answers) {
    if (answer.choiceIds.length > 0) {
      selected[answer.questionId] = [...answer.choiceIds];
    }
    if (answer.answerText) {
      text[answer.questionId] = answer.answerText;
    }
    if (answer.matchPairs.length > 0) {
      const picks: Record<number, number> = {};
      for (const pair of answer.matchPairs) {
        picks[pair.leftId] = pair.rightId;
      }
      matches[answer.questionId] = picks;
    }
  }
  return { selected, text, matches };
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

/** Outline / calendar progress for the viewer’s latest attempt. */
export type QuizOutlineProgress =
  | { kind: "scored"; label: string }
  | { kind: "submitted" }
  | { kind: "none" };

/**
 * Score only when a frozen score exists and every answer is graded
 * (including short/long answers the teacher marks). Submitted otherwise.
 * Nothing when there is no attempt.
 */
export function quizOutlineProgress(attempt: {
  score: number | null;
  scoreTotal: number | null;
  ungradedAnswerCount: number;
} | null | undefined): QuizOutlineProgress {
  if (!attempt) return { kind: "none" };
  if (
    attempt.score != null &&
    attempt.scoreTotal != null &&
    attempt.ungradedAnswerCount === 0
  ) {
    return {
      kind: "scored",
      label: formatQuizScore(attempt.score, attempt.scoreTotal),
    };
  }
  return { kind: "submitted" };
}

/** Newest attempt per quiz among the given rows (newest first). */
export function latestAttemptByQuizId<
  T extends { quizId: number; submittedAt: string },
>(attempts: readonly T[]): Map<number, T> {
  const latest = new Map<number, T>();
  for (const attempt of attempts) {
    if (latest.has(attempt.quizId)) continue;
    latest.set(attempt.quizId, attempt);
  }
  return latest;
}
