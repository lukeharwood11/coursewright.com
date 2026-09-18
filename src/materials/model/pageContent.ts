import type { SerializedEditorState } from "lexical";
import type { BlockKind } from "./blocks";
import { parseRichTextBody, parseVideoBody } from "./blocks";

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
  | { type: "video"; url: string };

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
  for (const node of nodes) {
    if (node.type === "video") {
      const url = typeof node.url === "string" ? node.url.trim() : "";
      if (url) segments.push({ type: "video", url });
      continue;
    }
    if (node.type === "file") {
      const name =
        typeof node.filename === "string" && node.filename.trim()
          ? node.filename.trim()
          : "File";
      segments.push({ type: "paragraph", text: name });
      continue;
    }
    if (node.type === "table") {
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
      continue;
    }
    if (node.type === "horizontalrule") {
      continue;
    }
    if (node.type === "heading") {
      const text = textOf(node).trim();
      if (text) segments.push({ type: "heading", text });
      continue;
    }
    if (node.type === "quote") {
      const text = textOf(node).trim();
      if (text) segments.push({ type: "paragraph", text });
      continue;
    }
    if (node.type === "list") {
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
      continue;
    }
    if (node.children?.length && node.type !== "text") {
      const text = textOf(node).trim();
      if (text) segments.push({ type: "paragraph", text });
    }
  }
  return segments;
}

export function editorStateToBlocks(state: SerializedEditorState): PageBlockDraft[] {
  const root = asLexicalJson(state.root);
  if (!root) return [];
  const rootChildren = root.children ?? [];
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

  for (const child of rootChildren) {
    if (child.type === "video") {
      flush();
      const url = typeof child.url === "string" ? child.url.trim() : "";
      if (url) {
        drafts.push({
          kind: "video",
          body: { url },
          position: drafts.length,
          fileId: null,
        });
      }
      continue;
    }
    buffer.push(child);
  }
  flush();
  return drafts;
}

export function printSegmentsFromBlocks(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): PagePrintSegment[] {
  const segments: PagePrintSegment[] = [];
  for (const block of blocks) {
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

export function pageHasContent(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): boolean {
  for (const block of blocks) {
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
