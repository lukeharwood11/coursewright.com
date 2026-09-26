import {
  clampAnswerLines,
  formatPoints,
  LONG_ANSWER_LINE_DEFAULT,
  matchKeyTexts,
  matchLayout,
  parseCourseQuizKind,
  questionPointsAreValid,
  roundPoints,
  type MatchKey,
  type MatchOption,
  type MatchPrompt,
  type QuizQuestionKind,
} from "./quiz";

export function normalizeQuestionPoints(points: number): number {
  return questionPointsAreValid(points) ? roundPoints(points) : 1;
}

export function courseQuizPointsLabel(points: number): string {
  const possible = normalizeQuestionPoints(points);
  const unit = possible === 1 ? "point" : "points";
  return `(${formatPoints(possible)} ${unit})`;
}

export function courseQuizPrintPrompt(prompt: string, points: number, number?: number): string {
  const title = prompt.trim() || "Question";
  const body = `${title} ${courseQuizPointsLabel(points)}`;
  return number == null ? body : `${number}. ${body}`;
}

export type CourseQuizPrintSource = {
  id: number;
  prompt: string;
  points: number;
  kind: string;
  choices: { id: string; text: string; correct: boolean }[];
  answer: string;
  answerLines: number | null;
  prompts: MatchPrompt[];
  options: MatchOption[];
  matchKeys: MatchKey[];
};

/** What the PDF is allowed to see. Matching answer text is filled only for the answer key. */
export type CourseQuizPrintView = {
  prompt: string;
  points: number;
  kind: QuizQuestionKind;
  choices: { id: string; text: string; correct: boolean }[];
  answer: string;
  answerLines: number;
  matchLeft: { text: string; matchAnswer: string }[];
  matchRight: { letter: string; text: string }[];
};

export function presentCourseQuizPrint(
  question: CourseQuizPrintSource,
  showKey: boolean,
): CourseQuizPrintView {
  const kind = parseCourseQuizKind(question.kind);
  const layout =
    kind === "matching"
      ? matchLayout(question.prompts, question.options, question.id)
      : { left: [], right: [] };
  const matchAnswers = showKey
    ? matchKeyTexts(layout, question.matchKeys)
    : new Map<number, string>();
  return {
    prompt: question.prompt,
    points: normalizeQuestionPoints(question.points),
    kind,
    choices: question.choices.map((choice) => ({
      ...choice,
      correct: showKey && choice.correct,
    })),
    answer: showKey ? question.answer : "",
    answerLines:
      kind === "long_answer"
        ? clampAnswerLines(question.answerLines ?? LONG_ANSWER_LINE_DEFAULT)
        : LONG_ANSWER_LINE_DEFAULT,
    matchLeft: layout.left.map((item) => ({
      text: item.text,
      matchAnswer: matchAnswers.get(item.id) ?? "",
    })),
    matchRight: layout.right.map((item) => ({ letter: item.letter, text: item.text })),
  };
}
