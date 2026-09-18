import type { JSX } from "react";
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
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $getNodeByKey, DecoratorNode } from "lexical";
import { Button } from "@/ui/Button";
import { fileQueryKeys, fileSignedUrl, getFile } from "@/materials/databridge/files";
import { filePlaybackKind } from "@/materials/model/playback";

export type SerializedFileNode = Spread<
  {
    fileId: number;
    filename: string;
    mimeType: string;
  },
  SerializedLexicalNode
>;

function convertFileElement(element: HTMLElement): DOMConversionOutput | null {
  const fileId = Number(element.getAttribute("data-lexical-file-id"));
  const filename = element.getAttribute("data-lexical-file-name") ?? "File";
  const mimeType = element.getAttribute("data-lexical-file-type") ?? "";
  if (!Number.isFinite(fileId) || fileId <= 0) return null;
  return { node: $createFileNode({ fileId, filename, mimeType }) };
}

export class FileNode extends DecoratorNode<JSX.Element> {
  __fileId: number;
  __filename: string;
  __mimeType: string;

  static getType(): string {
    return "file";
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__fileId, node.__filename, node.__mimeType, node.__key);
  }

  constructor(fileId: number, filename: string, mimeType: string, key?: NodeKey) {
    super(key);
    this.__fileId = fileId;
    this.__filename = filename;
    this.__mimeType = mimeType;
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    return $createFileNode({
      fileId: serializedNode.fileId,
      filename: serializedNode.filename,
      mimeType: serializedNode.mimeType,
    });
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      type: "file",
      fileId: this.__fileId,
      filename: this.__filename,
      mimeType: this.__mimeType,
    };
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
    const element = document.createElement("div");
    element.setAttribute("data-lexical-file-id", String(this.__fileId));
    element.setAttribute("data-lexical-file-name", this.__filename);
    element.setAttribute("data-lexical-file-type", this.__mimeType);
    element.textContent = this.__filename;
    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "cw-editor-file";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <FileEmbed
        fileId={this.__fileId}
        filename={this.__filename}
        mimeType={this.__mimeType}
        nodeKey={this.getKey()}
      />
    );
  }

  isInline(): false {
    return false;
  }
}

export function $createFileNode(args: {
  fileId: number;
  filename: string;
  mimeType: string;
}): FileNode {
  return new FileNode(args.fileId, args.filename, args.mimeType);
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
  const fileQuery = useQuery({
    queryKey: fileQueryKeys.detail(fileId),
    queryFn: () => getFile(fileId),
  });
  const file = fileQuery.data;
  const signedQuery = useQuery({
    queryKey: ["files", "signed", file?.storageRef ?? ""],
    queryFn: () => fileSignedUrl(file!.storageRef),
    enabled: Boolean(file?.storageRef),
  });
  const downloadQuery = useQuery({
    queryKey: ["files", "download", file?.storageRef ?? "", file?.filename ?? ""],
    queryFn: () =>
      fileSignedUrl(file!.storageRef, { download: file!.filename }),
    enabled: Boolean(file?.storageRef),
  });
  const kind = filePlaybackKind(file?.mimeType ?? mimeType);
  const src = signedQuery.data ?? null;
  const downloadUrl = downloadQuery.data ?? null;

  return (
    <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-[13.5px] font-bold text-[var(--ink)]">
          {file?.filename ?? filename}
        </p>
        <div className="flex flex-wrap gap-2">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Download
            </a>
          ) : null}
          {editor.isEditable() ? (
            <Button
              type="button"
              variant="secondary"
              className="px-2.5 py-1.5 text-[12px]"
              onClick={() => {
                editor.update(() => {
                  $getNodeByKey(nodeKey)?.remove();
                });
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {kind === "image" && src ? (
        <img
          src={src}
          alt={file?.filename ?? filename}
          className="mt-3 max-h-80 max-w-full rounded-[6px] object-contain"
        />
      ) : null}
      {kind === "video" && src ? (
        <video className="mt-3 w-full rounded-[6px]" controls playsInline src={src} />
      ) : null}
      {kind === "audio" && src ? (
        <audio className="mt-3 w-full" controls src={src} />
      ) : null}
      {kind === "pdf" && src ? (
        <iframe
          title={file?.filename ?? filename}
          className="mt-3 h-64 w-full rounded-[6px] border-0 bg-white"
          src={src}
        />
      ) : null}
    </div>
  );
}
