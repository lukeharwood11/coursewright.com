import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQuizPrintKeySearch,
  defaultQuizKeyPrintMode,
  parseQuizKeyModeMap,
  parseQuizPrintKeySearch,
  quizKeyModeForQuiz,
  serializeQuizKeyModeMap,
} from "./quizKeyPrintMode.ts";

test("defaultQuizKeyPrintMode", () => {
  assert.equal(defaultQuizKeyPrintMode(true), "key");
  assert.equal(defaultQuizKeyPrintMode(false), "worksheet");
});

test("quiz key mode map round-trips", () => {
  const map = new Map([
    [12, "key" as const],
    [15, "both" as const],
  ]);
  const raw = serializeQuizKeyModeMap(map);
  assert.equal(raw, "12=key,15=both");
  assert.deepEqual(parseQuizKeyModeMap(raw), map);
});

test("quizKeyModeForQuiz respects override when key allowed", () => {
  const overrides = parseQuizKeyModeMap("9=worksheet");
  assert.equal(quizKeyModeForQuiz(9, overrides, true), "worksheet");
  assert.equal(quizKeyModeForQuiz(9, overrides, false), "worksheet");
});

test("parseQuizPrintKeySearch", () => {
  assert.equal(parseQuizPrintKeySearch("?quizKey=both"), "both");
  assert.equal(buildQuizPrintKeySearch("both"), "?quizKey=both");
});
