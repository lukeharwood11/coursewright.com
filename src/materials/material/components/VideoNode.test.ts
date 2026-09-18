import assert from "node:assert/strict";
import { test } from "node:test";
import { $getRoot, createEditor } from "lexical";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import { $createVideoNode, VideoNode } from "./VideoNode";

const YT = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

test("VideoNode exportJSON keeps the URL and save splits it into a video block", () => {
  const editor = createEditor({
    namespace: "coursewright-page",
    nodes: [VideoNode],
    onError(error) {
      throw error;
    },
  });
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      root.append($createVideoNode(YT));
    },
    { discrete: true },
  );

  const json = editor.getEditorState().toJSON();
  const child = json.root.children[0] as { type?: string; url?: string };
  assert.equal(child?.type, "video");
  assert.equal(child?.url, YT);

  const blocks = editorStateToBlocks(json);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.kind, "video");
  assert.deepEqual(blocks[0]?.body, { url: YT });

  const reloaded = createEditor({
    namespace: "coursewright-page",
    nodes: [VideoNode],
    onError(error) {
      throw error;
    },
  });
  reloaded.setEditorState(reloaded.parseEditorState(json));
  const again = reloaded.getEditorState().toJSON();
  const reloadedChild = again.root.children[0] as { type?: string; url?: string };
  assert.equal(reloadedChild?.type, "video");
  assert.equal(reloadedChild?.url, YT);
});
