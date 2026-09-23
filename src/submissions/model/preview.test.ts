import assert from "node:assert/strict";
import { test } from "node:test";
import { canOpenSubmissionFile, submissionPreviewKind } from "./preview";

test("pdf, images, audio, video, and plain text open in the portal", () => {
  assert.equal(submissionPreviewKind("application/pdf", "a.pdf"), "pdf");
  assert.equal(submissionPreviewKind("", "notes.pdf"), "pdf");
  assert.equal(submissionPreviewKind("image/jpeg", "photo.jpg"), "image");
  assert.equal(submissionPreviewKind("image/png", "shot.png"), "image");
  assert.equal(submissionPreviewKind("audio/mpeg", "clip.mp3"), "audio");
  assert.equal(submissionPreviewKind("", "song.mp3"), "audio");
  assert.equal(submissionPreviewKind("video/mp4", "demo.mp4"), "video");
  assert.equal(submissionPreviewKind("text/plain", "notes.txt"), "text");
  assert.equal(submissionPreviewKind("", "readme.txt"), "text");
});

test("office docs and phone HEIC are download-only", () => {
  assert.equal(submissionPreviewKind("", "essay.docx"), null);
  assert.equal(submissionPreviewKind("application/msword", "old.doc"), null);
  assert.equal(submissionPreviewKind("image/heic", "phone.HEIC"), null);
  assert.equal(submissionPreviewKind("", "phone.heic"), null);
  assert.equal(submissionPreviewKind("video/x-msvideo", "clip.avi"), null);
  assert.equal(canOpenSubmissionFile("", "essay.docx"), false);
  assert.equal(canOpenSubmissionFile("application/pdf", "a.pdf"), true);
});
