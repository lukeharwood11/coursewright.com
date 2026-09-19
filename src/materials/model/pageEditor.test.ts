import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterSlashOptions,
  imageFilesFromClipboard,
  normalizeHttpUrl,
  parseSlashTableQuery,
  parseTableDimensions,
  slashTableChoices,
} from "./pageEditor";

test("parseTableDimensions accepts in-range sizes", () => {
  assert.deepEqual(parseTableDimensions("3", "4"), { rows: 3, columns: 4 });
});

test("parseTableDimensions rejects empty or out-of-range sizes", () => {
  assert.equal(parseTableDimensions("", "3"), null);
  assert.equal(parseTableDimensions("0", "3"), null);
  assert.equal(parseTableDimensions("3", "11"), null);
  assert.equal(parseTableDimensions("21", "2"), null);
  assert.equal(parseTableDimensions("2.5", "2"), null);
});

test("parseSlashTableQuery reads Notion-style 3x4 shortcuts", () => {
  assert.deepEqual(parseSlashTableQuery("3x4"), { rows: 3, columns: 4 });
  assert.deepEqual(parseSlashTableQuery("3x"), { rows: 3, columns: null });
  assert.deepEqual(parseSlashTableQuery("3"), { rows: 3, columns: null });
  assert.equal(parseSlashTableQuery("table"), null);
  assert.equal(parseSlashTableQuery("30x2"), null);
});

test("slashTableChoices expands a row-only query into column options", () => {
  const choices = slashTableChoices("2");
  assert.equal(choices[0]?.columns, 1);
  assert.equal(choices.at(-1)?.columns, 10);
  assert.deepEqual(slashTableChoices("2x3"), [{ rows: 2, columns: 3 }]);
});

test("filterSlashOptions matches title and keywords", () => {
  const options = [
    { id: "table", title: "Table", keywords: ["grid", "spreadsheet"] },
    { id: "quiz", title: "Quiz", keywords: ["question"] },
  ];
  assert.deepEqual(
    filterSlashOptions(options, "grid").map((option) => option.id),
    ["table"],
  );
  assert.deepEqual(
    filterSlashOptions(options, "QU").map((option) => option.id),
    ["quiz"],
  );
  assert.equal(filterSlashOptions(options, "").length, 2);
});

test("normalizeHttpUrl adds https when the address has no protocol", () => {
  assert.equal(normalizeHttpUrl("https://example.com/watch"), "https://example.com/watch");
  assert.equal(normalizeHttpUrl("example.com/watch"), "https://example.com/watch");
  assert.equal(normalizeHttpUrl("not a url"), null);
  assert.equal(normalizeHttpUrl("   "), null);
});

test("imageFilesFromClipboard prefers image items over files", () => {
  const png = new File([new Uint8Array([1])], "shot.png", { type: "image/png" });
  const textItem = {
    kind: "string",
    type: "text/plain",
    getAsFile: () => null,
  };
  const imageItem = {
    kind: "file",
    type: "image/png",
    getAsFile: () => png,
  };
  const pdf = new File([new Uint8Array([1])], "doc.pdf", { type: "application/pdf" });

  assert.deepEqual(
    imageFilesFromClipboard({ items: [textItem, imageItem], files: [pdf] }),
    [png],
  );
  assert.deepEqual(
    imageFilesFromClipboard({
      items: [textItem],
      files: [png, pdf],
    }),
    [png],
  );
  assert.deepEqual(imageFilesFromClipboard({ items: [textItem], files: [pdf] }), []);
});
