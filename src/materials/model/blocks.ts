export type BlockKind = "rich_text" | "video";

export type RichTextBody = { markdown: string };
export type VideoBody = { url: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parseRichTextBody(body: unknown): string {
  const record = asRecord(body);
  if (!record) return typeof body === "string" ? body : "";
  if (record.lexical && typeof record.lexical === "object") {
    const root = asRecord((record.lexical as { root?: unknown }).root);
    if (root) return lexicalPlainText(root);
  }
  if (typeof record.markdown === "string") return record.markdown;
  if (typeof record.text === "string") return record.text;
  if (typeof record.html === "string") return record.html;
  return "";
}

function lexicalPlainText(node: Record<string, unknown>): string {
  if (typeof node.text === "string") return node.text;
  if (typeof node.filename === "string") return node.filename;
  if (typeof node.url === "string") return node.url;
  const children = node.children;
  if (!Array.isArray(children)) return "";
  return children
    .flatMap((child) => {
      const record = asRecord(child);
      return record ? [lexicalPlainText(record)] : [];
    })
    .join("");
}

export function richTextBody(markdown: string): RichTextBody {
  return { markdown };
}

export function parseVideoBody(body: unknown): string {
  const record = asRecord(body);
  if (!record) return typeof body === "string" ? body : "";
  if (typeof record.url === "string") return record.url;
  return "";
}

export function videoBody(url: string): VideoBody {
  return { url };
}

export function youtubeEmbedSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function looksLikeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
