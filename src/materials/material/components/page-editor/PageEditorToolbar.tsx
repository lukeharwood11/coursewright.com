import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isElementNode,
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
  ArrowsUpDownIcon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars3Icon,
  ClockIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  MicrophoneIcon,
  MinusCircleIcon,
  MinusIcon,
  PaperClipIcon,
  PlusCircleIcon,
  PlusIcon,
  TableCellsIcon,
  TrashIcon,
  VideoCameraIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import type { ElementFormatType } from "lexical";
import type { PageBlockType } from "@/materials/model/pageEditor";
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_TYPES } from "./blockTypes";
import { usePageEditorActions } from "./PageEditorActions";
import { usePageEditorSettings } from "./PageEditorSettingsContext";
import {
  DropdownItem,
  FormatMark,
  ToolbarDivider,
  ToolbarDropdown,
  ToolbarIconButton,
  ToolbarLabelDropdown,
} from "./toolbarUi";
import {
  applyFontFamilyAndSettings,
  applyFontSizeAndSettings,
  applyLineHeightAndSettings,
  applyTextAlignmentAndSettings,
  fontFamilyMenuLabel,
  fontFamilyOptions,
  fontFamilyPreviewStyle,
  fontSizeMenuLabel,
  fontSizeOptions,
  lineHeightMenuLabel,
  lineHeightOptions,
  PAGE_EDITOR_TEXT_DEFAULTS,
  readBlockAlignment,
  readSelectionFontFamily,
  readSelectionFontSize,
  readSelectionLineHeight,
  TEXT_ALIGNMENT_OPTIONS,
  type EditorTextDefaults,
} from "./textFormatting";

const IS_APPLE =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const ALIGNMENT_ICONS: Record<
  ElementFormatType,
  ComponentType<{ className?: string }>
> = {
  left: Bars3BottomLeftIcon,
  start: Bars3BottomLeftIcon,
  center: Bars3Icon,
  right: Bars3BottomRightIcon,
  end: Bars3BottomRightIcon,
  justify: AlignJustifyIcon,
  "": Bars3BottomLeftIcon,
};

function AlignJustifyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" d="M4 6h16M4 9.5h16M4 13h16M4 16.5h16" />
    </svg>
  );
}

function modKey(shortcut: string): string {
  return IS_APPLE ? `⌘${shortcut}` : `Ctrl+${shortcut}`;
}

export function PageEditorToolbar({
  onVersionHistory,
  versionHistoryDisabled = false,
  textDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
}: {
  onVersionHistory?: () => void;
  versionHistoryDisabled?: boolean;
  textDefaults?: EditorTextDefaults;
} = {}) {
  const [editor] = useLexicalComposerContext();
  const actions = usePageEditorActions();
  const { settings: savedSettings, patchSettings } = usePageEditorSettings();
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState<PageBlockType>("paragraph");
  const [textAlign, setTextAlign] = useState<ElementFormatType>("left");
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState("");
  const [lineHeight, setLineHeight] = useState("");
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
    const blockFormat = $isElementNode(element) ? element.getFormatType() : "";
    if (blockFormat && blockFormat !== "start") {
      setTextAlign(readBlockAlignment());
    } else {
      setTextAlign(savedSettings.textAlign || "left");
    }
    const family = readSelectionFontFamily(textDefaults);
    const size = readSelectionFontSize(textDefaults);
    const height = readSelectionLineHeight(textDefaults);
    setFontFamily(family !== "" ? family : savedSettings.fontFamily);
    setFontSize(size !== "" ? size : savedSettings.fontSize);
    setLineHeight(height !== "" ? height : savedSettings.lineHeight);
    const parent = anchor.getParent();
    const linkNode = $isLinkNode(anchor)
      ? anchor
      : $isLinkNode(parent)
        ? parent
        : null;
    setIsLink(linkNode != null);
    setLinkUrl(linkNode?.getURL() ?? "");
    setInTable($getTableCellNodeFromLexicalNode(anchor) != null);
  }, [textDefaults, savedSettings]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        syncToolbar();
        return;
      }
      setFontFamily(savedSettings.fontFamily);
      setFontSize(savedSettings.fontSize);
      setLineHeight(savedSettings.lineHeight);
      setTextAlign(savedSettings.textAlign || "left");
    });
  }, [editor, savedSettings, syncToolbar]);

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
  const AlignIcon = ALIGNMENT_ICONS[textAlign] ?? Bars3BottomLeftIcon;
  const alignmentLabel =
    TEXT_ALIGNMENT_OPTIONS.find((item) => item.value === textAlign)?.label ??
    "Align text";

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
      <ToolbarDropdown label={alignmentLabel} icon={<AlignIcon className="h-4 w-4" />}>
        {TEXT_ALIGNMENT_OPTIONS.map((item) => {
          const Icon = ALIGNMENT_ICONS[item.value] ?? Bars3BottomLeftIcon;
          return (
            <DropdownItem
              key={item.value}
              icon={<Icon className="h-4 w-4" />}
              label={item.label}
              active={textAlign === item.value}
              onClick={() =>
                applyTextAlignmentAndSettings(editor, item.value, patchSettings)
              }
            />
          );
        })}
      </ToolbarDropdown>
      <ToolbarLabelDropdown
        label={`Font: ${fontFamilyMenuLabel(fontFamily, textDefaults)}`}
        display={fontFamilyMenuLabel(fontFamily, textDefaults)}
        displayStyle={fontFamilyPreviewStyle(fontFamily)}
      >
        {fontFamilyOptions(textDefaults).map((item) => (
          <DropdownItem
            key={item.label}
            icon={<FormatMark letter="A" />}
            label={item.label}
            labelStyle={fontFamilyPreviewStyle(item.value)}
            active={fontFamily === item.value}
            onClick={() =>
              applyFontFamilyAndSettings(editor, item.value, patchSettings)
            }
          />
        ))}
      </ToolbarLabelDropdown>
      <ToolbarLabelDropdown
        label={`Font size: ${fontSizeMenuLabel(fontSize, textDefaults)}`}
        display={fontSizeMenuLabel(fontSize, textDefaults)}
      >
        {fontSizeOptions(textDefaults).map((item) => (
          <DropdownItem
            key={`${item.label}-${item.value}`}
            icon={
              <FormatMark
                letter={
                  item.value === "" ? textDefaults.fontSizeLabel : item.label
                }
              />
            }
            label={`${item.label} px`}
            active={fontSize === item.value}
            onClick={() =>
              applyFontSizeAndSettings(editor, item.value, patchSettings)
            }
          />
        ))}
      </ToolbarLabelDropdown>
      <ToolbarLabelDropdown
        label={`Line spacing: ${lineHeightMenuLabel(lineHeight, textDefaults)}`}
        display={lineHeightMenuLabel(lineHeight, textDefaults)}
      >
        {lineHeightOptions(textDefaults).map((item) => (
          <DropdownItem
            key={`${item.label}-${item.value}`}
            icon={<ArrowsUpDownIcon className="h-4 w-4" />}
            label={
              item.value === ""
                ? `Line ${textDefaults.lineHeightLabel}`
                : `Line ${item.label}`
            }
            active={lineHeight === item.value}
            onClick={() =>
              applyLineHeightAndSettings(editor, item.value, patchSettings)
            }
          />
        ))}
      </ToolbarLabelDropdown>
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
        {actions.canAttachFile ? (
          <>
            <DropdownItem
              icon={<PaperClipIcon className="h-4 w-4" />}
              label={actions.uploading ? "Uploading…" : "File"}
              hint="PDF/image"
              onClick={actions.attachFile}
            />
            <DropdownItem
              icon={<MicrophoneIcon className="h-4 w-4" />}
              label="Audio"
              hint="Record"
              onClick={actions.openAudioDialog}
            />
          </>
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
      {onVersionHistory ? (
        <div className="ml-auto flex shrink-0 items-center gap-0.5 border-l border-[var(--line-soft)] pl-1.5">
          <button
            type="button"
            className="cw-editor-toolbar-item hidden md:inline-flex"
            aria-label="Version history"
            title="Version history"
            disabled={versionHistoryDisabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onVersionHistory}
          >
            <ClockIcon className="h-4 w-4" aria-hidden />
            <span className="text-[12px] font-bold">Version history</span>
          </button>
          <div className="md:hidden">
            <ToolbarDropdown
              label="More"
              icon={<EllipsisHorizontalIcon className="h-4 w-4" />}
            >
              <DropdownItem
                icon={<ClockIcon className="h-4 w-4" />}
                label="Version history"
                disabled={versionHistoryDisabled}
                onClick={onVersionHistory}
              />
            </ToolbarDropdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}
