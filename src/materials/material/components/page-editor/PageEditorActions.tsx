import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { caughtErrorMessage } from "@/ui/toast";
import { uploadNewFile } from "@/materials/databridge/files";
import {
  parseTableDimensions,
  TABLE_DEFAULT_COLUMNS,
  TABLE_DEFAULT_ROWS,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_ROWS,
  normalizeHttpUrl,
  type PageBlockType,
} from "@/materials/model/pageEditor";
import { AudioSnippetRecorder } from "../AudioSnippetRecorder";
import { $createFileNode } from "../FileNode";
import { usePageEditorMedia } from "../PageEditorMediaContext";
import { $createVideoNode } from "../VideoNode";
import { insertDecoratorBlock } from "./insertBlock";
import { EditorDialog, FieldLabel } from "./toolbarUi";

type DialogKind = "table" | "link" | "video" | "audio" | null;

type PageEditorActions = {
  canAttachFile: boolean;
  uploading: boolean;
  uploadingFilename: string | null;
  uploadError: string | null;
  setBlock: (type: PageBlockType) => void;
  insertDivider: () => void;
  insertTable: (rows: number, columns: number) => void;
  attachFile: () => void;
  uploadAndInsertFile: (file: File) => Promise<boolean>;
  openTableDialog: () => void;
  openLinkDialog: (initialUrl?: string) => void;
  openVideoDialog: () => void;
  openAudioDialog: () => void;
};

const PageEditorActionsContext = createContext<PageEditorActions | null>(null);

export function usePageEditorActions(): PageEditorActions {
  const value = useContext(PageEditorActionsContext);
  if (!value) {
    throw new Error("usePageEditorActions must be used inside PageEditorActionsProvider");
  }
  return value;
}

export function PageEditorActionsProvider({ children }: { children: ReactNode }) {
  const [editor] = useLexicalComposerContext();
  const media = usePageEditorMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [tableRows, setTableRows] = useState(String(TABLE_DEFAULT_ROWS));
  const [tableColumns, setTableColumns] = useState(String(TABLE_DEFAULT_COLUMNS));
  const [urlValue, setUrlValue] = useState("");
  const [linkCanRemove, setLinkCanRemove] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFilename, setUploadingFilename] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
    setAudioFile(null);
    setUploadError(null);
    editor.focus();
  }, [editor]);

  const insertTable = useCallback(
    (rows: number, columns: number) => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        rows: String(rows),
        columns: String(columns),
        includeHeaders: { rows: true, columns: false },
      });
    },
    [editor],
  );

  const setBlock = useCallback((type: PageBlockType) => {
    applyBlockType(editor, type);
  }, [editor]);

  const insertDivider = useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  }, [editor]);

  const attachFile = useCallback(() => {
    if (uploadingRef.current) return;
    fileInputRef.current?.click();
  }, []);

  const uploadAndInsertFile = useCallback(
    async (file: File): Promise<boolean> => {
      if (!media || uploadingRef.current) return false;
      uploadingRef.current = true;
      setUploading(true);
      setUploadingFilename(file.name);
      setUploadError(null);
      try {
        const uploaded = await uploadNewFile({
          organizationId: media.organizationId,
          uploadedBy: media.userId,
          file,
        });
        editor.update(() => {
          insertDecoratorBlock(
            $createFileNode({
              fileId: uploaded.id,
              filename: uploaded.filename,
              mimeType: uploaded.mimeType,
            }),
          );
        });
        return true;
      } catch (caught) {
        setUploadError(caughtErrorMessage(caught));
        return false;
      } finally {
        uploadingRef.current = false;
        setUploading(false);
        setUploadingFilename(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor, media],
  );

  const openTableDialog = useCallback(() => {
    setTableRows(String(TABLE_DEFAULT_ROWS));
    setTableColumns(String(TABLE_DEFAULT_COLUMNS));
    setDialog("table");
  }, []);

  const openLinkDialog = useCallback((initialUrl = "") => {
    setUrlValue(initialUrl);
    setLinkCanRemove(initialUrl.length > 0);
    setDialog("link");
  }, []);

  const openVideoDialog = useCallback(() => {
    setUrlValue("");
    setDialog("video");
  }, []);

  const openAudioDialog = useCallback(() => {
    if (!media || uploadingRef.current) return;
    setAudioFile(null);
    setUploadError(null);
    setDialog("audio");
  }, [media]);

  const tableSize = parseTableDimensions(tableRows, tableColumns);
  const normalizedUrl = normalizeHttpUrl(urlValue);

  const value = useMemo<PageEditorActions>(
    () => ({
      canAttachFile: media != null,
      uploading,
      uploadingFilename,
      uploadError,
      setBlock,
      insertDivider,
      insertTable,
      attachFile,
      uploadAndInsertFile,
      openTableDialog,
      openLinkDialog,
      openVideoDialog,
      openAudioDialog,
    }),
    [
      attachFile,
      insertDivider,
      insertTable,
      media,
      openAudioDialog,
      openLinkDialog,
      openTableDialog,
      openVideoDialog,
      setBlock,
      uploadAndInsertFile,
      uploadError,
      uploading,
      uploadingFilename,
    ],
  );

  return (
    <PageEditorActionsContext.Provider value={value}>
      {children}
      {media ? (
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) void uploadAndInsertFile(next);
          }}
        />
      ) : null}
      <EditorDialog
        open={dialog === "table"}
        title="Insert table"
        confirmLabel="Insert"
        confirmDisabled={tableSize == null}
        onClose={closeDialog}
        onConfirm={() => {
          if (!tableSize) return;
          insertTable(tableSize.rows, tableSize.columns);
          closeDialog();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Rows">
            <Input
              type="number"
              min={1}
              max={TABLE_MAX_ROWS}
              value={tableRows}
              onChange={(event) => setTableRows(event.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="Columns">
            <Input
              type="number"
              min={1}
              max={TABLE_MAX_COLUMNS}
              value={tableColumns}
              onChange={(event) => setTableColumns(event.target.value)}
            />
          </FieldLabel>
        </div>
        <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
          Up to {TABLE_MAX_ROWS} rows and {TABLE_MAX_COLUMNS} columns.
        </p>
      </EditorDialog>
      <EditorDialog
        open={dialog === "link"}
        title={linkCanRemove ? "Edit link" : "Insert link"}
        confirmLabel={linkCanRemove ? "Save" : "Add"}
        confirmDisabled={normalizedUrl == null}
        extraAction={
          linkCanRemove ? (
            <Button
              type="button"
              variant="secondary"
              className="mr-auto"
              onClick={() => {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                closeDialog();
              }}
            >
              Remove
            </Button>
          ) : null
        }
        onClose={closeDialog}
        onConfirm={() => {
          if (!normalizedUrl) return;
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedUrl);
          closeDialog();
        }}
      >
        <FieldLabel label="Address">
          <Input
            value={urlValue}
            placeholder="https://"
            onChange={(event) => setUrlValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (!normalizedUrl) return;
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedUrl);
                closeDialog();
              }
            }}
          />
        </FieldLabel>
      </EditorDialog>
      <EditorDialog
        open={dialog === "video"}
        title="Insert video"
        confirmLabel="Add"
        confirmDisabled={normalizedUrl == null}
        onClose={closeDialog}
        onConfirm={() => {
          if (!normalizedUrl) return;
          editor.update(() => {
            insertDecoratorBlock($createVideoNode(normalizedUrl));
          });
          closeDialog();
        }}
      >
        <FieldLabel label="Video address">
          <Input
            value={urlValue}
            placeholder="https://"
            onChange={(event) => setUrlValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (!normalizedUrl) return;
                editor.update(() => {
                  insertDecoratorBlock($createVideoNode(normalizedUrl));
                });
                closeDialog();
              }
            }}
          />
        </FieldLabel>
      </EditorDialog>
      <EditorDialog
        open={dialog === "audio"}
        title="Insert audio"
        confirmLabel={uploading ? "Adding…" : "Add"}
        confirmDisabled={audioFile == null || uploading}
        wide
        onClose={() => {
          if (uploading) return;
          closeDialog();
        }}
        onConfirm={() => {
          if (!audioFile || uploading) return;
          void (async () => {
            const ok = await uploadAndInsertFile(audioFile);
            if (ok) closeDialog();
          })();
        }}
      >
        <div className="flex flex-col gap-3">
          <FieldLabel label="Audio file">
            <input
              type="file"
              accept="audio/*"
              className="block w-full text-[13.5px] text-[var(--ink-soft)]"
              onChange={(event) => {
                setAudioFile(event.target.files?.[0] ?? null);
                setUploadError(null);
              }}
            />
            {audioFile ? (
              <p className="mt-1 text-[12px] text-[var(--ink-soft)]">{audioFile.name}</p>
            ) : null}
            <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
              Audio: MP3 or M4A works best on phones. You can also record a clip
              below.
            </p>
          </FieldLabel>
          <AudioSnippetRecorder file={audioFile} onFile={setAudioFile} />
          {uploadError ? (
            <p className="text-[13px] text-[var(--amber-deep)]" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>
      </EditorDialog>
    </PageEditorActionsContext.Provider>
  );
}

export function applyBlockType(editor: LexicalEditor, type: PageBlockType) {
  if (type === "ul" || type === "ol") {
    editor.dispatchCommand(
      type === "ol" ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
      undefined,
    );
    return;
  }
  editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    if (type === "paragraph") {
      $setBlocksType(selection, () => $createParagraphNode());
      return;
    }
    if (type === "quote") {
      $setBlocksType(selection, () => $createQuoteNode());
      return;
    }
    $setBlocksType(selection, () => $createHeadingNode(type));
  });
}
