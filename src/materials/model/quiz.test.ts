import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseQuizBody,
  quizChoiceLetter,
  quizCorrectChoiceLetters,
} from "./quiz";

test("parseQuizBody fills defaults and keeps correct flags", () => {
  const quiz = parseQuizBody({
    prompt: "2+2",
    questionKind: "multiple_choice",
    choices: [
      { id: "a", text: "4", correct: true },
      { id: "b", text: "5", correct: false },
    ],
  });
  assert.equal(quiz.prompt, "2+2");
  assert.equal(quiz.answer, "");
  assert.equal(quizCorrectChoiceLetters(quiz), "A");
  assert.equal(quizChoiceLetter(1), "B");
});

test("short-answer quizzes keep the stored answer for the key", () => {
  const quiz = parseQuizBody({
    prompt: "Capital",
    questionKind: "short_answer",
    answer: "Paris",
  });
  assert.equal(quiz.questionKind, "short_answer");
  assert.equal(quiz.answer, "Paris");
  assert.equal(quizCorrectChoiceLetters(quiz), "");
});
