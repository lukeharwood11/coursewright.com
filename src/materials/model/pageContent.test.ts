import assert from "node:assert/strict";
import { test } from "node:test";
import type { SerializedEditorState } from "lexical";
import {
  editorStateToBlocks,
  printSegmentsFromBlocks,
  splitLexicalNodes,
} from "./pageContent";

const YT = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

function editorState(children: unknown[]): SerializedEditorState {
  return {
    root: {
      type: "root",
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  } as SerializedEditorState;
}

function paragraph(text: string, extras: unknown[] = []) {
  return {
    type: "paragraph",
    version: 1,
    children: [
      { type: "text", text, version: 1 },
      ...extras,
    ],
  };
}

function videoNode(url: string) {
  return { type: "video", url, version: 1 };
}

test("root-level video nodes become video blocks with the URL", () => {
  const blocks = editorStateToBlocks(
    editorState([paragraph("Intro"), videoNode(YT), paragraph("Outro")]),
  );
  assert.deepEqual(
    blocks.map((block) => block.kind),
    ["rich_text", "video", "rich_text"],
  );
  assert.deepEqual(blocks[1]?.body, { url: YT });
});

test("video nested in a paragraph is hoisted to a video block", () => {
  const blocks = editorStateToBlocks(
    editorState([
      {
        type: "paragraph",
        version: 1,
        children: [videoNode(YT)],
      },
    ]),
  );
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.kind, "video");
  assert.deepEqual(blocks[0]?.body, { url: YT });
});

test("text before a nested video stays in the rich-text block", () => {
  const blocks = editorStateToBlocks(
    editorState([
      {
        type: "paragraph",
        version: 1,
        children: [
          { type: "text", text: "Watch this", version: 1 },
          videoNode(YT),
        ],
      },
    ]),
  );
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0]?.kind, "rich_text");
  assert.equal(blocks[1]?.kind, "video");
  assert.deepEqual(blocks[1]?.body, { url: YT });
});

test("video nodes without a URL are dropped", () => {
  const blocks = editorStateToBlocks(
    editorState([videoNode(""), { type: "video", version: 1 }]),
  );
  assert.equal(blocks.length, 0);
});

test("print segments keep nested video URLs", () => {
  const segments = printSegmentsFromBlocks([
    {
      kind: "rich_text",
      body: {
        lexical: editorState([
          {
            type: "paragraph",
            version: 1,
            children: [videoNode(YT)],
          },
        ]),
      },
    },
  ]);
  assert.deepEqual(segments, [{ type: "video", url: YT }]);
});

function quizNode(quiz: {
  prompt: string;
  questionKind?: string;
  choices?: Array<{ id: string; text: string; correct: boolean }>;
  answer?: string;
}) {
  return {
    type: "quiz",
    version: 1,
    prompt: quiz.prompt,
    questionKind: quiz.questionKind ?? "multiple_choice",
    choices: quiz.choices ?? [],
    answer: quiz.answer ?? "",
  };
}

test("root-level quiz nodes stay on the page as rich text, not a new material kind", () => {
  const quiz = quizNode({
    prompt: "What is 2+2?",
    choices: [
      { id: "a", text: "3", correct: false },
      { id: "b", text: "4", correct: true },
    ],
  });
  const blocks = editorStateToBlocks(
    editorState([paragraph("Warm-up"), quiz, paragraph("Done")]),
  );
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.kind, "rich_text");
  const lexical = blocks[0]?.body as { lexical: SerializedEditorState };
  const types = lexical.lexical.root.children.map(
    (child) => (child as { type: string }).type,
  );
  assert.deepEqual(types, ["paragraph", "quiz", "paragraph"]);
});

test("quiz nested in a paragraph is hoisted to a top-level quiz node", () => {
  const parts = splitLexicalNodes([
    {
      type: "paragraph",
      children: [
        quizNode({
          prompt: "Capital of France?",
          questionKind: "short_answer",
          answer: "Paris",
        }),
      ],
    },
  ]);
  assert.equal(parts.length, 1);
  assert.equal(parts[0]?.kind, "node");
  if (parts[0]?.kind === "node") {
    assert.equal(parts[0].node.type, "quiz");
    assert.equal(parts[0].node.prompt, "Capital of France?");
  }
});

test("print segments include several quiz nodes on one page", () => {
  const segments = printSegmentsFromBlocks([
    {
      kind: "rich_text",
      body: {
        lexical: editorState([
          quizNode({
            prompt: "Pick one",
            choices: [
              { id: "1", text: "Yes", correct: true },
              { id: "2", text: "No", correct: false },
            ],
          }),
          paragraph("Between"),
          quizNode({
            prompt: "Fill in",
            questionKind: "short_answer",
            answer: "42",
          }),
        ]),
      },
    },
  ]);
  assert.equal(segments.filter((segment) => segment.type === "quiz").length, 2);
  assert.deepEqual(
    segments.map((segment) => segment.type),
    ["quiz", "paragraph", "quiz"],
  );
  const first = segments[0];
  assert.equal(first?.type, "quiz");
  if (first?.type === "quiz") {
    assert.equal(first.quiz.prompt, "Pick one");
    assert.equal(first.quiz.choices[0]?.correct, true);
  }
});

test("dedicated quiz blocks still print when kind is quiz", () => {
  const segments = printSegmentsFromBlocks([
    {
      kind: "quiz",
      body: {
        prompt: "Stored as a quiz block",
        questionKind: "short_answer",
        choices: [],
        answer: "Yes",
      },
    },
  ]);
  assert.equal(segments.length, 1);
  assert.equal(segments[0]?.type, "quiz");
  if (segments[0]?.type === "quiz") {
    assert.equal(segments[0].quiz.answer, "Yes");
  }
});

test("splitLexicalNodes hoists file nodes out of paragraphs", () => {
  const parts = splitLexicalNodes([
    {
      type: "paragraph",
      children: [
        {
          type: "file",
          fileId: 9,
          filename: "clip.mp4",
          mimeType: "video/mp4",
        },
      ],
    },
  ]);
  assert.equal(parts.length, 1);
  assert.equal(parts[0]?.kind, "node");
  if (parts[0]?.kind === "node") {
    assert.equal(parts[0].node.type, "file");
    assert.equal(parts[0].node.fileId, 9);
  }
});
