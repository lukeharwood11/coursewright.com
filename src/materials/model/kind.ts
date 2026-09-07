export const MATERIAL_KINDS = ["page", "link", "file"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const BLOCK_KINDS = ["rich_text", "video"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export function parseMaterialKind(value: string): MaterialKind | null {
  return MATERIAL_KINDS.includes(value as MaterialKind)
    ? (value as MaterialKind)
    : null;
}

export function parseBlockKind(value: string): BlockKind | null {
  return BLOCK_KINDS.includes(value as BlockKind) ? (value as BlockKind) : null;
}

export function materialKindLabel(kind: MaterialKind): string {
  if (kind === "page") return "Page";
  if (kind === "link") return "Link";
  return "File";
}

export function safeFilename(name: string): string {
  const trimmed = name.trim() || "file";
  const base = trimmed.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 180);
  return base || "file";
}
