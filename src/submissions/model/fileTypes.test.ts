import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acceptAttribute,
  fileAllowedForSubmission,
  turnInTypeMessage,
} from "./fileTypes";

test("photos match by extension when the phone omits a useful MIME", () => {
  assert.equal(
    fileAllowedForSubmission(["image"], "worksheet.HEIC", "application/octet-stream"),
    true,
  );
  assert.equal(fileAllowedForSubmission(["image"], "scan.pdf", "application/pdf"), false);
});

test("a file is allowed when either the extension or the MIME matches", () => {
  assert.equal(fileAllowedForSubmission(["pdf"], "page.bin", "application/pdf"), true);
  assert.equal(fileAllowedForSubmission(["audio"], "song.mp3", ""), true);
  assert.equal(fileAllowedForSubmission(["video"], "clip.webm", "video/webm"), true);
  assert.equal(fileAllowedForSubmission(["document"], "notes.docx", ""), true);
  assert.equal(fileAllowedForSubmission(["pdf", "image"], "notes.docx", ""), false);
});

test("the rejection names the kinds the teacher allowed", () => {
  assert.equal(turnInTypeMessage(["pdf", "image"]), "Turn in a PDF or a photo.");
  assert.equal(
    turnInTypeMessage(["pdf", "document", "audio"]),
    "Turn in a PDF, a document, or an audio file.",
  );
});

test("the picker accept list includes photo extensions", () => {
  const accept = acceptAttribute(["image"]);
  assert.equal(accept.includes(".heic"), true);
  assert.equal(accept.includes(".pdf"), false);
});
