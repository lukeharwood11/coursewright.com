import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils";
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_HIGH,
  DELETE_CHARACTER_COMMAND,
  type RangeSelection,
} from "lexical";
import { usePageEditorSettings } from "./PageEditorSettingsContext";

function isNonLeftBlockAlignment(format: string): boolean {
  return format === "center" || format === "right" || format === "end";
}

function $isSelectionCollapsedAtStartOfBlock(
  selection: RangeSelection,
): boolean {
  if (!selection.isCollapsed()) return false;
  const { anchor } = selection;
  if (anchor.offset !== 0) return false;
  const anchorNode = anchor.getNode();
  if ($isRootNode(anchorNode)) return false;
  const element = $getNearestBlockElementAncestorOrThrow(anchorNode);
  const first = element.getFirstDescendant();
  return element.is(anchorNode) || (first != null && anchorNode.is(first));
}

/**
 * At the start of center- or right-aligned text, Backspace resets alignment to
 * left instead of merging with the previous block.
 */
export function AlignmentBackspacePlugin() {
  const [editor] = useLexicalComposerContext();
  const { patchSettings } = usePageEditorSettings();

  useEffect(() => {
    return editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      (isBackward) => {
        if (!isBackward) return false;
        let reset = false;
        editor.update(() => {
          const selection = $getSelection();
          if (
            !$isRangeSelection(selection) ||
            !$isSelectionCollapsedAtStartOfBlock(selection)
          ) {
            return;
          }
          const element = $getNearestBlockElementAncestorOrThrow(
            selection.anchor.getNode(),
          );
          if (!$isElementNode(element)) return;
          const format = element.getFormatType();
          if (!isNonLeftBlockAlignment(format)) return;
          element.setFormat("left");
          reset = true;
        });
        if (reset) {
          patchSettings({ textAlign: "left" });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, patchSettings]);

  return null;
}
