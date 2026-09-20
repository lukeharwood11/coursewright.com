import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from "lexical";
import {
  $applyNodeReplacement,
  $createTextNode,
  TextNode,
  type LexicalUpdateJSON,
} from "lexical";
import {
  mentionLabel,
  splitMentionText,
  type MentionPerson,
} from "@/discussions/model/mentions";

export type SerializedMentionNode = Spread<
  { userId: string },
  SerializedTextNode
>;

export class MentionNode extends TextNode {
  declare __userId: string;

  $config() {
    return this.config("mention", {
      extends: TextNode,
    });
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__userId, node.__text, node.__key);
  }

  constructor(userId = "", text = "", key?: NodeKey) {
    super(text, key);
    this.__userId = userId;
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(
      serializedNode.userId,
      serializedNode.text,
    ).updateFromJSON(serializedNode);
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedMentionNode>,
  ): this {
    const self = super.updateFromJSON(serializedNode);
    return self.setUserId(
      typeof serializedNode.userId === "string" ? serializedNode.userId : "",
    );
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      userId: this.__userId,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("cw-mention");
    return dom;
  }

  isTextEntity(): boolean {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  getUserId(): string {
    return this.getLatest().__userId;
  }

  setUserId(userId: string): this {
    const self = this.getWritable();
    self.__userId = userId;
    return self;
  }
}

export function $createMentionNode(userId: string, name: string): MentionNode {
  const node = new MentionNode(userId, mentionLabel(name));
  node.setMode("token");
  return $applyNodeReplacement(node);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode;
}

export function $nodesFromPlainMentionText(
  text: string,
  people: MentionPerson[],
): TextNode[] {
  return splitMentionText(text, people).flatMap((part) => {
    if (part.kind === "mention") {
      return [$createMentionNode(part.userId, part.name)];
    }
    if (!part.text) return [];
    return [$createTextNode(part.text)];
  });
}
