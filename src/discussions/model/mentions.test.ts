import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyMention,
  filterMentionPeople,
  findMentionQuery,
  mentionLabel,
  mentionedUserIdsFromDraft,
  mentionedUserIdsInLexical,
  mentionedUserIdsInPlainText,
  splitMentionText,
} from "./mentions.ts";

const people = [
  { userId: "a", name: "Ann Lee" },
  { userId: "b", name: "Anna" },
  { userId: "c", name: "Luke Harwood" },
];

test("findMentionQuery starts at a fresh @ token", () => {
  assert.deepEqual(findMentionQuery("Hello @lu", 9), { start: 6, query: "lu" });
  assert.deepEqual(findMentionQuery("@", 1), { start: 0, query: "" });
  assert.equal(findMentionQuery("email@x", 7), null);
  assert.equal(findMentionQuery("Hi @lu\nmore", 7), null);
});

test("filterMentionPeople matches names and skips the author", () => {
  const filtered = filterMentionPeople(people, "ann", "a");
  assert.deepEqual(
    filtered.map((person) => person.userId),
    ["b"],
  );
  assert.equal(filterMentionPeople(people, "", "c").length, 2);
});

test("applyMention replaces the query with @Name and a trailing space", () => {
  const next = applyMention({
    text: "Hi @lu",
    start: 3,
    cursor: 6,
    name: "Luke Harwood",
  });
  assert.equal(next.text, "Hi @Luke Harwood ");
  assert.equal(next.cursor, 17);
  assert.equal(mentionLabel("Luke"), "@Luke");
});

test("splitMentionText prefers the longest name and keeps surrounding text", () => {
  const parts = splitMentionText("See @Anna and @Ann Lee please", people);
  assert.deepEqual(parts, [
    { kind: "text", text: "See " },
    { kind: "mention", userId: "b", name: "Anna" },
    { kind: "text", text: " and " },
    { kind: "mention", userId: "a", name: "Ann Lee" },
    { kind: "text", text: " please" },
  ]);
});

test("mentionedUserIdsInPlainText skips email-like at signs", () => {
  assert.deepEqual(
    mentionedUserIdsInPlainText("Ask @Luke Harwood via a@b.com", people),
    ["c"],
  );
});

test("mentionedUserIdsInLexical reads mention nodes and @names outside quotes", () => {
  const state = {
    root: {
      children: [
        {
          type: "quote",
          children: [
            { type: "text", text: "@Anna said this" },
            { type: "mention", userId: "b", text: "@Anna" },
          ],
        },
        {
          type: "paragraph",
          children: [
            { type: "mention", userId: "c", text: "@Luke Harwood" },
            { type: "text", text: " and @Ann Lee" },
          ],
        },
      ],
    },
  };
  assert.deepEqual(mentionedUserIdsInLexical(state, people), ["c", "a"]);
});

test("mentionedUserIdsFromDraft keeps mention nodes when people have not loaded", () => {
  const lexical = {
    root: {
      children: [{ type: "mention", userId: "c", text: "@Luke Harwood" }],
    },
  };
  assert.deepEqual(
    mentionedUserIdsFromDraft({
      mode: "lexical",
      text: "",
      lexical,
      people: [],
      excludeUserId: "me",
    }),
    ["c"],
  );
  assert.deepEqual(
    mentionedUserIdsFromDraft({
      mode: "lexical",
      text: "",
      lexical,
      people,
      excludeUserId: "c",
    }),
    [],
  );
});
