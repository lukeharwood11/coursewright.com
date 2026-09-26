import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FOCUS_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import type { PageEditorSettings } from "@/materials/model/pageEditorSettings";
import { hasStoredPageEditorSettings } from "@/materials/model/pageEditorSettings";
import {
  applyEditorSettingsToSelection,
  isPageEditorContentEmpty,
} from "./textFormatting";

/**
 * On load, apply the material's saved toolbar defaults to the caret so new
 * typing matches the instructor's last choices.
 */
export function RestoreEditorSettingsPlugin({
  settings,
}: {
  settings: PageEditorSettings;
}) {
  const [editor] = useLexicalComposerContext();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || !hasStoredPageEditorSettings(settings)) return;
    applied.current = true;
    editor.update(() => {
      const root = $getRoot();
      if (root.getChildrenSize() === 0) return;
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        root.selectEnd();
      }
      applyEditorSettingsToSelection(settings);
    });
  }, [editor, settings]);

  useEffect(() => {
    return editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        if (!hasStoredPageEditorSettings(settings)) return false;
        editor.update(() => {
          if (!isPageEditorContentEmpty()) return;
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            $getRoot().selectEnd();
          }
          applyEditorSettingsToSelection(settings);
        });
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, settings]);

  return null;
}
