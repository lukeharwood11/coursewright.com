import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $isTableSelection,
  INSERT_TABLE_COMMAND,
} from "@lexical/table";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { uploadNewFile } from "@/materials/databridge/files";
import { looksLikeHttpUrl } from "@/materials/model/blocks";
import { $createFileNode } from "./FileNode";
import { usePageEditorMedia } from "./PageEditorMediaContext";
import { $createVideoNode } from "./VideoNode";

type PromptKind = "link" | "video" | null;

export function PageEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const media = usePageEditorMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [heading, setHeading] = useState<"h2" | "h3" | "paragraph">("paragraph");
  const [quote, setQuote] = useState(false);
  const [list, setList] = useState<"ul" | "ol" | null>(null);
  const [isLink, setIsLink] = useState(false);
  const [inTable, setInTable] = useState(false);
  const [promptKind, setPromptKind] = useState<PromptKind>(null);
  const [promptValue, setPromptValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const syncToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isTableSelection(selection)) {
      setInTable(true);
      return;
    }
    if (!$isRangeSelection(selection)) return;
    setBold(selection.hasFormat("bold"));
    setItalic(selection.hasFormat("italic"));
    setUnderline(selection.hasFormat("underline"));
    setStrikethrough(selection.hasFormat("strikethrough"));
    const anchor = selection.anchor.getNode();
    const element =
      anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
    if ($isHeadingNode(element)) {
      const tag = element.getTag();
      setHeading(tag === "h3" ? "h3" : "h2");
    } else {
      setHeading("paragraph");
    }
    setQuote($isQuoteNode(element));
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
    setInTable($getTableCellNodeFromLexicalNode(anchor) != null);
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

  function setBlock(next: "h2" | "h3" | "paragraph" | "quote") {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (next === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      if (next === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
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

  function insertTable() {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: "3",
      columns: "3",
      includeHeaders: { rows: true, columns: false },
    });
  }

  function removeTable() {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) && !$isTableSelection(selection)) return;
      const node = $isRangeSelection(selection)
        ? selection.anchor.getNode()
        : selection.getNodes()[0];
      if (!node) return;
      const cell = $getTableCellNodeFromLexicalNode(node);
      if (!cell) return;
      $getTableNodeFromLexicalNodeOrThrow(cell).remove();
    });
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

  async function attachFile(file: File) {
    if (!media) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadNewFile({
        organizationId: media.organizationId,
        uploadedBy: media.userId,
        file,
      });
      editor.update(() => {
        const node = $createFileNode({
          fileId: uploaded.id,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
        });
        $insertNodeToNearestRoot(node);
        const paragraph = $createParagraphNode();
        node.insertAfter(paragraph);
        paragraph.selectEnd();
      });
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : "Couldn’t attach that file.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        pressed={strikethrough}
        onClick={() => format("strikethrough")}
      >
        Strike
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
      <ToolbarButton
        pressed={quote}
        onClick={() => setBlock(quote ? "paragraph" : "quote")}
      >
        Quote
      </ToolbarButton>
      <ToolbarButton pressed={list === "ul"} onClick={() => toggleList("ul")}>
        List
      </ToolbarButton>
      <ToolbarButton pressed={list === "ol"} onClick={() => toggleList("ol")}>
        Numbered
      </ToolbarButton>
      <ToolbarButton pressed={false} onClick={insertTable}>
        Table
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
      {media ? (
        <>
          <ToolbarButton
            pressed={false}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "File"}
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) void attachFile(next);
            }}
          />
        </>
      ) : null}
      <ToolbarButton
        pressed={false}
        onClick={() => {
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        }}
      >
        Line
      </ToolbarButton>
      {inTable ? (
        <>
          <ToolbarButton
            pressed={false}
            onClick={() => {
              editor.update(() => {
                $insertTableRowAtSelection(true);
              });
            }}
          >
            Add row
          </ToolbarButton>
          <ToolbarButton
            pressed={false}
            onClick={() => {
              editor.update(() => {
                $insertTableColumnAtSelection(true);
              });
            }}
          >
            Add column
          </ToolbarButton>
          <ToolbarButton
            pressed={false}
            onClick={() => {
              editor.update(() => {
                $deleteTableRowAtSelection();
              });
            }}
          >
            Delete row
          </ToolbarButton>
          <ToolbarButton
            pressed={false}
            onClick={() => {
              editor.update(() => {
                $deleteTableColumnAtSelection();
              });
            }}
          >
            Delete column
          </ToolbarButton>
          <ToolbarButton pressed={false} onClick={removeTable}>
            Remove table
          </ToolbarButton>
        </>
      ) : null}
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
      {uploadError ? (
        <p className="mt-2 w-full text-[13px] text-[var(--amber-deep)]">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  pressed,
  onClick,
  disabled,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-[6px] border px-2.5 py-1.5 text-[12.5px] font-bold",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
        "disabled:pointer-events-none disabled:opacity-60",
        pressed
          ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
