import assert from "node:assert/strict";
import { test } from "node:test";
import { printKeyMaterial } from "./thisWeekPrintCatalog.ts";
import {
  buildQuizPrintKeySearch,
  buildThisWeekPrintSearch,
  parseQuizPrintKeySearch,
  parseThisWeekPrintSearch,
} from "./paths.ts";

test("this-week print search round-trips layout options", () => {
  const key = printKeyMaterial(1, 100);
  const selection = {
    omittedKeys: new Set([key]),
    breakKeys: new Set(["s2:q:9"]),
    pack: false,
    studentBreaks: false,
    quizKeyModes: new Map([[9, "both" as const]]),
  };
  const search = buildThisWeekPrintSearch({ studentIds: [1, 2], selection });
  const parsed = parseThisWeekPrintSearch(search);
  assert.deepEqual(parsed.studentIds, [1, 2]);
  assert.ok(parsed.selection.omittedKeys.has(key));
  assert.ok(parsed.selection.breakKeys.has("s2:q:9"));
  assert.equal(parsed.selection.pack, false);
  assert.equal(parsed.selection.studentBreaks, false);
  assert.equal(parsed.selection.quizKeyModes.get(9), "both");
});

test("this-week print search round-trips week param", () => {
  const selection = {
    omittedKeys: new Set<string>(),
    breakKeys: new Set<string>(),
    pack: true,
    studentBreaks: true,
    quizKeyModes: new Map<number, "both">(),
  };
  const search = buildThisWeekPrintSearch({
    weekStart: "2026-09-20",
    selection,
  });
  const parsed = parseThisWeekPrintSearch(search);
  assert.equal(parsed.weekStart, "2026-09-20");
});

test("quiz print key search round-trips", () => {
  const search = buildQuizPrintKeySearch("both");
  assert.equal(parseQuizPrintKeySearch(search), "both");
});
