import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import type { EditorState, LexicalEditor } from "lexical";
import type { BlockRecord } from "@/materials/databridge/blocks";
import { looksLikeHttpUrl } from "@/materials/model/blocks";
import { PageEditorToolbar } from "./PageEditorToolbar";
import {
  PAGE_EDITOR_NODES,
  PAGE_EDITOR_THEME,
  PAGE_MARKDOWN_TRANSFORMERS,
  loadBlocksIntoEditor,
} from "./pageEditorConfig";

export function PageContentEditor({
  blocks,
  editorKey,
  editable,
  onDraftChange,
}: {
  blocks: BlockRecord[];
  editorKey: string;
  editable: boolean;
  onDraftChange?: (json: string) => void;
}) {
  return (
    <LexicalComposer
      key={editorKey}
      initialConfig={{
        namespace: "coursewright-page",
        nodes: PAGE_EDITOR_NODES,
        theme: PAGE_EDITOR_THEME,
        editable,
        onError(error) {
          throw error;
        },
        editorState(editor: LexicalEditor) {
          loadBlocksIntoEditor(editor, blocks);
        },
      }}
    >
      <div className={editable ? "cw-editor-shell" : "cw-editor-view"}>
        {editable ? <PageEditorToolbar /> : null}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={
                  editable ? "cw-editor-input" : "cw-editor-input cw-editor-input-view"
                }
                aria-placeholder={
                  editable ? "Write this lesson…" : "This page doesn’t have any content yet."
                }
                placeholder={
                  <p className="cw-editor-placeholder">
                    {editable
                      ? "Write this lesson…"
                      : "This page doesn’t have any content yet."}
                  </p>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin
          validateUrl={looksLikeHttpUrl}
          attributes={{ target: "_blank", rel: "noreferrer" }}
        />
        <ClickableLinkPlugin disabled={editable} />
        {editable ? (
          <MarkdownShortcutPlugin transformers={PAGE_MARKDOWN_TRANSFORMERS} />
        ) : null}
        {editable && onDraftChange ? (
          <OnChangePlugin
            ignoreSelectionChange
            onChange={(editorState: EditorState) => {
              onDraftChange(JSON.stringify(editorState.toJSON()));
            }}
          />
        ) : null}
      </div>
    </LexicalComposer>
  );
}
