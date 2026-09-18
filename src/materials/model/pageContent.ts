import type { SerializedEditorState } from "lexical";
import type { BlockKind } from "./blocks";
import { parseRichTextBody, parseVideoBody } from "./blocks";
import { parseQuizBody, type QuizBody } from "./quiz";

export type LexicalJson = {
  type: string;
  children?: LexicalJson[];
  text?: string;
  url?: string;
  filename?: string;
  fileId?: number;
  [key: string]: unknown;
};

export type PageBlockDraft = {
  kind: BlockKind;
  body: { lexical: SerializedEditorState } | { url: string };
  position: number;
  fileId: number | null;
};

export type PagePrintSegment =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "listItem"; text: string; ordered: boolean }
  | { type: "video"; url: string }
  | { type: "quiz"; quiz: QuizBody };

export type LexicalSplitPart =
  | { kind: "video"; url: string }
  | { kind: "node"; node: LexicalJson };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asLexicalJson(value: unknown): LexicalJson | null {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string") return null;
  return record as LexicalJson;
}

export function videoUrlFromLexicalNode(node: LexicalJson): string | null {
  if (node.type !== "video") return null;
  const url = typeof node.url === "string" ? node.url.trim() : "";
  return url || null;
}

export function quizFromLexicalNode(node: LexicalJson): QuizBody | null {
  if (node.type !== "quiz") return null;
  return parseQuizBody(node);
}

function isHoistableBlock(node: LexicalJson): boolean {
  return node.type === "video" || node.type === "file" || node.type === "quiz";
}

function containsHoistableBlock(node: LexicalJson): boolean {
  if (isHoistableBlock(node)) return true;
  return (node.children ?? []).some(containsHoistableBlock);
}

export function splitLexicalNodes(nodes: LexicalJson[]): LexicalSplitPart[] {
  const parts: LexicalSplitPart[] = [];
  for (const node of nodes) {
    const url = videoUrlFromLexicalNode(node);
    if (url) {
      parts.push({ kind: "video", url });
      continue;
    }
    const children = node.children;
    if (!children?.length || !children.some(containsHoistableBlock)) {
      parts.push({ kind: "node", node });
      continue;
    }
    let buffer: LexicalJson[] = [];
    function flushBuffer() {
      if (buffer.length === 0) return;
      parts.push({ kind: "node", node: { ...node, children: buffer } });
      buffer = [];
    }
    for (const childPart of splitLexicalNodes(children)) {
      if (childPart.kind === "video") {
        flushBuffer();
        parts.push(childPart);
        continue;
      }
      if (isHoistableBlock(childPart.node)) {
        flushBuffer();
        parts.push(childPart);
        continue;
      }
      buffer.push(childPart.node);
    }
    flushBuffer();
  }
  return parts;
}

export function splitLexicalChildren(value: unknown): LexicalSplitPart[] {
  if (!Array.isArray(value)) return [];
  const nodes = value.flatMap((item) => {
    const node = asLexicalJson(item);
    return node ? [node] : [];
  });
  return splitLexicalNodes(nodes);
}

export function parseLexicalState(body: unknown): SerializedEditorState | null {
  const record = asRecord(body);
  if (!record) return null;
  const lexical = record.lexical;
  if (!lexical || typeof lexical !== "object" || Array.isArray(lexical)) return null;
  const root = asRecord((lexical as { root?: unknown }).root);
  if (!root || root.type !== "root") return null;
  return lexical as SerializedEditorState;
}

function textOf(node: LexicalJson): string {
  if (typeof node.text === "string") return node.text;
  if (typeof node.filename === "string") return node.filename;
  if (!node.children?.length) return "";
  return node.children.map(textOf).join("");
}

export function plainTextFromLexical(state: SerializedEditorState): string {
  const root = asLexicalJson(state.root);
  if (!root) return "";
  return collectPrintSegmentsFromLexical(state)
    .flatMap((segment) => {
      if (segment.type === "video") return [];
      if (segment.type === "quiz") return [segment.quiz.prompt];
      return [segment.text];
    })
    .join("\n\n");
}

function isEmptyLexicalState(state: SerializedEditorState): boolean {
  const root = asLexicalJson(state.root);
  if (!root?.children?.length) return true;
  return !walkHasContent(root);
}

function walkHasContent(node: LexicalJson): boolean {
  if (node.type === "quiz") return true;
  if (node.type === "video") {
    return typeof node.url === "string" && node.url.trim() !== "";
  }
  if (node.type === "file") {
    return typeof node.fileId === "number" && node.fileId > 0;
  }
  if (node.type === "table" || node.type === "horizontalrule") return true;
  if (typeof node.text === "string" && node.text.trim() !== "") return true;
  if (typeof node.filename === "string" && node.filename.trim() !== "") return true;
  return (node.children ?? []).some(walkHasContent);
}

function collectPrintSegmentsFromLexical(
  state: SerializedEditorState,
): PagePrintSegment[] {
  const root = asLexicalJson(state.root);
  if (!root?.children) return [];
  return flattenNodes(root.children);
}

function flattenNodes(nodes: LexicalJson[]): PagePrintSegment[] {
  const segments: PagePrintSegment[] = [];
  for (const part of splitLexicalNodes(nodes)) {
    if (part.kind === "video") {
      segments.push({ type: "video", url: part.url });
      continue;
    }
    segments.push(...flattenNonVideoNode(part.node));
  }
  return segments;
}

function flattenNonVideoNode(node: LexicalJson): PagePrintSegment[] {
  if (node.type === "quiz") {
    return [{ type: "quiz", quiz: parseQuizBody(node) }];
  }
  if (node.type === "file") {
    const name =
      typeof node.filename === "string" && node.filename.trim()
        ? node.filename.trim()
        : "File";
    return [{ type: "paragraph", text: name }];
  }
  if (node.type === "table") {
    const segments: PagePrintSegment[] = [];
    const rows = node.children ?? [];
    let anyRow = false;
    for (const row of rows) {
      const cells = (row.children ?? []).map((cell) => textOf(cell).trim());
      const text = cells.filter(Boolean).join(" · ");
      if (text) {
        segments.push({ type: "paragraph", text });
        anyRow = true;
      }
    }
    if (!anyRow) segments.push({ type: "paragraph", text: "Table" });
    return segments;
  }
  if (node.type === "horizontalrule") {
    return [];
  }
  if (node.type === "heading") {
    const text = textOf(node).trim();
    return text ? [{ type: "heading", text }] : [];
  }
  if (node.type === "quote") {
    const text = textOf(node).trim();
    return text ? [{ type: "paragraph", text }] : [];
  }
  if (node.type === "list") {
    const segments: PagePrintSegment[] = [];
    const ordered = node.listType === "number" || node.tag === "ol";
    for (const child of node.children ?? []) {
      if (child.type === "listitem") {
        const nested = (child.children ?? []).filter((item) => item.type === "list");
        const text = textOf({
          ...child,
          children: (child.children ?? []).filter((item) => item.type !== "list"),
        }).trim();
        if (text) segments.push({ type: "listItem", text, ordered });
        segments.push(...flattenNodes(nested));
      } else {
        segments.push(...flattenNodes([child]));
      }
    }
    return segments;
  }
  if (node.children?.length && node.type !== "text") {
    const text = textOf(node).trim();
    return text ? [{ type: "paragraph", text }] : [];
  }
  return [];
}

export function editorStateToBlocks(state: SerializedEditorState): PageBlockDraft[] {
  const root = asLexicalJson(state.root);
  if (!root) return [];
  const drafts: PageBlockDraft[] = [];
  let buffer: LexicalJson[] = [];

  function flush() {
    if (buffer.length === 0) return;
    const chunk: SerializedEditorState = {
      root: {
        ...(state.root as SerializedEditorState["root"]),
        children: buffer as SerializedEditorState["root"]["children"],
      },
    };
    if (!isEmptyLexicalState(chunk)) {
      drafts.push({
        kind: "rich_text",
        body: { lexical: chunk },
        position: drafts.length,
        fileId: null,
      });
    }
    buffer = [];
  }

  for (const part of splitLexicalNodes(root.children ?? [])) {
    if (part.kind === "video") {
      flush();
      drafts.push({
        kind: "video",
        body: { url: part.url },
        position: drafts.length,
        fileId: null,
      });
      continue;
    }
    buffer.push(part.node);
  }
  flush();
  return drafts;
}

export function printSegmentsFromBlocks(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): PagePrintSegment[] {
  const segments: PagePrintSegment[] = [];
  for (const block of blocks) {
    if (block.kind === "quiz") {
      segments.push({ type: "quiz", quiz: parseQuizBody(block.body) });
      continue;
    }
    if (block.kind === "video") {
      const url = parseVideoBody(block.body).trim();
      if (url) segments.push({ type: "video", url });
      continue;
    }
    const lexical = parseLexicalState(block.body);
    if (lexical) {
      segments.push(...collectPrintSegmentsFromLexical(lexical));
      continue;
    }
    const markdown = parseRichTextBody(block.body);
    for (const paragraph of markdown.split(/\n+/)) {
      const text = paragraph.replace(/^#+\s*/, "").trim();
      if (text) segments.push({ type: "paragraph", text });
    }
  }
  return segments;
}

export function videoUrlsFromBlocks(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): string[] {
  return printSegmentsFromBlocks(blocks).flatMap((segment) =>
    segment.type === "video" ? [segment.url] : [],
  );
}

export function pageHasQuiz(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): boolean {
  return printSegmentsFromBlocks(blocks).some((segment) => segment.type === "quiz");
}

export function pageHasContent(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): boolean {
  for (const block of blocks) {
    if (block.kind === "quiz") return true;
    if (block.kind === "video") {
      if (parseVideoBody(block.body).trim()) return true;
      continue;
    }
    const lexical = parseLexicalState(block.body);
    if (lexical && !isEmptyLexicalState(lexical)) return true;
    if (!lexical && parseRichTextBody(block.body).trim()) return true;
  }
  return false;
}
