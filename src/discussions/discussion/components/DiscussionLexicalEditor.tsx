import { useEffect, useRef, type ReactNode } from "react";
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
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  type EditorState,
  type SerializedEditorState,
} from "lexical";
import { looksLikeHttpUrl } from "@/materials/model/blocks";
import { FloatingFormatToolbar } from "@/materials/material/components/page-editor/FloatingFormatToolbar";
import { KeyboardShortcutsPlugin } from "@/materials/material/components/page-editor/KeyboardShortcutsPlugin";
import { PageEditorActionsProvider } from "@/materials/material/components/page-editor/PageEditorActions";
import { PageEditorToolbar } from "@/materials/material/components/page-editor/PageEditorToolbar";
import { DISCUSSION_EDITOR_TEXT_DEFAULTS } from "@/materials/material/components/page-editor/textFormatting";
import { SlashCommandPlugin } from "@/materials/material/components/page-editor/SlashCommandPlugin";
import {
  DISCUSSION_EDITOR_NODES,
  PAGE_AUTOLINK_MATCHERS,
  PAGE_EDITOR_THEME,
  PAGE_MARKDOWN_TRANSFORMERS,
} from "@/materials/material/components/pageEditorConfig";
import { emptyLexicalState } from "@/discussions/model/messageBody";
import type { MentionPerson } from "@/discussions/model/mentions";
import { $nodesFromPlainMentionText, MentionNode } from "./MentionNode";
import { MentionTypeaheadPlugin } from "./MentionTypeaheadPlugin";

function SeedPlainTextPlugin({
  text,
  people,
  onSeeded,
}: {
  text: string;
  people: MentionPerson[];
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
        const nodes = $nodesFromPlainMentionText(text, people);
        if (nodes.length === 0) {
          paragraph.append($createTextNode(text));
        } else {
          paragraph.append(...nodes);
        }
        root.append(paragraph);
      },
      {
        onUpdate: () => {
          onSeeded(editor.getEditorState().toJSON());
        },
      },
    );
  }, [editor, text, people, onSeeded]);
  return null;
}

function SubmitShortcutPlugin({
  onSubmit,
  enterToSubmit,
}: {
  onSubmit: () => boolean;
  enterToSubmit: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!event || event.shiftKey || event.isComposing) {
          return false;
        }
        if (enterToSubmit) {
          if (!onSubmitRef.current()) return false;
          event.preventDefault();
          return true;
        }
        if (!(event.metaKey || event.ctrlKey)) return false;
        if (!onSubmitRef.current()) return false;
        event.preventDefault();
        return true;
      },
      // Mention picker is HIGH so Enter can pick a person. Submit is NORMAL so
      // it still wins over rich-text's EDITOR "new paragraph" once the picker closes.
      enterToSubmit ? COMMAND_PRIORITY_NORMAL : COMMAND_PRIORITY_HIGH,
    );
  }, [editor, enterToSubmit]);

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
  mentionPeople = [],
  mentionExcludeUserId,
  mentionsLoading = false,
  chrome = "full",
  endSlot,
}: {
  editorKey: string;
  initialLexical?: SerializedEditorState | null;
  seedPlainText?: string;
  editable: boolean;
  /** Sit inside the composer card (border like the plain textarea). */
  embedded?: boolean;
  placeholder: string;
  onChange?: (state: SerializedEditorState) => void;
  onSubmit?: () => boolean;
  mentionPeople?: MentionPerson[];
  mentionExcludeUserId?: string;
  mentionsLoading?: boolean;
  /** `simple` is the default composer: no toolbar, Enter posts, @mentions become pills. */
  chrome?: "simple" | "full";
  /** Actions rendered inside the field, right of the text (T, attach, Post). */
  endSlot?: ReactNode;
}) {
  const hasInitial = initialLexical != null;
  const initial = hasInitial ? initialLexical : emptyLexicalState();
  const simple = chrome === "simple";

  const shellClass = !editable
    ? "cw-editor-view"
    : [
        "cw-editor-shell",
        embedded ? "cw-editor-shell-embedded" : "",
        simple ? "cw-editor-shell-simple" : "",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <LexicalComposer
      key={editorKey}
      initialConfig={{
        namespace: "coursewright-discussion",
        nodes: [...DISCUSSION_EDITOR_NODES, MentionNode],
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
          <PageEditorActionsProvider>
            {simple ? null : (
              <PageEditorToolbar textDefaults={DISCUSSION_EDITOR_TEXT_DEFAULTS} />
            )}
            <div className={endSlot ? "flex items-end gap-0.5" : "relative"}>
              <div className={endSlot ? "relative min-w-0 flex-1" : undefined}>
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
                {simple ? null : <FloatingFormatToolbar />}
              </div>
              {endSlot ? (
                <div className="flex shrink-0 items-center gap-0.5 self-end p-1.5">
                  {endSlot}
                </div>
              ) : null}
            </div>
            {simple ? null : <SlashCommandPlugin />}
            <MentionTypeaheadPlugin
              people={mentionPeople}
              excludeUserId={mentionExcludeUserId}
              loading={mentionsLoading}
            />
            {simple ? null : <KeyboardShortcutsPlugin />}
            {onSubmit ? (
              <SubmitShortcutPlugin
                onSubmit={onSubmit}
                enterToSubmit={simple}
              />
            ) : null}
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
              <SeedPlainTextPlugin
                text={seedPlainText}
                people={mentionPeople}
                onSeeded={onChange}
              />
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
