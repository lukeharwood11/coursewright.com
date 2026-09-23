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
