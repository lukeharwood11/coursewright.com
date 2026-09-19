import type { JSX } from "react";
import { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useQuery } from "@tanstack/react-query";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import {
  $getDocument,
  $getNodeByKey,
  nodeSchema,
  numberValue,
  stringValue,
} from "lexical";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import type { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { fileQueryKeys, fileSignedUrl, getFile } from "@/materials/databridge/files";
import { filePlaybackKind } from "@/materials/model/playback";
import { AudioPlayer } from "./AudioPlayer";
import { FilePreviewOverlay } from "./FilePreviewOverlay";

export type SerializedFileNode = Spread<
  {
    fileId: number;
    filename: string;
    mimeType: string;
  },
  SerializedDecoratorBlockNode
>;

const fileNodeSchema = nodeSchema<FileNode>()({
  fileId: numberValue(),
  filename: stringValue(),
  mimeType: stringValue(),
});

function convertFileElement(element: HTMLElement): DOMConversionOutput | null {
  const fileId = Number(element.getAttribute("data-lexical-file-id"));
  const filename = element.getAttribute("data-lexical-file-name") ?? "File";
  const mimeType = element.getAttribute("data-lexical-file-type") ?? "";
  if (!Number.isFinite(fileId) || fileId <= 0) return null;
  return { node: $createFileNode({ fileId, filename, mimeType }) };
}

export class FileNode extends DecoratorBlockNode {
  declare __fileId: number;
  declare __filename: string;
  declare __mimeType: string;

  $config() {
    return this.config("file", {
      extends: DecoratorBlockNode,
      json: fileNodeSchema,
    });
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__fileId, node.__filename, node.__mimeType, node.__key);
  }

  constructor(
    fileId: number = 0,
    filename: string = "File",
    mimeType: string = "",
    key?: NodeKey,
  ) {
    super(undefined, key);
    this.__fileId = fileId;
    this.__filename = filename;
    this.__mimeType = mimeType;
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    return $createFileNode().updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (element: HTMLElement) => {
        if (!element.hasAttribute("data-lexical-file-id")) return null;
        return { conversion: convertFileElement, priority: 2 };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = $getDocument().createElement("div");
    element.setAttribute("data-lexical-file-id", String(this.getFileId()));
    element.setAttribute("data-lexical-file-name", this.getFilename());
    element.setAttribute("data-lexical-file-type", this.getMimeType());
    element.textContent = this.getFilename();
    return { element };
  }

  getFileId(): number {
    return this.getLatest().__fileId;
  }

  setFileId(fileId: number): this {
    const self = this.getWritable();
    self.__fileId = fileId;
    return self;
  }

  getFilename(): string {
    return this.getLatest().__filename;
  }

  setFilename(filename: string): this {
    const self = this.getWritable();
    self.__filename = filename;
    return self;
  }

  getMimeType(): string {
    return this.getLatest().__mimeType;
  }

  setMimeType(mimeType: string): this {
    const self = this.getWritable();
    self.__mimeType = mimeType;
    return self;
  }

  createDOM(): HTMLElement {
    const div = $getDocument().createElement("div");
    div.className = "cw-editor-file";
    return div;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <FileEmbed
        fileId={this.getFileId()}
        filename={this.getFilename()}
        mimeType={this.getMimeType()}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createFileNode(args?: {
  fileId: number;
  filename: string;
  mimeType: string;
}): FileNode {
  return new FileNode(args?.fileId ?? 0, args?.filename ?? "File", args?.mimeType ?? "");
}

export function $isFileNode(
  node: LexicalNode | null | undefined,
): node is FileNode {
  return node instanceof FileNode;
}

function FileEmbed({
  fileId,
  filename,
  mimeType,
  nodeKey,
}: {
  fileId: number;
  filename: string;
  mimeType: string;
  nodeKey: string;
}) {
  const [editor] = useLexicalComposerContext();
  const editable = editor.isEditable();
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const fileQuery = useQuery({
    queryKey: fileQueryKeys.detail(fileId),
    queryFn: () => getFile(fileId),
  });
  const file = fileQuery.data;
  const displayName = file?.filename ?? filename;
  const kind = filePlaybackKind(file?.mimeType ?? mimeType, displayName);
  const needsInlineSrc = kind === "image" || kind === "video" || kind === "audio";
  const signedQuery = useQuery({
    queryKey: ["files", "signed", file?.storageRef ?? ""],
    queryFn: () => fileSignedUrl(file!.storageRef),
    enabled: Boolean(file?.storageRef) && (needsInlineSrc || pdfPreviewOpen),
  });
  const downloadQuery = useQuery({
    queryKey: ["files", "download", file?.storageRef ?? "", file?.filename ?? ""],
    queryFn: () =>
      fileSignedUrl(file!.storageRef, { download: file!.filename }),
    enabled: Boolean(file?.storageRef) && kind !== "image",
  });
  const src = signedQuery.data ?? null;
  const downloadUrl = downloadQuery.data ?? null;

  function removeNode() {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });
  }

  if (kind === "image") {
    return (
      <div className="group relative inline-block max-w-full">
        {src ? (
          <img
            src={src}
            alt=""
            className="max-h-80 max-w-full rounded-[6px] object-contain"
          />
        ) : (
          <div
            className="flex h-32 w-48 items-center justify-center rounded-[6px] bg-[var(--paper)] text-[12.5px] text-[var(--ink-faint)]"
            aria-busy="true"
          >
            Loading image…
          </div>
        )}
        {editable ? (
          <Button
            type="button"
            variant="secondary"
            className="absolute right-2 top-2 px-2.5 py-1.5 text-[12px] leading-none opacity-0 shadow-[var(--shadow)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
            onClick={removeNode}
          >
            Remove
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {kind === "pdf" ? (
              <DocumentTextIcon
                className="h-5 w-5 shrink-0 text-[var(--ink-soft)]"
                aria-hidden
              />
            ) : null}
            <p className="min-w-0 truncate text-[13.5px] font-bold leading-none text-[var(--ink)]">
              {displayName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {kind === "pdf" ? (
              <Button
                type="button"
                variant="secondary"
                className="px-2.5 py-1.5 text-[12px] leading-none"
                disabled={!file?.storageRef}
                onClick={() => setPdfPreviewOpen(true)}
              >
                Preview
              </Button>
            ) : null}
            {downloadUrl ? (
              <a
                href={downloadUrl}
                className="inline-flex items-center px-2.5 py-1.5 text-[12px] font-bold leading-none text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Download
              </a>
            ) : null}
            {editable ? (
              <Button
                type="button"
                variant="secondary"
                className="px-2.5 py-1.5 text-[12px] leading-none"
                onClick={removeNode}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        {kind === "video" && src ? (
          <video className="mt-3 w-full rounded-[6px]" controls playsInline src={src} />
        ) : null}
        {kind === "audio" && src ? (
          <AudioPlayer
            className="mt-3"
            src={src}
            onRetry={() => {
              void signedQuery.refetch();
            }}
          />
        ) : null}
      </div>
      {kind === "pdf" ? (
        <FilePreviewOverlay
          open={pdfPreviewOpen}
          title={displayName}
          onClose={() => setPdfPreviewOpen(false)}
          actions={
            downloadUrl ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = downloadUrl;
                  link.rel = "noopener";
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
              >
                Download
              </Button>
            ) : null
          }
        >
          {src ? (
            <iframe
              title={displayName}
              className="h-full w-full border-0 bg-white"
              src={src}
            />
          ) : (
            <p className="p-4 text-[14px] text-[var(--ink-soft)]">Loading PDF…</p>
          )}
        </FilePreviewOverlay>
      ) : null}
    </>
  );
}
