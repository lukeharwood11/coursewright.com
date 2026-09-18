import type { JSX } from "react";
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
import { DecoratorNode } from "lexical";
import { youtubeEmbedSrc } from "@/materials/model/blocks";

export type SerializedVideoNode = Spread<{ url: string }, SerializedLexicalNode>;

function convertVideoElement(element: HTMLElement): DOMConversionOutput | null {
  const url = element.getAttribute("data-lexical-video");
  if (!url) return null;
  return { node: $createVideoNode(url) };
}

export class VideoNode extends DecoratorNode<JSX.Element> {
  __url: string;

  static getType(): string {
    return "video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__url, node.__key);
  }

  constructor(url: string, key?: NodeKey) {
    super(key);
    this.__url = url;
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    return $createVideoNode(serializedNode.url);
  }

  exportJSON(): SerializedVideoNode {
    return {
      ...super.exportJSON(),
      type: "video",
      url: this.__url,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (element: HTMLElement) => {
        if (!element.hasAttribute("data-lexical-video")) return null;
        return { conversion: convertVideoElement, priority: 2 };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-video", this.__url);
    element.textContent = this.__url;
    return { element };
  }

  getUrl(): string {
    return this.__url;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = "cw-editor-video";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return <VideoEmbed url={this.__url} />;
  }

  isInline(): false {
    return false;
  }
}

export function $createVideoNode(url: string): VideoNode {
  return new VideoNode(url);
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}

export function VideoEmbed({ url }: { url: string }) {
  const embed = youtubeEmbedSrc(url);
  if (embed) {
    return (
      <iframe
        title="Video"
        className="aspect-video w-full rounded-[10px] border border-[var(--line-soft)]"
        src={embed}
        allow="fullscreen"
      />
    );
  }
  return (
    <a
      href={url}
      className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
      target="_blank"
      rel="noreferrer"
    >
      {url}
    </a>
  );
}
