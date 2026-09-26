import assert from "node:assert/strict";
import { test } from "node:test";
import {
  editorStateToBlocks,
} from "./pageContent";
import {
  pageEditorSettingsFromBlocks,
  parsePageEditorSettings,
} from "./pageEditorSettings";
import type { SerializedEditorState } from "lexical";

test("parsePageEditorSettings reads stored toolbar values", () => {
  assert.deepEqual(
    parsePageEditorSettings({
      fontFamily: "Lora, Georgia, serif",
      fontSize: "18px",
      lineHeight: "1.5",
      textAlign: "center",
    }),
    {
      fontFamily: "Lora, Georgia, serif",
      fontSize: "18px",
      lineHeight: "1.5",
      textAlign: "center",
    },
  );
});

test("pageEditorSettingsFromBlocks reads the first rich_text block", () => {
  const settings = pageEditorSettingsFromBlocks([
    {
      kind: "rich_text",
      body: {
        lexical: { root: { type: "root", children: [] } },
        editorSettings: {
          fontFamily: "",
          fontSize: "20px",
          lineHeight: "",
          textAlign: "right",
        },
      },
    },
  ]);
  assert.equal(settings.fontSize, "20px");
  assert.equal(settings.textAlign, "right");
});

test("editorStateToBlocks stores settings on the first rich_text block", () => {
  const state = {
    root: {
      type: "root",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      children: [
        {
          type: "paragraph",
          version: 1,
          children: [{ type: "text", text: "Hi", version: 1 }],
        },
      ],
    },
  } as SerializedEditorState;
  const blocks = editorStateToBlocks(state, {
    fontFamily: "Lora, Georgia, serif",
    fontSize: "",
    lineHeight: "",
    textAlign: "left",
  });
  assert.equal(blocks.length, 1);
  const body = blocks[0]?.body as { editorSettings?: { fontFamily: string } };
  assert.equal(body.editorSettings?.fontFamily, "Lora, Georgia, serif");
});
