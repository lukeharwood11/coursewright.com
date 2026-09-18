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
  const student = quizPrintLines(quiz, false);
  const staff = quizPrintLines(quiz, true);
  const studentText = student
    .filter((line) => line.kind === "text")
    .map((line) => line.text)
    .join("\n");
  const staffText = staff
    .filter((line) => line.kind === "text")
    .map((line) => line.text)
    .join("\n");
  const studentChoices = student.filter((line) => line.kind === "choice");
  const staffChoices = staff.filter((line) => line.kind === "choice");

  assert.match(studentText, /What is 2\+2\?/);
  assert.equal(studentChoices.length, 2);
  assert.equal(studentChoices[0]?.letter, "A");
  assert.equal(studentChoices[0]?.text, "3");
  assert.equal(studentChoices[0]?.checked, false);
  assert.equal(studentChoices[1]?.letter, "B");
  assert.equal(studentChoices[1]?.text, "4");
  assert.equal(studentChoices[1]?.checked, false);
  assert.doesNotMatch(studentText, /correct|Answer key/i);

  assert.match(staffText, /Answer key/);
  assert.equal(staffChoices[0]?.checked, false);
  assert.equal(staffChoices[1]?.checked, true);
  assert.equal(staffChoices[1]?.showCorrectLabel, true);
  assert.match(staffText, /Correct: B/);
});
