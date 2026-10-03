export const MATERIAL_KINDS = ["page", "link", "file"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number] | "resource";

export const BLOCK_KINDS = ["rich_text", "video", "quiz"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export function parseMaterialKind(value: string): MaterialKind | null {
  if (value === "resource") return "resource";
  if (value === "page" || value === "link" || value === "file") return value;
  return null;
}

export function parseBlockKind(value: string): BlockKind | null {
  return BLOCK_KINDS.includes(value as BlockKind) ? (value as BlockKind) : null;
}

export function materialKindLabel(kind: MaterialKind): string {
  if (kind === "page") return "Page";
  if (kind === "link") return "Link";
  if (kind === "resource") return "Resource";
  return "File";
}

export function safeFilename(name: string): string {
  const trimmed = name.trim() || "file";
  const base = trimmed.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 180);
  return base || "file";
}
