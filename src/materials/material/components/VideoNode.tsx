import type { JSX } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import type { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
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
  stringValue,
} from "lexical";
import { Button } from "@/ui/Button";
import { youtubeEmbedSrc } from "@/materials/model/blocks";

export type SerializedVideoNode = Spread<{ url: string }, SerializedDecoratorBlockNode>;

const videoNodeSchema = nodeSchema<VideoNode>()({
  url: stringValue(),
});

function convertVideoElement(element: HTMLElement): DOMConversionOutput | null {
  const url = element.getAttribute("data-lexical-video");
  if (!url) return null;
  return { node: $createVideoNode(url) };
}

export class VideoNode extends DecoratorBlockNode {
  declare __url: string;

  $config() {
    return this.config("video", {
      extends: DecoratorBlockNode,
      json: videoNodeSchema,
    });
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__url, node.__key);
  }

  constructor(url: string = "", key?: NodeKey) {
    super(undefined, key);
    this.__url = url;
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    return $createVideoNode().updateFromJSON(serializedNode);
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
    const element = $getDocument().createElement("div");
    element.setAttribute("data-lexical-video", this.getUrl());
    element.textContent = this.getUrl();
    return { element };
  }

  getUrl(): string {
    return this.getLatest().__url;
  }

  setUrl(url: string): this {
    const self = this.getWritable();
    self.__url = url;
    return self;
  }

  createDOM(): HTMLElement {
    const div = $getDocument().createElement("div");
    div.className = "cw-editor-video";
    return div;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return <VideoEmbed url={this.getUrl()} nodeKey={this.getKey()} />;
  }
}

export function $createVideoNode(url: string = ""): VideoNode {
  return new VideoNode(url);
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}

export function VideoEmbed({ url, nodeKey }: { url: string; nodeKey?: string }) {
  const [editor] = useLexicalComposerContext();
  const embed = youtubeEmbedSrc(url);
  return (
    <div>
      {embed ? (
        <iframe
          title="Video"
          className="aspect-video w-full rounded-[10px] border border-[var(--line-soft)]"
          src={embed}
          allow="fullscreen"
        />
      ) : (
        <a
          href={url}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          target="_blank"
          rel="noreferrer"
        >
          {url}
        </a>
      )}
      {nodeKey && editor.isEditable() ? (
        <div className="mt-2">
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
        </div>
      ) : null}
    </div>
  );
}
