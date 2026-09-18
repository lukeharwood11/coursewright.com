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
