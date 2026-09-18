import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseQuizBody,
  quizChoiceLetter,
  quizCorrectChoiceLetters,
  quizPrintLines,
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

test("student print lines hide answers; staff print lines include the key", () => {
  const quiz = parseQuizBody({
    prompt: "What is 2+2?",
    questionKind: "multiple_choice",
    choices: [
      { id: "a", text: "3", correct: false },
      { id: "b", text: "4", correct: true },
    ],
  });
  const student = quizPrintLines(quiz, false)
    .map((line) => line.text)
    .join("\n");
  const staff = quizPrintLines(quiz, true)
    .map((line) => line.text)
    .join("\n");
  assert.match(student, /What is 2\+2\?/);
  assert.match(student, /\[ \] A\. 3/);
  assert.match(student, /\[ \] B\. 4/);
  assert.doesNotMatch(student, /correct|Answer key/i);
  assert.match(staff, /Answer key/);
  assert.match(staff, /\[X\] B\. 4 {2}\(correct\)/);
  assert.match(staff, /Correct: B/);
});
