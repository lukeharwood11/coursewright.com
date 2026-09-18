import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode, autoLinkUrlMatcher } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HEADING,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  type Transformer,
  $generateNodesFromMarkdownString,
} from "@lexical/markdown";
import {
  $createParagraphNode,
  $getRoot,
  $parseSerializedNode,
  type LexicalEditor,
} from "lexical";
import type { BlockRecord } from "@/materials/databridge/blocks";
import { parseRichTextBody, parseVideoBody } from "@/materials/model/blocks";
import { parseLexicalState } from "@/materials/model/pageContent";
import { FileNode } from "./FileNode";
import { $createVideoNode, VideoNode } from "./VideoNode";

export const PAGE_EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HorizontalRuleNode,
  VideoNode,
  FileNode,
];

export const PAGE_MARKDOWN_TRANSFORMERS: Transformer[] = [
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  LINK,
];

export const PAGE_AUTOLINK_MATCHERS = [autoLinkUrlMatcher];

export const PAGE_EDITOR_THEME: InitialConfigType["theme"] = {
  paragraph: "cw-editor-p",
  heading: {
    h1: "cw-editor-h",
    h2: "cw-editor-h",
    h3: "cw-editor-h",
    h4: "cw-editor-h",
    h5: "cw-editor-h",
    h6: "cw-editor-h",
  },
  list: {
    ul: "cw-editor-ul",
    ol: "cw-editor-ol",
    listitem: "cw-editor-li",
    nested: {
      listitem: "cw-editor-li-nested",
    },
  },
  quote: "cw-editor-quote",
  link: "cw-editor-link",
  table: "cw-editor-table",
  tableCell: "cw-editor-td",
  tableCellHeader: "cw-editor-th",
  tableScrollableWrapper: "cw-editor-table-scroll",
  text: {
    bold: "cw-editor-bold",
    italic: "cw-editor-italic",
    underline: "cw-editor-underline",
    strikethrough: "cw-editor-strikethrough",
  },
};

export function loadBlocksIntoEditor(
  editor: LexicalEditor,
  blocks: BlockRecord[],
): void {
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      for (const block of blocks) {
        if (block.kind === "video") {
          const url = parseVideoBody(block.body).trim();
          if (url) root.append($createVideoNode(url));
          continue;
        }
        const lexical = parseLexicalState(block.body);
        if (lexical?.root.children?.length) {
          for (const child of lexical.root.children) {
            root.append($parseSerializedNode(child));
          }
          continue;
        }
        const markdown = parseRichTextBody(block.body);
        if (markdown.trim()) {
          const nodes = $generateNodesFromMarkdownString(
            markdown,
            PAGE_MARKDOWN_TRANSFORMERS,
            true,
          );
          if (nodes.length > 0) root.append(...nodes);
        }
      }
      if (root.getChildrenSize() === 0) {
        root.append($createParagraphNode());
      }
    },
    { discrete: true },
  );
}
