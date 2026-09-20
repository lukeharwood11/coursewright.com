import { useEffect, useRef } from "react";
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  type EditorState,
  type SerializedEditorState,
} from "lexical";
import { looksLikeHttpUrl } from "@/materials/model/blocks";
import { FloatingFormatToolbar } from "@/materials/material/components/page-editor/FloatingFormatToolbar";
import { KeyboardShortcutsPlugin } from "@/materials/material/components/page-editor/KeyboardShortcutsPlugin";
import { PageEditorActionsProvider } from "@/materials/material/components/page-editor/PageEditorActions";
import { PageEditorToolbar } from "@/materials/material/components/page-editor/PageEditorToolbar";
import { SlashCommandPlugin } from "@/materials/material/components/page-editor/SlashCommandPlugin";
import {
  DISCUSSION_EDITOR_NODES,
  PAGE_AUTOLINK_MATCHERS,
  PAGE_EDITOR_THEME,
  PAGE_MARKDOWN_TRANSFORMERS,
} from "@/materials/material/components/pageEditorConfig";
import { emptyLexicalState } from "@/discussions/model/messageBody";

const DISCUSSION_EDITOR_FEATURES = { quiz: false } as const;

function SeedPlainTextPlugin({
  text,
  onSeeded,
}: {
  text: string;
  onSeeded: (state: SerializedEditorState) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !text) return;
    done.current = true;
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        root.append(paragraph);
      },
      {
        onUpdate: () => {
          onSeeded(editor.getEditorState().toJSON());
        },
      },
    );
  }, [editor, text, onSeeded]);
  return null;
}

function SubmitShortcutPlugin({ onSubmit }: { onSubmit: () => void }) {
  const [editor] = useLexicalComposerContext();
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!event || !(event.metaKey || event.ctrlKey)) return false;
        event.preventDefault();
        onSubmitRef.current();
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}

export function DiscussionLexicalEditor({
  editorKey,
  initialLexical,
  seedPlainText,
  editable,
  embedded = false,
  placeholder,
  onChange,
  onSubmit,
}: {
  editorKey: string;
  initialLexical?: SerializedEditorState | null;
  seedPlainText?: string;
  editable: boolean;
  /** Sit inside the composer card (border like the plain textarea). */
  embedded?: boolean;
  placeholder: string;
  onChange?: (state: SerializedEditorState) => void;
  onSubmit?: () => void;
}) {
  const hasInitial = initialLexical != null;
  const initial = hasInitial ? initialLexical : emptyLexicalState();

  const shellClass = !editable
    ? "cw-editor-view"
    : embedded
      ? "cw-editor-shell cw-editor-shell-embedded"
      : "cw-editor-shell";

  return (
    <LexicalComposer
      key={editorKey}
      initialConfig={{
        namespace: "coursewright-discussion",
        nodes: DISCUSSION_EDITOR_NODES,
        theme: PAGE_EDITOR_THEME,
        editable,
        onError(error) {
          throw error;
        },
        editorState: hasInitial ? JSON.stringify(initial) : undefined,
      }}
    >
      <div className={shellClass}>
        {editable ? (
          <PageEditorActionsProvider features={DISCUSSION_EDITOR_FEATURES}>
            <PageEditorToolbar />
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="cw-editor-input cw-editor-input-discussion"
                    aria-placeholder={placeholder}
                    placeholder={
                      <p className="cw-editor-placeholder">{placeholder}</p>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <FloatingFormatToolbar />
            </div>
            <SlashCommandPlugin />
            <KeyboardShortcutsPlugin />
            {onSubmit ? <SubmitShortcutPlugin onSubmit={onSubmit} /> : null}
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
            {seedPlainText && onChange ? (
              <SeedPlainTextPlugin text={seedPlainText} onSeeded={onChange} />
            ) : null}
            {onChange ? (
              <OnChangePlugin
                ignoreSelectionChange
                onChange={(editorState: EditorState) => {
                  onChange(editorState.toJSON());
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
                    aria-placeholder={placeholder}
                    placeholder={
                      <p className="cw-editor-placeholder">{placeholder}</p>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
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
  );
}
