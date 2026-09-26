import assert from "node:assert/strict";
import test from "node:test";
import { courseQuizPrintPrompt, presentCourseQuizPrint } from "./print";
import {
  accountIsStudentOnCourse,
  canShowAnswerKey,
  awardedPoints,
  formatPoints,
  formatQuizScore,
  latestAttemptsByStudent,
  quizGradeStatus,
  quizGradingQueue,
  matchKeyLetters,
  matchKeyTexts,
  matchLayout,
  matchingIsCorrect,
  multipleChoiceIsCorrect,
  numbersMatch,
  quizAnswerGrade,
  quizAnswerGradeLabel,
  quizOutlineProgress,
  attemptIsFullyGraded,
  savedQuizAnswerFields,
  stableShuffle,
  quizAttemptLabel,
  quizWindowState,
  scoreMultipleChoice,
} from "./quiz";

const now = new Date("2026-09-23T15:00:00.000Z");

test("accept entries off is download only", () => {
  assert.equal(
    quizWindowState(
      { acceptEntries: false, acceptsFrom: null, acceptsUntil: null },
      now,
    ),
    "download_only",
  );
});

test("accept entries on with no dates is open", () => {
  assert.equal(
    quizWindowState(
      { acceptEntries: true, acceptsFrom: null, acceptsUntil: null },
      now,
    ),
    "open",
  );
});

test("window bounds reject early and late instants", () => {
  assert.equal(
    quizWindowState(
      {
        acceptEntries: true,
        acceptsFrom: "2026-09-23T16:00:00.000Z",
        acceptsUntil: null,
      },
      now,
    ),
    "not_yet",
  );
  assert.equal(
    quizWindowState(
      {
        acceptEntries: true,
        acceptsFrom: null,
        acceptsUntil: "2026-09-23T15:00:00.000Z",
      },
      now,
    ),
    "closed",
  );
  assert.equal(
    quizWindowState(
      {
        acceptEntries: true,
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
  assert.equal(formatQuizScore(1, 2), "Score 1/2 (50%)");
  assert.equal(formatQuizScore(4.5, 5), "Score 4.5/5 (90%)");
  assert.equal(formatQuizScore(0, 0), "Score 0/0");
  assert.equal(formatPoints(4), "4");
  assert.equal(formatPoints(4.5), "4.5");
  assert.equal(formatPoints(4.25), "4.25");
});

test("multiple correct choices lose a share for each wrong choice", () => {
  assert.equal(awardedPoints({ points: 4, hits: 3, total: 4, misses: 1 }), 2);
  assert.equal(awardedPoints({ points: 4, hits: 4, total: 4, misses: 0 }), 4);
  assert.equal(awardedPoints({ points: 4, hits: 1, total: 4, misses: 4 }), 0);
  assert.equal(awardedPoints({ points: 1, hits: 1, total: 3, misses: 0 }), 0.33);
  assert.equal(awardedPoints({ points: 1, hits: 3, total: 3, misses: 0 }), 1);
});

test("matching awards each correct pair and does not subtract a wrong pair", () => {
  assert.equal(awardedPoints({ points: 4, hits: 3, total: 4 }), 3);
  assert.equal(awardedPoints({ points: 5, hits: 1, total: 3 }), 1.67);
  assert.equal(awardedPoints({ points: 5, hits: 3, total: 3 }), 5);
  assert.equal(awardedPoints({ points: 4, hits: 0, total: 4 }), 0);
});

test("points show full, partial, zero, or not yet graded", () => {
  assert.equal(quizAnswerGrade(null, 4), "pending");
  assert.equal(quizAnswerGrade(4, 4), "correct");
  assert.equal(quizAnswerGrade(0, 4), "incorrect");
  assert.equal(quizAnswerGrade(2, 4), "partial");
  assert.equal(quizAnswerGrade(4.5, 5), "partial");
  assert.equal(quizAnswerGradeLabel("partial", 4.5, 5), "4.5 / 5");
  assert.equal(quizAnswerGradeLabel("pending", null, 5), "Yet to be graded");
});

test("outline progress waits until every answer is graded", () => {
  assert.equal(quizOutlineProgress(null).kind, "none");
  assert.equal(
    quizOutlineProgress({
      score: 4,
      scoreTotal: 5,
      ungradedAnswerCount: 1,
    }).kind,
    "submitted",
  );
  assert.deepEqual(
    quizOutlineProgress({
      score: 4,
      scoreTotal: 5,
      ungradedAnswerCount: 0,
    }),
    { kind: "scored", label: "Score 4/5 (80%)" },
  );
  assert.equal(
    quizOutlineProgress({
      score: null,
      scoreTotal: null,
      ungradedAnswerCount: 0,
    }).kind,
    "submitted",
  );
  assert.equal(
    attemptIsFullyGraded([
      { teacherPoints: null, autoPoints: 1 },
      { teacherPoints: 0, autoPoints: null },
    ]),
    true,
  );
  assert.equal(
    attemptIsFullyGraded([
      { teacherPoints: null, autoPoints: 1 },
      { teacherPoints: null, autoPoints: null },
    ]),
    false,
  );
  assert.equal(
    quizGradeStatus({
      autograded: true,
      teacherGradedAt: null,
      answers: [{ teacherPoints: null, autoPoints: 1 }],
    }),
    "autograded",
  );
  assert.equal(
    quizGradeStatus({
      autograded: true,
      teacherGradedAt: null,
      answers: [
        { teacherPoints: null, autoPoints: 1 },
        { teacherPoints: null, autoPoints: null },
      ],
    }),
    "needs_grading",
  );
  assert.equal(
    quizGradeStatus({
      autograded: true,
      teacherGradedAt: "2026-09-23T15:00:00.000Z",
      answers: [{ teacherPoints: 4.5, autoPoints: 5 }],
    }),
    "graded",
  );
  assert.deepEqual(
    quizGradingQueue([
      {
        id: 2,
        submittedAt: "2026-09-23T12:00:00.000Z",
        autograded: true,
        teacherGradedAt: null,
        answers: [{ teacherPoints: null, autoPoints: 1 }],
      },
      {
        id: 1,
        submittedAt: "2026-09-23T11:00:00.000Z",
        autograded: true,
        teacherGradedAt: null,
        answers: [{ teacherPoints: null, autoPoints: null }],
      },
      {
        id: 3,
        submittedAt: "2026-09-23T13:00:00.000Z",
        autograded: true,
        teacherGradedAt: "2026-09-23T14:00:00.000Z",
        answers: [{ teacherPoints: 1, autoPoints: 1 }],
      },
    ]).map((attempt) => attempt.id),
    [1, 2],
  );
});

test("saved answers refill the take form fields", () => {
  assert.deepEqual(
    savedQuizAnswerFields([
      {
        questionId: 1,
        choiceIds: [3, 4],
        answerText: "",
        matchPairs: [],
      },
      {
        questionId: 2,
        choiceIds: [],
        answerText: "7/2",
        matchPairs: [],
      },
      {
        questionId: 3,
        choiceIds: [],
        answerText: "",
        matchPairs: [
          { leftId: 10, rightId: 20 },
          { leftId: 11, rightId: 21 },
        ],
      },
    ]),
    {
      selected: { 1: [3, 4] },
      text: { 2: "7/2" },
      matches: { 3: { 10: 20, 11: 21 } },
    },
  );
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
  assert.equal(matchKeyTexts(first, [{ promptId: 1, optionId: 10 }]).get(1), "canine");
  assert.deepEqual(
    stableShuffle([1, 2, 3], 9),
    stableShuffle([1, 2, 3], 9),
  );
  assert.equal(courseQuizPrintPrompt("What comes next?", 5), "What comes next? (5 points)");
  assert.equal(courseQuizPrintPrompt("Solo", 1), "Solo (1 point)");
  assert.equal(courseQuizPrintPrompt("Solo", 1, 1), "1. Solo (1 point)");
  const hidden = presentCourseQuizPrint(
    {
      id: 9,
      prompt: "Animals",
      points: 2,
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
  assert.equal(hidden.matchLeft[0]?.matchAnswer, "");
  assert.equal(hidden.answer, "");
  assert.equal(hidden.matchRight.length, 3);
  const matchingKey = presentCourseQuizPrint(
    {
      id: 9,
      prompt: "Animals",
      points: 2,
      kind: "matching",
      choices: [],
      answer: "",
      answerLines: 40,
      prompts,
      options,
      matchKeys: [{ promptId: 1, optionId: 10 }],
    },
    true,
  );
  assert.equal(matchingKey.matchLeft[0]?.matchAnswer, "canine");
  const shown = presentCourseQuizPrint(
    {
      id: 4,
      prompt: "Explain",
      points: 3,
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
