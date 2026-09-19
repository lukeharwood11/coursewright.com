import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filePlaybackKind,
  formatPlaybackTime,
  isLikelyPlayableAudio,
} from "./playback";

test("filePlaybackKind uses MIME when present", () => {
  assert.equal(filePlaybackKind("audio/mpeg", "clip.bin"), "audio");
  assert.equal(filePlaybackKind("video/mp4", "clip.mp3"), "video");
  assert.equal(filePlaybackKind("application/pdf"), "pdf");
});

test("filePlaybackKind falls back to extension for vague MIME", () => {
  assert.equal(filePlaybackKind("", "lesson.mp3"), "audio");
  assert.equal(filePlaybackKind("application/octet-stream", "rec.m4a"), "audio");
  assert.equal(filePlaybackKind("", "clip.MP3"), "audio");
  assert.equal(filePlaybackKind("", "notes.pdf"), "other");
});

test("isLikelyPlayableAudio matches mime or extension", () => {
  assert.equal(isLikelyPlayableAudio("audio/wav"), true);
  assert.equal(isLikelyPlayableAudio("", "song.aac"), true);
  assert.equal(isLikelyPlayableAudio("application/pdf", "x.mp3"), false);
});

test("formatPlaybackTime renders m:ss and h:mm:ss", () => {
  assert.equal(formatPlaybackTime(0), "0:00");
  assert.equal(formatPlaybackTime(65), "1:05");
  assert.equal(formatPlaybackTime(3661), "1:01:01");
  assert.equal(formatPlaybackTime(Number.NaN), "0:00");
});
