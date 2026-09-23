import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import type { EditorState, LexicalEditor } from "lexical";
import type { BlockRecord } from "@/materials/databridge/blocks";
import { looksLikeHttpUrl } from "@/materials/model/blocks";
import { PageQuizViewProvider } from "./PageQuizViewContext";
import { FloatingFormatToolbar } from "./page-editor/FloatingFormatToolbar";
import { FileUploadStatus } from "./page-editor/FileUploadStatus";
import { KeyboardShortcutsPlugin } from "./page-editor/KeyboardShortcutsPlugin";
import { PageEditorActionsProvider } from "./page-editor/PageEditorActions";
import { PageEditorToolbar } from "./page-editor/PageEditorToolbar";
import { PasteImagesPlugin } from "./page-editor/PasteImagesPlugin";
import { SlashCommandPlugin } from "./page-editor/SlashCommandPlugin";
import {
  PAGE_AUTOLINK_MATCHERS,
  PAGE_EDITOR_NODES,
  PAGE_EDITOR_THEME,
  PAGE_MARKDOWN_TRANSFORMERS,
  loadBlocksIntoEditor,
} from "./pageEditorConfig";

export function PageContentEditor({
  blocks,
  editorKey,
  editable,
  showAnswers = editable,
  onDraftChange,
}: {
  blocks: BlockRecord[];
  editorKey: string;
  editable: boolean;
  showAnswers?: boolean;
  onDraftChange?: (json: string) => void;
}) {
  return (
    <PageQuizViewProvider value={showAnswers}>
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
        {editable ? (
          <PageEditorActionsProvider>
            <PageEditorToolbar />
            <FileUploadStatus />
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="cw-editor-input"
                    aria-placeholder="Type / for blocks"
                    placeholder={
                      <p className="cw-editor-placeholder">
                        Type / for blocks
                      </p>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <FloatingFormatToolbar />
            </div>
            <SlashCommandPlugin />
            <PasteImagesPlugin />
            <KeyboardShortcutsPlugin />
            <HistoryPlugin />
            <ListPlugin />
            <TablePlugin hasCellMerge={false} hasHorizontalScroll />
            <HorizontalRulePlugin />
            <TabIndentationPlugin maxIndent={5} />
            <LinkPlugin
              validateUrl={looksLikeHttpUrl}
              attributes={{ target: "_blank", rel: "noreferrer" }}
            />
            <AutoLinkPlugin matchers={PAGE_AUTOLINK_MATCHERS} />
            <ClickableLinkPlugin disabled />
            <MarkdownShortcutPlugin transformers={PAGE_MARKDOWN_TRANSFORMERS} />
            {onDraftChange ? (
              <OnChangePlugin
                ignoreSelectionChange
                onChange={(editorState: EditorState) => {
                  onDraftChange(JSON.stringify(editorState.toJSON()));
                }}
              />
            ) : null}
          </PageEditorActionsProvider>
        ) : (
          <>
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="cw-editor-input cw-editor-input-view"
                    aria-placeholder="This page doesn’t have any content yet."
                    placeholder={
                      <p className="cw-editor-placeholder">
                        This page doesn’t have any content yet.
                      </p>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <TablePlugin hasCellMerge={false} hasHorizontalScroll />
            <HorizontalRulePlugin />
            <LinkPlugin
              validateUrl={looksLikeHttpUrl}
              attributes={{ target: "_blank", rel: "noreferrer" }}
            />
            <AutoLinkPlugin matchers={PAGE_AUTOLINK_MATCHERS} />
            <ClickableLinkPlugin />
          </>
        )}
      </div>
      </LexicalComposer>
    </PageQuizViewProvider>
  );
}
