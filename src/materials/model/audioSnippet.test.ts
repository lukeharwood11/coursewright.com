import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUDIO_SNIPPET_MAX_SECONDS,
  audioSnippetExtension,
  audioSnippetFilename,
  formatSnippetClock,
  snippetReachedMax,
} from "./audioSnippet.ts";

test("picks a filename extension from the recorder mime type", () => {
  assert.equal(audioSnippetExtension("audio/webm;codecs=opus"), "webm");
  assert.equal(audioSnippetExtension("audio/mp4"), "m4a");
  assert.equal(audioSnippetExtension("audio/ogg;codecs=opus"), "ogg");
});

test("names a recorded snippet with the date", () => {
  assert.equal(
    audioSnippetFilename("audio/webm", new Date("2026-09-20T12:00:00.000Z")),
    "audio-snippet-2026-09-20.webm",
  );
});

test("stops at five minutes", () => {
  assert.equal(snippetReachedMax((AUDIO_SNIPPET_MAX_SECONDS - 1) * 1000), false);
  assert.equal(snippetReachedMax(AUDIO_SNIPPET_MAX_SECONDS * 1000), true);
});

test("formats the recording clock", () => {
  assert.equal(formatSnippetClock(0), "0:00");
  assert.equal(formatSnippetClock(65_000), "1:05");
  assert.equal(formatSnippetClock(AUDIO_SNIPPET_MAX_SECONDS * 1000), "5:00");
});
