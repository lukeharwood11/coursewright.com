import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from "lexical";
import { imageFilesFromClipboard } from "@/materials/model/pageEditor";
import { usePageEditorActions } from "./PageEditorActions";

export function PasteImagesPlugin() {
  const [editor] = useLexicalComposerContext();
  const { canAttachFile, uploadAndInsertFile, uploading } = usePageEditorActions();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!canAttachFile || uploading) return false;
        if (!(event instanceof ClipboardEvent) || !event.clipboardData) {
          return false;
        }
        const images = imageFilesFromClipboard(event.clipboardData);
        if (images.length === 0) return false;
        event.preventDefault();
        void (async () => {
          for (const image of images) {
            await uploadAndInsertFile(image);
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [canAttachFile, editor, uploadAndInsertFile, uploading]);

  return null;
}
