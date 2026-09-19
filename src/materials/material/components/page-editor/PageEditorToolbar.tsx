import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type TextFormatType,
} from "lexical";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $isListNode } from "@lexical/list";
import { $isLinkNode } from "@lexical/link";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableSelection,
} from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  LinkIcon,
  MinusCircleIcon,
  MinusIcon,
  PaperClipIcon,
  PlusCircleIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  TableCellsIcon,
  TrashIcon,
  VideoCameraIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import type { PageBlockType } from "@/materials/model/pageEditor";
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_TYPES } from "./blockTypes";
import { usePageEditorActions } from "./PageEditorActions";
import {
  DropdownItem,
  FormatMark,
  ToolbarDivider,
  ToolbarDropdown,
  ToolbarIconButton,
} from "./toolbarUi";

const IS_APPLE =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

function modKey(shortcut: string): string {
  return IS_APPLE ? `⌘${shortcut}` : `Ctrl+${shortcut}`;
}

export function PageEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const actions = usePageEditorActions();
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState<PageBlockType>("paragraph");
  const [isLink, setIsLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [inTable, setInTable] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
    const list = $findMatchingParent(anchor, $isListNode);
    const element =
      anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
    if (list) {
      setBlockType(list.getListType() === "number" ? "ol" : "ul");
    } else if ($isHeadingNode(element)) {
      const tag = element.getTag();
      setBlockType(tag === "h1" || tag === "h3" ? tag : "h2");
    } else if ($isQuoteNode(element)) {
      setBlockType("quote");
    } else {
      setBlockType("paragraph");
    }
    const parent = anchor.getParent();
    const linkNode = $isLinkNode(anchor)
      ? anchor
      : $isLinkNode(parent)
        ? parent
        : null;
    setIsLink(linkNode != null);
    setLinkUrl(linkNode?.getURL() ?? "");
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
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
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

  const BlockIcon = BLOCK_ICONS[blockType];

  return (
    <div className="cw-editor-toolbar">
      <ToolbarIconButton
        disabled={!canUndo}
        label={`Undo (${modKey("Z")})`}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <ArrowUturnLeftIcon className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        disabled={!canRedo}
        label={`Redo (${IS_APPLE ? "⇧⌘Z" : "Ctrl+Y"})`}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <ArrowUturnRightIcon className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarDivider />
      <ToolbarDropdown label={`Turn into: ${BLOCK_LABELS[blockType]}`} icon={<BlockIcon className="h-4 w-4" />}>
        {BLOCK_TYPES.map((type) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <DropdownItem
              key={type}
              icon={<Icon className="h-4 w-4" />}
              label={BLOCK_LABELS[type]}
              active={blockType === type}
              onClick={() => actions.setBlock(type)}
            />
          );
        })}
      </ToolbarDropdown>
      <ToolbarDivider />
      <ToolbarIconButton
        pressed={bold}
        label={`Bold (${modKey("B")})`}
        onClick={() => format("bold")}
      >
        <FormatMark letter="B" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={italic}
        label={`Italic (${modKey("I")})`}
        onClick={() => format("italic")}
      >
        <FormatMark letter="I" style="italic" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={underline}
        label={`Underline (${modKey("U")})`}
        onClick={() => format("underline")}
      >
        <FormatMark letter="U" style="underline" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={strikethrough}
        label={`Strikethrough (${IS_APPLE ? "⇧⌘S" : "Ctrl+Shift+S"})`}
        onClick={() => format("strikethrough")}
      >
        <FormatMark letter="S" style="strike" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={isLink}
        label={`Link (${modKey("K")})`}
        onClick={() => actions.openLinkDialog(linkUrl)}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarDivider />
      <ToolbarDropdown label="Insert" icon={<PlusIcon className="h-4 w-4" />}>
        <DropdownItem
          icon={<TableCellsIcon className="h-4 w-4" />}
          label="Table"
          hint="/table"
          onClick={actions.openTableDialog}
        />
        <DropdownItem
          icon={<LinkIcon className="h-4 w-4" />}
          label="Link"
          hint={modKey("K")}
          onClick={() => actions.openLinkDialog(linkUrl)}
        />
        <DropdownItem
          icon={<VideoCameraIcon className="h-4 w-4" />}
          label="Video"
          onClick={actions.openVideoDialog}
        />
        <DropdownItem
          icon={<QuestionMarkCircleIcon className="h-4 w-4" />}
          label="Quiz"
          onClick={actions.insertQuiz}
        />
        {actions.canAttachFile ? (
          <DropdownItem
            icon={<PaperClipIcon className="h-4 w-4" />}
            label={actions.uploading ? "Uploading…" : "File"}
            hint="MP3/M4A"
            onClick={actions.attachFile}
          />
        ) : null}
        <DropdownItem
          icon={<MinusIcon className="h-4 w-4" />}
          label="Divider"
          hint="---"
          onClick={actions.insertDivider}
        />
      </ToolbarDropdown>
      {inTable ? (
        <ToolbarDropdown label="Table" icon={<TableCellsIcon className="h-4 w-4" />}>
          <DropdownItem
            icon={<PlusCircleIcon className="h-4 w-4" />}
            label="Add row"
            onClick={() => {
              editor.update(() => {
                $insertTableRowAtSelection(true);
              });
            }}
          />
          <DropdownItem
            icon={<ViewColumnsIcon className="h-4 w-4" />}
            label="Add column"
            onClick={() => {
              editor.update(() => {
                $insertTableColumnAtSelection(true);
              });
            }}
          />
          <DropdownItem
            icon={<MinusCircleIcon className="h-4 w-4" />}
            label="Delete row"
            onClick={() => {
              editor.update(() => {
                $deleteTableRowAtSelection();
              });
            }}
          />
          <DropdownItem
            icon={<MinusCircleIcon className="h-4 w-4" />}
            label="Delete column"
            onClick={() => {
              editor.update(() => {
                $deleteTableColumnAtSelection();
              });
            }}
          />
          <DropdownItem
            icon={<TrashIcon className="h-4 w-4" />}
            label="Delete table"
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                  return;
                }
                const node = $isRangeSelection(selection)
                  ? selection.anchor.getNode()
                  : selection.getNodes()[0];
                if (!node) return;
                const cell = $getTableCellNodeFromLexicalNode(node);
                if (!cell) return;
                $getTableNodeFromLexicalNodeOrThrow(cell).remove();
              });
            }}
          />
        </ToolbarDropdown>
      ) : null}
      {actions.uploadError ? (
        <p className="w-full px-1 text-[13px] text-[var(--amber-deep)]">
          {actions.uploadError}
        </p>
      ) : null}
    </div>
  );
}
