import { $createParagraphNode, type LexicalNode } from "lexical";
import { $insertNodeToNearestRoot } from "@lexical/utils";

export function insertDecoratorBlock(node: LexicalNode) {
  const inserted = $insertNodeToNearestRoot(node);
  const paragraph = $createParagraphNode();
  inserted.insertAfter(paragraph);
  paragraph.selectEnd();
}
