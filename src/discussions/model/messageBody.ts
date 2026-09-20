import type { SerializedEditorState } from "lexical";

export type DiscussionQuote = {
  authorName: string;
  text: string;
};

export type DiscussionMessageBody =
  | { v: 1; format: "plain"; text: string }
  | { v: 1; format: "lexical"; lexical: SerializedEditorState };

const QUOTE_MAX = 280;

type LexicalJson = Record<string, unknown>;

function asRecord(value: unknown): LexicalJson | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as LexicalJson;
  }
  return null;
}

function parseQuote(value: unknown): DiscussionQuote | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const authorName =
    typeof record.authorName === "string" ? record.authorName.trim() : "";
  const text = typeof record.text === "string" ? record.text : "";
  if (!authorName && !text.trim()) return undefined;
  return {
    authorName: authorName || "Someone",
    text,
  };
}

function isLexicalState(value: unknown): value is SerializedEditorState {
  const record = asRecord(value);
  if (!record) return false;
  const root = asRecord(record.root);
  return root != null && typeof root.type === "string";
}

function textNode(text: string, format = 0): LexicalJson {
  return {
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function paragraphNode(children: LexicalJson[]): LexicalJson {
  return {
    children,
    direction: null,
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
  };
}

function quoteNode(children: LexicalJson[]): LexicalJson {
  return {
    children,
    direction: null,
    format: "",
    indent: 0,
    type: "quote",
    version: 1,
  };
}

function rootState(children: LexicalJson[]): SerializedEditorState {
  return JSON.parse(
    JSON.stringify({
      root: {
        children,
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    }),
  ) as SerializedEditorState;
}

/** Teams-style cite as a Lexical quote block, then the rest of the message. */
export function lexicalStateWithQuote(args: {
  quote: DiscussionQuote;
  followingText?: string;
  followingLexical?: SerializedEditorState;
}): SerializedEditorState {
  const quoteChildren: LexicalJson[] = [
    paragraphNode([textNode(args.quote.authorName.trim() || "Someone", 1)]),
  ];
  if (args.quote.text.trim()) {
    quoteChildren.push(paragraphNode([textNode(args.quote.text.trim())]));
  }

  const following: LexicalJson[] = [];
  if (args.followingLexical) {
    const root = asRecord(args.followingLexical.root);
    const kids = root?.children;
    if (Array.isArray(kids)) {
      for (const child of kids) {
        const record = asRecord(child);
        if (record) following.push(record);
      }
    }
  } else if (args.followingText?.trim()) {
    following.push(paragraphNode([textNode(args.followingText)]));
  }

  if (following.length === 0) {
    following.push(paragraphNode([]));
  }

  return rootState([quoteNode(quoteChildren), ...following]);
}

/** Parse stored body: legacy plain, v1 JSON, or legacy quote field → Lexical quote. */
export function parseDiscussionBody(raw: string): DiscussionMessageBody {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { v: 1, format: "plain", text: "" };
  }
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const record = asRecord(parsed);
      if (record && record.v === 1) {
        const legacyQuote = parseQuote(record.quote);
        if (record.format === "lexical" && isLexicalState(record.lexical)) {
          if (legacyQuote) {
            return {
              v: 1,
              format: "lexical",
              lexical: lexicalStateWithQuote({
                quote: legacyQuote,
                followingLexical: record.lexical,
              }),
            };
          }
          return { v: 1, format: "lexical", lexical: record.lexical };
        }
        if (record.format === "plain" && typeof record.text === "string") {
          if (legacyQuote) {
            return {
              v: 1,
              format: "lexical",
              lexical: lexicalStateWithQuote({
                quote: legacyQuote,
                followingText: record.text,
              }),
            };
          }
          return { v: 1, format: "plain", text: record.text };
        }
      }
    } catch {
      // fall through — treat as plain
    }
  }
  return { v: 1, format: "plain", text: raw };
}

export function serializeDiscussionBody(body: DiscussionMessageBody): string {
  if (body.format === "plain") {
    return body.text;
  }
  return JSON.stringify(body);
}

export function buildDiscussionQuote(args: {
  authorName: string;
  body: string;
  hasAttachments: boolean;
}): DiscussionQuote {
  const authorName = args.authorName.trim() || "Someone";
  const parsed = parseDiscussionBody(args.body);
  const fromBody = plainTextFromDiscussionBody(parsed).trim();
  if (fromBody) {
    return {
      authorName,
      text:
        fromBody.length > QUOTE_MAX
          ? `${fromBody.slice(0, QUOTE_MAX).trimEnd()}…`
          : fromBody,
    };
  }
  if (parsed.format === "lexical") {
    return { authorName, text: "Shared a formatted message" };
  }
  return {
    authorName,
    text: args.hasAttachments ? "Shared an attachment" : "",
  };
}

export function plainTextFromDiscussionBody(body: DiscussionMessageBody): string {
  if (body.format === "plain") return body.text;
  return plainTextFromLexical(body.lexical);
}

export function plainTextFromLexical(state: SerializedEditorState): string {
  const root = asRecord(state.root);
  if (!root) return "";
  const parts: string[] = [];
  walkLexicalText(root, parts);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

function walkLexicalText(node: LexicalJson, parts: string[]) {
  if (typeof node.text === "string") {
    parts.push(node.text);
  }
  const type = node.type;
  if (
    type === "paragraph" ||
    type === "heading" ||
    type === "quote" ||
    type === "listitem"
  ) {
    if (parts.length > 0 && !parts[parts.length - 1]?.endsWith("\n")) {
      parts.push("\n");
    }
  }
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const record = asRecord(child);
      if (record) walkLexicalText(record, parts);
    }
  }
}

export function discussionBodyHasText(body: DiscussionMessageBody): boolean {
  return plainTextFromDiscussionBody(body).trim().length > 0;
}

export function emptyLexicalState(): SerializedEditorState {
  return rootState([paragraphNode([])]);
}

/** Persist mention pills / rich blocks as Lexical; otherwise keep a plain string. */
export function composerStateToBody(
  state: SerializedEditorState,
): DiscussionMessageBody {
  if (lexicalNeedsRichStorage(state)) {
    return { v: 1, format: "lexical", lexical: state };
  }
  return { v: 1, format: "plain", text: plainTextFromLexical(state) };
}

function lexicalNeedsRichStorage(state: SerializedEditorState): boolean {
  const root = asRecord(state.root);
  return nodeNeedsRichStorage(root);
}

function nodeNeedsRichStorage(node: LexicalJson | null): boolean {
  if (!node) return false;
  const type = node.type;
  if (type === "mention") return true;
  if (type === "text") {
    const format = node.format;
    const mode = node.mode;
    if (typeof format === "number" && format !== 0) return true;
    if (mode === "token" || mode === "segmented") return true;
    return false;
  }
  if (type === "linebreak") return false;
  if (type === "paragraph" || type === "root") {
    const children = node.children;
    if (!Array.isArray(children)) return false;
    return children.some((child) => nodeNeedsRichStorage(asRecord(child)));
  }
  return true;
}

/** Seed the in-place message editor from a stored body. */
export function seedComposerFromMessageBody(raw: string): {
  mode: "plain" | "lexical";
  body: string;
  lexical: SerializedEditorState;
} {
  const parsed = parseDiscussionBody(raw);
  if (parsed.format === "lexical") {
    return { mode: "lexical", body: "", lexical: parsed.lexical };
  }
  return {
    mode: "plain",
    body: parsed.text,
    lexical: emptyLexicalState(),
  };
}
