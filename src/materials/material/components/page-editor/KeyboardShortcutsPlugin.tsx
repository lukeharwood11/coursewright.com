import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
} from "lexical";
import { $isLinkNode } from "@lexical/link";
import { usePageEditorActions } from "./PageEditorActions";

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();
  const actions = usePageEditorActions();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const mod = event.metaKey || event.ctrlKey;
        if (!mod) return false;
        const key = event.key.toLowerCase();
        if (key === "k") {
          event.preventDefault();
          let initialUrl = "";
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            const anchor = selection.anchor.getNode();
            const parent = anchor.getParent();
            const linkNode = $isLinkNode(anchor)
              ? anchor
              : $isLinkNode(parent)
                ? parent
                : null;
            initialUrl = linkNode?.getURL() ?? "";
          });
          actions.openLinkDialog(initialUrl);
          return true;
        }
        if (event.shiftKey && key === "s") {
          event.preventDefault();
          queueMicrotask(() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [actions, editor]);

  return null;
}
