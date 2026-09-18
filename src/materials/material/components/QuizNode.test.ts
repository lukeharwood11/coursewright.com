import assert from "node:assert/strict";
import { test } from "node:test";
import { $getRoot, createEditor } from "lexical";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import { parseQuizBody } from "@/materials/model/quiz";
import { $createQuizNode, QuizNode } from "./QuizNode";
import { VideoNode } from "./VideoNode";

const quiz = {
  prompt: "Which planet is closest to the sun?",
  questionKind: "multiple_choice" as const,
  choices: [
    { id: "a", text: "Mercury", correct: true },
    { id: "b", text: "Earth", correct: false },
  ],
  answer: "",
};

test("QuizNode exportJSON keeps prompt, choices, and correct flags", () => {
  const editor = createEditor({
    namespace: "coursewright-page",
    nodes: [QuizNode, VideoNode],
    onError(error) {
      throw error;
    },
  });
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      root.append($createQuizNode(quiz));
    },
    { discrete: true },
  );

  const json = editor.getEditorState().toJSON();
  const child = json.root.children[0];
  const body = parseQuizBody(child);
  assert.equal(body.prompt, quiz.prompt);
  assert.equal(body.questionKind, "multiple_choice");
  assert.equal(body.choices[0]?.text, "Mercury");
  assert.equal(body.choices[0]?.correct, true);
  assert.equal(body.choices[1]?.correct, false);

  const blocks = editorStateToBlocks(json);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.kind, "rich_text");

  const reloaded = createEditor({
    namespace: "coursewright-page",
    nodes: [QuizNode, VideoNode],
    onError(error) {
      throw error;
    },
  });
  reloaded.setEditorState(reloaded.parseEditorState(json));
  const again = parseQuizBody(reloaded.getEditorState().toJSON().root.children[0]);
  assert.equal(again.prompt, quiz.prompt);
  assert.equal(again.choices[0]?.correct, true);
});
