import type { ElementFormatType } from "lexical";
import type { BlockKind } from "./blocks";

export type PageEditorSettings = {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  textAlign: ElementFormatType;
};

export const EMPTY_PAGE_EDITOR_SETTINGS: PageEditorSettings = {
  fontFamily: "",
  fontSize: "",
  lineHeight: "",
  textAlign: "left",
};

const ALIGNMENTS = new Set<ElementFormatType>([
  "left",
  "start",
  "center",
  "right",
  "end",
  "justify",
  "",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parsePageEditorSettings(value: unknown): PageEditorSettings {
  const record = asRecord(value);
  if (!record) return { ...EMPTY_PAGE_EDITOR_SETTINGS };
  const fontFamily =
    typeof record.fontFamily === "string" ? record.fontFamily : "";
  const fontSize = typeof record.fontSize === "string" ? record.fontSize : "";
  const lineHeight =
    typeof record.lineHeight === "string" ? record.lineHeight : "";
  const rawAlign = record.textAlign;
  const textAlign =
    typeof rawAlign === "string" && ALIGNMENTS.has(rawAlign as ElementFormatType)
      ? (rawAlign as ElementFormatType)
      : "left";
  return { fontFamily, fontSize, lineHeight, textAlign };
}

export function pageEditorSettingsFromBlocks(
  blocks: Array<{ kind: BlockKind; body: unknown }>,
): PageEditorSettings {
  for (const block of blocks) {
    if (block.kind !== "rich_text") continue;
    const body = asRecord(block.body);
    if (!body) continue;
    if (body.editorSettings !== undefined) {
      return parsePageEditorSettings(body.editorSettings);
    }
  }
  return { ...EMPTY_PAGE_EDITOR_SETTINGS };
}

export function pageEditorSettingsEqual(
  a: PageEditorSettings,
  b: PageEditorSettings,
): boolean {
  return (
    a.fontFamily === b.fontFamily &&
    a.fontSize === b.fontSize &&
    a.lineHeight === b.lineHeight &&
    a.textAlign === b.textAlign
  );
}

export function hasStoredPageEditorSettings(settings: PageEditorSettings): boolean {
  return !pageEditorSettingsEqual(settings, EMPTY_PAGE_EDITOR_SETTINGS);
}
