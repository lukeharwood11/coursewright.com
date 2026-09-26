import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  type ElementFormatType,
  type LexicalEditor,
  type RangeSelection,
} from "lexical";
import type { CSSProperties } from "react";
import type { PageEditorSettings } from "@/materials/model/pageEditorSettings";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";

export type EditorTextDefaults = {
  /** Toolbar label when text uses the editor body font (no inline font-family). */
  fontFamilyLabel: string;
  /** Toolbar label when text uses the editor body size (no inline font-size). */
  fontSizeLabel: string;
  /** Toolbar label when text uses the editor body line-height (no inline line-height). */
  lineHeightLabel: string;
};

/** Matches `.cw-editor-input` in `src/styles/index.css`. */
export const PAGE_EDITOR_TEXT_DEFAULTS: EditorTextDefaults = {
  fontFamilyLabel: "Manrope",
  fontSizeLabel: "15",
  lineHeightLabel: "1.6",
};

/** Matches `.cw-editor-input-discussion` body size. */
export const DISCUSSION_EDITOR_TEXT_DEFAULTS: EditorTextDefaults = {
  fontFamilyLabel: "Manrope",
  fontSizeLabel: "14.5",
  lineHeightLabel: "1.6",
};

export type FontFamilyOption = { label: string; value: string };

export function fontFamilyOptions(
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): FontFamilyOption[] {
  return [
    { label: defaults.fontFamilyLabel, value: "" },
    { label: "Lora", value: "Lora, Georgia, serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
    { label: "Arial", value: "Arial, Helvetica, sans-serif" },
    { label: "Courier", value: '"Courier New", Courier, monospace' },
  ];
}

export type FontSizeOption = { label: string; value: string };

const EXTRA_FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
];

export function fontSizeOptions(
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): FontSizeOption[] {
  const body: FontSizeOption = {
    label: defaults.fontSizeLabel,
    value: "",
  };
  const rest = EXTRA_FONT_SIZE_OPTIONS.filter(
    (item) => item.label !== defaults.fontSizeLabel,
  );
  return [body, ...rest];
}

export type LineHeightOption = { label: string; value: string };

const EXTRA_LINE_HEIGHT_OPTIONS: LineHeightOption[] = [
  { label: "1", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2", value: "2" },
  { label: "2.5", value: "2.5" },
];

export function lineHeightOptions(
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): LineHeightOption[] {
  const body: LineHeightOption = {
    label: defaults.lineHeightLabel,
    value: "",
  };
  const rest = EXTRA_LINE_HEIGHT_OPTIONS.filter(
    (item) => item.label !== defaults.lineHeightLabel,
  );
  return [body, ...rest];
}

function parseLineHeightNumber(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.endsWith("%")) {
    const pct = Number.parseFloat(trimmed);
    return Number.isFinite(pct) ? pct / 100 : null;
  }
  const num = Number.parseFloat(trimmed);
  return Number.isFinite(num) ? num : null;
}

function lineHeightsMatch(a: string, b: string): boolean {
  const na = parseLineHeightNumber(a);
  const nb = parseLineHeightNumber(b);
  if (na === null || nb === null) return a.trim() === b.trim();
  return Math.abs(na - nb) < 0.02;
}

export function matchLineHeightOption(
  cssValue: string,
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  const trimmed = cssValue.trim();
  if (!trimmed || lineHeightsMatch(trimmed, defaults.lineHeightLabel)) return "";
  for (const option of lineHeightOptions(defaults)) {
    if (!option.value) continue;
    if (lineHeightsMatch(trimmed, option.value)) return option.value;
  }
  return trimmed;
}

export const TEXT_ALIGNMENT_OPTIONS: {
  value: ElementFormatType;
  label: string;
}[] = [
  { value: "left", label: "Align left" },
  { value: "center", label: "Align center" },
  { value: "right", label: "Align right" },
  { value: "justify", label: "Justify" },
];

export function readBlockAlignment(): ElementFormatType {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return "left";
  const anchor = selection.anchor.getNode();
  const element =
    anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
  if (!$isElementNode(element)) return "left";
  const format = element.getFormatType();
  if (format === "start" || format === "") return "left";
  if (format === "end") return "right";
  return format || "left";
}

export function applyTextAlignment(
  editor: LexicalEditor,
  alignment: ElementFormatType,
) {
  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
}

function isBodyFontFamily(cssValue: string, defaults: EditorTextDefaults): boolean {
  const needle = cssValue.toLowerCase().replace(/['"]/g, "");
  const body = defaults.fontFamilyLabel.toLowerCase();
  return needle.includes(body);
}

export function matchFontFamilyOption(
  cssValue: string,
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  const trimmed = cssValue.trim();
  if (!trimmed || isBodyFontFamily(trimmed, defaults)) return "";
  const needle = trimmed.toLowerCase().replace(/['"]/g, "");
  for (const option of fontFamilyOptions(defaults)) {
    if (!option.value) continue;
    const first = option.value.split(",")[0]?.trim().replace(/['"]/g, "").toLowerCase();
    if (first && needle.includes(first)) return option.value;
  }
  return trimmed;
}

export function matchFontSizeOption(
  cssValue: string,
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  const trimmed = cssValue.trim();
  if (!trimmed) return "";
  const normalized = trimmed.endsWith("px") ? trimmed : `${trimmed}px`;
  const bodyPx = `${defaults.fontSizeLabel}px`;
  if (normalized === bodyPx) return "";
  const hit = fontSizeOptions(defaults).find((option) => option.value === normalized);
  return hit?.value ?? trimmed;
}

export function readSelectionFontFamily(
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return "";
  const raw = $getSelectionStyleValueForProperty(selection, "font-family", "");
  return matchFontFamilyOption(raw, defaults);
}

export function readSelectionFontSize(
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return "";
  const raw = $getSelectionStyleValueForProperty(selection, "font-size", "");
  return matchFontSizeOption(raw, defaults);
}

export function readSelectionLineHeight(
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return "";
  const raw = $getSelectionStyleValueForProperty(selection, "line-height", "");
  return matchLineHeightOption(raw, defaults);
}

/** True when the page has no typed text yet (placeholder-only empty doc). */
export function isPageEditorContentEmpty(): boolean {
  return $getRoot().getTextContent().length === 0;
}

function selectionForStylePatch(): RangeSelection | null {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) return selection;
  if (!isPageEditorContentEmpty()) return null;
  $getRoot().selectEnd();
  const next = $getSelection();
  return $isRangeSelection(next) ? next : null;
}

export function applyFontFamily(editor: LexicalEditor, family: string) {
  editor.update(() => {
    const selection = selectionForStylePatch();
    if (!selection) return;
    $patchStyleText(selection, {
      "font-family": family ? family : null,
    });
  });
}

export function applyFontSize(editor: LexicalEditor, size: string) {
  editor.update(() => {
    const selection = selectionForStylePatch();
    if (!selection) return;
    $patchStyleText(selection, {
      "font-size": size ? size : null,
    });
  });
}

export function applyLineHeight(editor: LexicalEditor, lineHeight: string) {
  editor.update(() => {
    const selection = selectionForStylePatch();
    if (!selection) return;
    $patchStyleText(selection, {
      "line-height": lineHeight ? lineHeight : null,
    });
  });
}

/** Apply saved toolbar defaults to the current caret (for the next typed text). */
export function applyEditorSettingsToSelection(settings: PageEditorSettings) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  $patchStyleText(selection, {
    "font-family": settings.fontFamily ? settings.fontFamily : null,
    "font-size": settings.fontSize ? settings.fontSize : null,
    "line-height": settings.lineHeight ? settings.lineHeight : null,
  });
  const anchor = selection.anchor.getNode();
  const element =
    anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
  if ($isElementNode(element) && settings.textAlign) {
    element.setFormat(settings.textAlign);
  }
}

export function applyTextAlignmentAndSettings(
  editor: LexicalEditor,
  alignment: ElementFormatType,
  onSettings: (patch: Partial<PageEditorSettings>) => void,
) {
  onSettings({ textAlign: alignment });
  applyTextAlignment(editor, alignment);
}

export function applyFontFamilyAndSettings(
  editor: LexicalEditor,
  family: string,
  onSettings: (patch: Partial<PageEditorSettings>) => void,
) {
  onSettings({ fontFamily: family });
  applyFontFamily(editor, family);
}

export function applyFontSizeAndSettings(
  editor: LexicalEditor,
  size: string,
  onSettings: (patch: Partial<PageEditorSettings>) => void,
) {
  onSettings({ fontSize: size });
  applyFontSize(editor, size);
}

export function applyLineHeightAndSettings(
  editor: LexicalEditor,
  lineHeight: string,
  onSettings: (patch: Partial<PageEditorSettings>) => void,
) {
  onSettings({ lineHeight });
  applyLineHeight(editor, lineHeight);
}

/** Preview typeface in font menus (body default uses `--font-ui`). */
export function fontFamilyPreviewStyle(value: string): CSSProperties {
  if (!value) return { fontFamily: "var(--font-ui)" };
  return { fontFamily: value };
}

export function fontFamilyMenuLabel(
  value: string,
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  if (!value) return defaults.fontFamilyLabel;
  const option = fontFamilyOptions(defaults).find((item) => item.value === value);
  return option?.label ?? "Custom";
}

export function fontSizeMenuLabel(
  value: string,
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  if (!value) return defaults.fontSizeLabel;
  const option = fontSizeOptions(defaults).find((item) => item.value === value);
  if (option) return option.label;
  return value.replace(/px$/, "");
}

export function lineHeightMenuLabel(
  value: string,
  defaults: EditorTextDefaults = PAGE_EDITOR_TEXT_DEFAULTS,
): string {
  if (!value) return defaults.lineHeightLabel;
  const option = lineHeightOptions(defaults).find((item) => item.value === value);
  if (option) return option.label;
  const num = parseLineHeightNumber(value);
  return num !== null ? String(num) : value;
}
