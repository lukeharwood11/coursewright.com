import assert from "node:assert/strict";
import test from "node:test";
import {
  accountIsStudentOnCourse,
  canShowAnswerKey,
  formatQuizScore,
  latestAttemptsByStudent,
  multipleChoiceIsCorrect,
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
