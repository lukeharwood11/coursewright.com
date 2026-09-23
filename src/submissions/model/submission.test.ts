import assert from "node:assert/strict";
import { test } from "node:test";
import { dueInstantIso } from "./dueInstant";
import {
  attributionLine,
  finishedCountAfterTurnIn,
  pastDueBlocksTurnIn,
  submissionSlotOpen,
  turnInBatchError,
} from "./submission";

test("a batch of several files counts as one submission", () => {
  assert.equal(finishedCountAfterTurnIn(0, 4), 1);
  assert.equal(submissionSlotOpen(1, 2), true);
  assert.equal(submissionSlotOpen(finishedCountAfterTurnIn(1, 4), 2), false);
});

test("the limit blocks another turn-in and lowering it does not erase earlier ones", () => {
  assert.equal(submissionSlotOpen(3, 2), false);
  assert.equal(submissionSlotOpen(2, 2), false);
  assert.equal(submissionSlotOpen(1, 2), true);
});

test("past due blocks only when the teacher turned that off and the instant has passed", () => {
  const dueAt = dueInstantIso("2026-09-25", "23:59", "America/New_York");
  const after = new Date(new Date(dueAt).getTime() + 1000);
  const atDue = new Date(dueAt);
  assert.equal(
    pastDueBlocksTurnIn({ allowPastDue: false, dueAt, now: after }),
    true,
  );
  assert.equal(
    pastDueBlocksTurnIn({ allowPastDue: false, dueAt, now: atDue }),
    false,
  );
  assert.equal(
    pastDueBlocksTurnIn({ allowPastDue: true, dueAt, now: after }),
    false,
  );
  assert.equal(
    pastDueBlocksTurnIn({ allowPastDue: false, dueAt: null, now: after }),
    false,
  );
});

test("the attribution line names the parent and the child", () => {
  assert.equal(
    attributionLine("Alex Rivera", "Sam Rivera"),
    "Alex Rivera on behalf of Sam Rivera",
  );
});

test("a student turning in for themselves is just their name", () => {
  assert.equal(attributionLine("Sam Rivera", "Sam Rivera"), "Sam Rivera");
});

test("every file in the batch must match the allowed kinds", () => {
  assert.equal(
    turnInBatchError(
      [
        { name: "p1.jpg", type: "image/jpeg" },
        { name: "notes.docx", type: "" },
      ],
      ["image"],
    ),
    "Submit a photo.",
  );
  assert.equal(
    turnInBatchError(
      [
        { name: "p1.jpg", type: "image/jpeg" },
        { name: "p2.heic", type: "" },
      ],
      ["image", "pdf"],
    ),
    null,
  );
});
