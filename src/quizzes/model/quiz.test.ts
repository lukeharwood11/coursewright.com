import assert from "node:assert/strict";
import test from "node:test";
import { presentCourseQuizPrint } from "./print";
import {
  accountIsStudentOnCourse,
  canShowAnswerKey,
  formatQuizScore,
  latestAttemptsByStudent,
  matchKeyLetters,
  matchLayout,
  matchingIsCorrect,
  multipleChoiceIsCorrect,
  numbersMatch,
  stableShuffle,
  quizAttemptLabel,
  quizWindowState,
  scoreMultipleChoice,
} from "./quiz";

const now = new Date("2026-09-23T15:00:00.000Z");

test("no accepting window is download only", () => {
  assert.equal(
    quizWindowState({ acceptsFrom: null, acceptsUntil: null }, now),
    "download_only",
  );
});

test("window bounds reject early and late instants", () => {
  assert.equal(
    quizWindowState(
      { acceptsFrom: "2026-09-23T16:00:00.000Z", acceptsUntil: null },
      now,
    ),
    "not_yet",
  );
  assert.equal(
    quizWindowState(
      { acceptsFrom: null, acceptsUntil: "2026-09-23T15:00:00.000Z" },
      now,
    ),
    "closed",
  );
  assert.equal(
    quizWindowState(
      {
        acceptsFrom: "2026-09-23T14:00:00.000Z",
        acceptsUntil: "2026-09-23T16:00:00.000Z",
      },
      now,
    ),
    "open",
  );
});

test("multiple choice matches the correct set exactly", () => {
  assert.equal(multipleChoiceIsCorrect([2, 1], [1, 2]), true);
  assert.equal(multipleChoiceIsCorrect([1], [1, 2]), false);
  assert.equal(multipleChoiceIsCorrect([], []), null);
  assert.deepEqual(
    scoreMultipleChoice([
      { selectedIds: [1], correctIds: [1] },
      { selectedIds: [3], correctIds: [4] },
      { selectedIds: [], correctIds: [] },
    ]),
    { score: 1, scoreTotal: 2 },
  );
  assert.equal(formatQuizScore(1, 2), "1 of 2");
});

test("parents are named on behalf of the student; students are not", () => {
  assert.equal(
    quizAttemptLabel({
      parentName: "Lana",
      studentName: "Ava",
      submitterIsStudent: false,
    }),
    "Lana on behalf of Ava",
  );
  assert.equal(
    quizAttemptLabel({
      parentName: "Ava",
      studentName: "Ava",
      submitterIsStudent: true,
    }),
    "Ava",
  );
  assert.equal(
    accountIsStudentOnCourse("ava@example.com", [
      { studentEmail: "Ava@example.com" },
    ]),
    true,
  );
  assert.equal(
    accountIsStudentOnCourse("lana@example.com", [
      { studentEmail: "ava@example.com" },
    ]),
    false,
  );
});

test("students never see the answer key", () => {
  assert.equal(
    canShowAnswerKey({
      teacherView: true,
      shareWithParents: false,
      viewerIsStudent: false,
    }),
    true,
  );
  assert.equal(
    canShowAnswerKey({
      teacherView: false,
      shareWithParents: true,
      viewerIsStudent: false,
    }),
    true,
  );
  assert.equal(
    canShowAnswerKey({
      teacherView: false,
      shareWithParents: true,
      viewerIsStudent: true,
    }),
    false,
  );
});

test("numbers match decimals and simple fractions", () => {
  assert.equal(numbersMatch("3.50", "3.5"), true);
  assert.equal(numbersMatch("7/2", "3.5"), true);
  assert.equal(numbersMatch("3.6", "3.5"), false);
  assert.equal(numbersMatch("abc", "3.5"), false);
  assert.equal(numbersMatch("3", ""), null);
  assert.equal(numbersMatch("+3.50", "3.5"), true);
  assert.equal(numbersMatch("-7/2", "-3.5"), true);
  assert.equal(numbersMatch("7/-2", "-3.5"), false);
  assert.equal(numbersMatch("3", "7/-2"), null);
});

test("matching is an exact pairing and the right column stays stable", () => {
  const keys = [
    { promptId: 1, optionId: 10 },
    { promptId: 2, optionId: 11 },
  ];
  assert.equal(
    matchingIsCorrect(keys, [
      { leftId: 1, rightId: 10 },
      { leftId: 2, rightId: 11 },
    ]),
    true,
  );
  assert.equal(
    matchingIsCorrect(keys, [
      { leftId: 1, rightId: 11 },
      { leftId: 2, rightId: 10 },
    ]),
    false,
  );
  assert.equal(matchingIsCorrect([], []), null);
  const prompts = [
    { id: 1, position: 0, text: "Dog" },
    { id: 2, position: 1, text: "Cat" },
    { id: 3, position: 2, text: "Bird" },
  ];
  const options = [
    { id: 10, position: 0, text: "canine" },
    { id: 11, position: 1, text: "feline" },
    { id: 12, position: 2, text: "avian" },
  ];
  const first = matchLayout(prompts, options, 9);
  const second = matchLayout(prompts, options, 9);
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.left.map((item) => item.text),
    ["Dog", "Cat", "Bird"],
  );
  const canine = first.right.find((item) => item.id === 10);
  assert.equal(matchKeyLetters(first, [{ promptId: 1, optionId: 10 }]).get(1), canine?.letter);
  assert.deepEqual(
    stableShuffle([1, 2, 3], 9),
    stableShuffle([1, 2, 3], 9),
  );
  const hidden = presentCourseQuizPrint(
    {
      id: 9,
      prompt: "Animals",
      kind: "matching",
      choices: [],
      answer: "3.5",
      answerLines: 40,
      prompts,
      options,
      matchKeys: [{ promptId: 1, optionId: 10 }],
    },
    false,
  );
  assert.equal(hidden.matchLeft[0]?.letter, "");
  assert.equal(hidden.answer, "");
  assert.equal(hidden.matchRight.length, 3);
  const shown = presentCourseQuizPrint(
    {
      id: 4,
      prompt: "Explain",
      kind: "long_answer",
      choices: [],
      answer: "A sample",
      answerLines: 40,
      prompts: [],
      options: [],
      matchKeys: [],
    },
    true,
  );
  assert.equal(shown.answer, "A sample");
  assert.equal(shown.answerLines, 20);
});

test("families see the newest entry for each student", () => {
  assert.deepEqual(
    latestAttemptsByStudent([
      { id: 3, studentProfileId: 1 },
      { id: 2, studentProfileId: 2 },
      { id: 1, studentProfileId: 1 },
    ]).map((attempt) => attempt.id),
    [3, 2],
  );
});
