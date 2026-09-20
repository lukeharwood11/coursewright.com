export type MentionPerson = {
  userId: string;
  name: string;
  role?: string;
};

export type MentionQuery = {
  start: number;
  query: string;
};

export type MentionTextPart =
  | { kind: "text"; text: string }
  | { kind: "mention"; userId: string; name: string };

const MENTION_AFTER = /[\s.,!?;:]/;

export function mentionLabel(name: string): string {
  const trimmed = name.trim() || "Someone";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function filterMentionPeople(
  people: MentionPerson[],
  query: string,
  excludeUserId?: string,
): MentionPerson[] {
  const needle = query.trim().toLowerCase();
  return people.filter((person) => {
    if (excludeUserId && person.userId === excludeUserId) return false;
    if (!person.name.trim()) return false;
    if (!needle) return true;
    return person.name.toLowerCase().includes(needle);
  });
}

/** `@` at the start of a token, with the query running to the caret. */
export function findMentionQuery(
  text: string,
  cursor: number,
): MentionQuery | null {
  if (cursor < 0 || cursor > text.length) return null;
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && /[A-Za-z0-9]/.test(before.charAt(at - 1))) return null;
  const query = before.slice(at + 1);
  if (query.includes("\n") || query.includes("\r")) return null;
  return { start: at, query };
}

export function applyMention(args: {
  text: string;
  start: number;
  cursor: number;
  name: string;
}): { text: string; cursor: number } {
  const inserted = `${mentionLabel(args.name)} `;
  const next = `${args.text.slice(0, args.start)}${inserted}${args.text.slice(args.cursor)}`;
  return { text: next, cursor: args.start + inserted.length };
}

export function splitMentionText(
  text: string,
  people: MentionPerson[],
): MentionTextPart[] {
  if (!text) return [];
  const ranked = [...people]
    .filter((person) => person.name.trim())
    .sort((a, b) => {
      const length = b.name.trim().length - a.name.trim().length;
      if (length !== 0) return length;
      return a.name.localeCompare(b.name);
    });
  if (ranked.length === 0) return [{ kind: "text", text }];

  const parts: MentionTextPart[] = [];
  let index = 0;
  while (index < text.length) {
    const mention = matchMentionAt(text, index, ranked);
    if (mention) {
      parts.push({
        kind: "mention",
        userId: mention.userId,
        name: mention.name,
      });
      index += mention.length;
      continue;
    }
    const nextAt = nextMentionIndex(text, index + 1, ranked);
    const end = nextAt == null ? text.length : nextAt;
    parts.push({ kind: "text", text: text.slice(index, end) });
    index = end;
  }
  return mergeTextParts(parts);
}

export function mentionedUserIdsInPlainText(
  text: string,
  people: MentionPerson[],
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const part of splitMentionText(text, people)) {
    if (part.kind !== "mention") continue;
    if (seen.has(part.userId)) continue;
    seen.add(part.userId);
    ids.push(part.userId);
  }
  return ids;
}

export function mentionedUserIdsFromDraft(args: {
  mode: "plain" | "lexical";
  text: string;
  lexical: unknown;
  people: MentionPerson[];
  excludeUserId?: string;
}): string[] {
  const raw =
    args.mode === "lexical"
      ? mentionedUserIdsInLexical(args.lexical, args.people)
      : mentionedUserIdsInPlainText(args.text, args.people);
  const withoutSelf = args.excludeUserId
    ? raw.filter((userId) => userId !== args.excludeUserId)
    : raw;
  if (args.people.length === 0) return withoutSelf;
  const allowed = new Set(
    args.people
      .filter((person) => person.userId !== args.excludeUserId)
      .map((person) => person.userId),
  );
  return withoutSelf.filter((userId) => allowed.has(userId));
}

export function mentionedUserIdsInLexical(
  value: unknown,
  people: MentionPerson[] = [],
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  function add(userId: string) {
    if (!userId || seen.has(userId)) return;
    seen.add(userId);
    ids.push(userId);
  }
  const tree = lexicalTree(value);
  walkLexical(
    tree,
    (node) => {
      if (node.type !== "mention" || typeof node.userId !== "string") return;
      add(node.userId);
    },
    true,
  );
  if (people.length > 0) {
    for (const userId of mentionedUserIdsInPlainText(
      lexicalPlainTextOutsideQuotes(tree),
      people,
    )) {
      add(userId);
    }
  }
  return ids;
}

function matchMentionAt(
  text: string,
  index: number,
  people: MentionPerson[],
): { userId: string; name: string; length: number } | null {
  if (text.charAt(index) !== "@") return null;
  if (index > 0 && /[A-Za-z0-9]/.test(text.charAt(index - 1))) return null;
  for (const person of people) {
    const label = mentionLabel(person.name);
    if (!text.startsWith(label, index)) continue;
    const after = text.charAt(index + label.length);
    if (after && !MENTION_AFTER.test(after)) continue;
    return { userId: person.userId, name: person.name, length: label.length };
  }
  return null;
}

function nextMentionIndex(
  text: string,
  from: number,
  people: MentionPerson[],
): number | null {
  for (let index = from; index < text.length; index += 1) {
    if (matchMentionAt(text, index, people)) return index;
  }
  return null;
}

function mergeTextParts(parts: MentionTextPart[]): MentionTextPart[] {
  const merged: MentionTextPart[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (part.kind === "text" && last?.kind === "text") {
      last.text += part.text;
    } else if (part.kind === "text" && part.text === "") {
      continue;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

type LexicalJson = {
  type?: unknown;
  userId?: unknown;
  text?: unknown;
  children?: unknown;
  root?: unknown;
};

function asRecord(value: unknown): LexicalJson | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as LexicalJson;
  }
  return null;
}

function lexicalTree(value: unknown): unknown {
  const record = asRecord(value);
  if (record && "root" in record) return record.root;
  return value;
}

function walkLexical(
  value: unknown,
  visit: (node: LexicalJson) => void,
  skipQuotes = false,
) {
  const node = asRecord(value);
  if (node) {
    if (skipQuotes && node.type === "quote") return;
    visit(node);
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walkLexical(child, visit, skipQuotes);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const child of value) walkLexical(child, visit, skipQuotes);
  }
}

function lexicalPlainTextOutsideQuotes(value: unknown): string {
  const parts: string[] = [];
  walkLexical(
    value,
    (node) => {
      if (typeof node.text === "string") parts.push(node.text);
    },
    true,
  );
  return parts.join("");
}
