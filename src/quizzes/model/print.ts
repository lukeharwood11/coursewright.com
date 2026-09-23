import {
  clampAnswerLines,
  LONG_ANSWER_LINE_DEFAULT,
  matchKeyLetters,
  matchLayout,
  parseCourseQuizKind,
  type MatchKey,
  type MatchOption,
  type MatchPrompt,
  type QuizQuestionKind,
} from "./quiz";

export type CourseQuizPrintSource = {
  id: number;
  prompt: string;
  kind: string;
  choices: { id: string; text: string; correct: boolean }[];
  answer: string;
  answerLines: number | null;
  prompts: MatchPrompt[];
  options: MatchOption[];
  matchKeys: MatchKey[];
};

/** What the PDF is allowed to see. Matching letters are filled only for the answer key. */
export type CourseQuizPrintView = {
  prompt: string;
  kind: QuizQuestionKind;
  choices: { id: string; text: string; correct: boolean }[];
  answer: string;
  answerLines: number;
  matchLeft: { text: string; letter: string }[];
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
  const letters = showKey ? matchKeyLetters(layout, question.matchKeys) : new Map<number, string>();
  return {
    prompt: question.prompt,
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
      letter: letters.get(item.id) ?? "",
    })),
    matchRight: layout.right.map((item) => ({ letter: item.letter, text: item.text })),
  };
}
