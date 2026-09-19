export const QUIZ_QUESTION_KINDS = ["multiple_choice", "short_answer"] as const;
export type QuizQuestionKind = (typeof QUIZ_QUESTION_KINDS)[number];

export type QuizChoice = {
  id: string;
  text: string;
  correct: boolean;
};

export type QuizBody = {
  prompt: string;
  questionKind: QuizQuestionKind;
  choices: QuizChoice[];
  answer: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function newQuizChoiceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyQuizChoice(text = "", correct = false): QuizChoice {
  return { id: newQuizChoiceId(), text, correct };
}

export function defaultQuizBody(): QuizBody {
  return {
    prompt: "",
    questionKind: "multiple_choice",
    choices: [
      emptyQuizChoice(),
      emptyQuizChoice(),
      emptyQuizChoice(),
      emptyQuizChoice(),
    ],
    answer: "",
  };
}

export function parseQuizQuestionKind(value: unknown): QuizQuestionKind {
  return value === "short_answer" ? "short_answer" : "multiple_choice";
}

export function parseQuizChoice(value: unknown): QuizChoice | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = typeof record.id === "string" && record.id.trim() ? record.id : newQuizChoiceId();
  return {
    id,
    text: typeof record.text === "string" ? record.text : "",
    correct: record.correct === true,
  };
}

export function parseQuizBody(value: unknown): QuizBody {
  const record = asRecord(value);
  if (!record) return defaultQuizBody();
  const choices = Array.isArray(record.choices)
    ? record.choices.flatMap((choice) => {
        const parsed = parseQuizChoice(choice);
        return parsed ? [parsed] : [];
      })
    : [];
  return {
    prompt: typeof record.prompt === "string" ? record.prompt : "",
    questionKind: parseQuizQuestionKind(record.questionKind),
    choices,
    answer: typeof record.answer === "string" ? record.answer : "",
  };
}

export function quizChoiceLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

export function printableQuizChoices(quiz: QuizBody): QuizChoice[] {
  return quiz.choices.filter((choice) => choice.text.trim() !== "");
}

export function quizCorrectChoiceLetters(quiz: QuizBody): string {
  return printableQuizChoices(quiz)
    .flatMap((choice, index) => (choice.correct ? [quizChoiceLetter(index)] : []))
    .join(", ");
}

export type QuizPrintTextLine = {
  id: string;
  kind: "text";
  tone: "label" | "body" | "meta";
  text: string;
};

/** Multiple-choice row for PDF: checkbox is drawn, not bracket text. */
export type QuizPrintChoiceLine = {
  id: string;
  kind: "choice";
  letter: string;
  text: string;
  /** Filled / marked only on staff answer-key packets. */
  checked: boolean;
  showCorrectLabel: boolean;
};

export type QuizPrintLine = QuizPrintTextLine | QuizPrintChoiceLine;

export function quizPrintLines(
  quiz: QuizBody,
  includeAnswerKey: boolean,
): QuizPrintLine[] {
  const lines: QuizPrintLine[] = [
    {
      id: "label",
      kind: "text",
      tone: "label",
      text: includeAnswerKey ? "Quiz · Answer key" : "Quiz",
    },
    {
      id: "prompt",
      kind: "text",
      tone: quiz.prompt.trim() ? "body" : "meta",
      text: quiz.prompt.trim() || "Question",
    },
  ];
  if (quiz.questionKind === "short_answer") {
    lines.push({
      id: "answer",
      kind: "text",
      tone: "body",
      text: includeAnswerKey
        ? `Answer: ${quiz.answer.trim() || "Not marked yet"}`
        : "________________________________",
    });
    return lines;
  }
  quiz.choices.forEach((choice, index) => {
    if (!choice.text.trim() && !includeAnswerKey) return;
    const checked = includeAnswerKey && choice.correct;
    lines.push({
      id: choice.id,
      kind: "choice",
      letter: quizChoiceLetter(index),
      text: choice.text.trim() || "Empty choice",
      checked,
      showCorrectLabel: checked,
    });
  });
  const letters = quizCorrectChoiceLetters(quiz);
  if (includeAnswerKey && letters) {
    lines.push({
      id: "correct",
      kind: "text",
      tone: "meta",
      text: `Correct: ${letters}`,
    });
  }
  return lines;
}

