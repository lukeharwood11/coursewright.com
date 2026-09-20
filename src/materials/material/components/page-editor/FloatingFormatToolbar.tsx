import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import { LinkIcon } from "@heroicons/react/24/outline";
import {
  popupStyle,
  usePopupPlacement,
  type Rect,
} from "@/ui/AnchoredPopup";
import { usePageEditorActions } from "./PageEditorActions";
import { FormatMark, ToolbarIconButton } from "./toolbarUi";

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  isLink: boolean;
  linkUrl: string;
};

export function FloatingFormatToolbar() {
  const [editor] = useLexicalComposerContext();
  const actions = usePageEditorActions();
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [format, setFormat] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    isLink: false,
    linkUrl: "",
  });

  const update = useCallback(() => {
    const native = window.getSelection();
    const root = editor.getRootElement();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() ||
        !native ||
        native.rangeCount === 0 ||
        !root ||
        !native.anchorNode ||
        !root.contains(native.anchorNode)
      ) {
        setAnchorRect(null);
        return;
      }
      const anchor = selection.anchor.getNode();
      const parent = anchor.getParent();
      const linkNode = $isLinkNode(anchor)
        ? anchor
        : $isLinkNode(parent)
          ? parent
          : null;
      setFormat({
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
        strikethrough: selection.hasFormat("strikethrough"),
        isLink: linkNode != null,
        linkUrl: linkNode?.getURL() ?? "",
      });
      const box = native.getRangeAt(0).getBoundingClientRect();
      setAnchorRect({
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      });
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerUpdateListener(() => {
        update();
      }),
    );
  }, [editor, update]);

  if (!anchorRect) return null;

  return (
    <FloatingToolbarSurface rect={anchorRect}>
      <ToolbarIconButton
        pressed={format.bold}
        label="Bold"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <FormatMark letter="B" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={format.italic}
        label="Italic"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <FormatMark letter="I" style="italic" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={format.underline}
        label="Underline"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        <FormatMark letter="U" style="underline" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={format.strikethrough}
        label="Strikethrough"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
      >
        <FormatMark letter="S" style="strike" />
      </ToolbarIconButton>
      <ToolbarIconButton
        pressed={format.isLink}
        label="Link"
        onClick={() => actions.openLinkDialog(format.linkUrl)}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarIconButton>
    </FloatingToolbarSurface>
  );
}

function FloatingToolbarSurface({
  rect,
  children,
}: {
  rect: Rect;
  children: ReactNode;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const placement = usePopupPlacement({
    open: true,
    popupRef,
    anchorRect: rect,
    preferredAlign: "center",
    preferredSide: "top",
  });

  return createPortal(
    <div
      ref={popupRef}
      className="cw-editor-float"
      onMouseDown={(event) => event.preventDefault()}
      style={popupStyle(placement)}
    >
      {children}
    </div>,
    document.body,
  );
}
