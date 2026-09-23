import assert from "node:assert/strict";
import test from "node:test";
import { mergeOutline, nextOutlinePosition } from "./outline";

test("outline mixes materials and quizzes by position", () => {
  assert.deepEqual(
    mergeOutline(
      [
        { id: 2, position: 1 },
        { id: 1, position: 0 },
      ],
      [{ id: 9, position: 0 }],
    ),
    [
      { kind: "material", id: 1, position: 0 },
      { kind: "quiz", id: 9, position: 0 },
      { kind: "material", id: 2, position: 1 },
    ],
  );
  assert.equal(
    nextOutlinePosition(
      [{ id: 1, position: 2 }],
      [{ id: 9, position: 4 }],
    ),
    5,
  );
});
