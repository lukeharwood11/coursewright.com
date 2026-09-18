import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type TextFormatType,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { looksLikeHttpUrl } from "@/materials/model/blocks";
import { $createVideoNode } from "./VideoNode";

type PromptKind = "link" | "video" | null;

export function PageEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [heading, setHeading] = useState<"h2" | "h3" | "paragraph">("paragraph");
  const [list, setList] = useState<"ul" | "ol" | null>(null);
  const [isLink, setIsLink] = useState(false);
  const [promptKind, setPromptKind] = useState<PromptKind>(null);
  const [promptValue, setPromptValue] = useState("");

  const syncToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    setBold(selection.hasFormat("bold"));
    setItalic(selection.hasFormat("italic"));
    setUnderline(selection.hasFormat("underline"));
    const anchor = selection.anchor.getNode();
    const element =
      anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
    if ($isHeadingNode(element)) {
      const tag = element.getTag();
      setHeading(tag === "h3" ? "h3" : "h2");
    } else {
      setHeading("paragraph");
    }
    const parentList = element.getParent();
    if ($isListNode(element)) {
      setList(element.getListType() === "number" ? "ol" : "ul");
    } else if ($isListNode(parentList)) {
      setList(parentList.getListType() === "number" ? "ol" : "ul");
    } else {
      setList(null);
    }
    const node = anchor.getParent();
    setIsLink($isLinkNode(node) || $isLinkNode(anchor));
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          syncToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          syncToolbar();
        });
      }),
    );
  }, [editor, syncToolbar]);

  function format(type: TextFormatType) {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  }

  function setBlock(next: "h2" | "h3" | "paragraph") {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (next === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      $setBlocksType(selection, () => $createHeadingNode(next));
    });
  }

  function toggleList(type: "ul" | "ol") {
    if (list === type) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      return;
    }
    editor.dispatchCommand(
      type === "ol" ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
      undefined,
    );
  }

  function applyPrompt() {
    const value = promptValue.trim();
    if (promptKind === "link") {
      if (!value) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      } else if (looksLikeHttpUrl(value)) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, value);
      }
    }
    if (promptKind === "video" && looksLikeHttpUrl(value)) {
      editor.update(() => {
        const video = $createVideoNode(value);
        $insertNodeToNearestRoot(video);
        const paragraph = $createParagraphNode();
        video.insertAfter(paragraph);
        paragraph.selectEnd();
      });
    }
    setPromptKind(null);
    setPromptValue("");
  }

  return (
    <div className="cw-editor-toolbar">
      <ToolbarButton pressed={bold} onClick={() => format("bold")}>
        Bold
      </ToolbarButton>
      <ToolbarButton pressed={italic} onClick={() => format("italic")}>
        Italic
      </ToolbarButton>
      <ToolbarButton pressed={underline} onClick={() => format("underline")}>
        Underline
      </ToolbarButton>
      <ToolbarButton
        pressed={heading === "h2"}
        onClick={() => setBlock(heading === "h2" ? "paragraph" : "h2")}
      >
        Heading
      </ToolbarButton>
      <ToolbarButton
        pressed={heading === "h3"}
        onClick={() => setBlock(heading === "h3" ? "paragraph" : "h3")}
      >
        Subheading
      </ToolbarButton>
      <ToolbarButton pressed={list === "ul"} onClick={() => toggleList("ul")}>
        List
      </ToolbarButton>
      <ToolbarButton pressed={list === "ol"} onClick={() => toggleList("ol")}>
        Numbered
      </ToolbarButton>
      <ToolbarButton
        pressed={isLink}
        onClick={() => {
          setPromptKind("link");
          setPromptValue("");
        }}
      >
        Link
      </ToolbarButton>
      <ToolbarButton
        pressed={false}
        onClick={() => {
          setPromptKind("video");
          setPromptValue("");
        }}
      >
        Video
      </ToolbarButton>
      {promptKind ? (
        <div className="mt-2 flex w-full flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1">
            <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
              {promptKind === "video" ? "Video address" : "Link address"}
            </span>
            <Input
              className="mt-1 w-full"
              value={promptValue}
              placeholder="https://"
              onChange={(event) => setPromptValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPrompt();
                }
                if (event.key === "Escape") {
                  setPromptKind(null);
                }
              }}
              autoFocus
            />
          </label>
          <Button type="button" onClick={applyPrompt}>
            Add
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPromptKind(null)}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={[
        "rounded-[6px] border px-2.5 py-1.5 text-[12.5px] font-bold",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
        pressed
          ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
