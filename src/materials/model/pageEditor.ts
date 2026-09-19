import { looksLikeHttpUrl } from "./blocks";
import { isImageMime } from "./playback";

export const TABLE_MAX_ROWS = 20;
export const TABLE_MAX_COLUMNS = 10;
export const TABLE_DEFAULT_ROWS = 3;
export const TABLE_DEFAULT_COLUMNS = 3;

export type PageBlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "ul"
  | "ol";

export type SlashQueryOption = {
  id: string;
  title: string;
  keywords: string[];
};

export type TableDimensions = {
  rows: number;
  columns: number;
};

function isIntInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isValidTableRows(value: number): boolean {
  return isIntInRange(value, 1, TABLE_MAX_ROWS);
}

export function isValidTableColumns(value: number): boolean {
  return isIntInRange(value, 1, TABLE_MAX_COLUMNS);
}

export function parseTableDimensions(
  rows: string,
  columns: string,
): TableDimensions | null {
  const nextRows = Number(rows);
  const nextColumns = Number(columns);
  if (!isValidTableRows(nextRows) || !isValidTableColumns(nextColumns)) {
    return null;
  }
  return { rows: nextRows, columns: nextColumns };
}

export function parseSlashTableQuery(query: string): {
  rows: number;
  columns: number | null;
} | null {
  const match = query.trim().match(/^([1-9]\d?)(?:x([1-9]\d?)?)?$/i);
  if (!match) return null;
  const rows = Number(match[1]);
  if (!isValidTableRows(rows)) return null;
  if (match[2] == null) return { rows, columns: null };
  const columns = Number(match[2]);
  if (!isValidTableColumns(columns)) return null;
  return { rows, columns };
}

export function slashTableChoices(query: string): TableDimensions[] {
  const parsed = parseSlashTableQuery(query);
  if (!parsed) return [];
  if (parsed.columns != null) {
    return [{ rows: parsed.rows, columns: parsed.columns }];
  }
  return Array.from({ length: TABLE_MAX_COLUMNS }, (_, index) => ({
    rows: parsed.rows,
    columns: index + 1,
  }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function filterSlashOptions<T extends SlashQueryOption>(
  options: T[],
  query: string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return options;
  const pattern = new RegExp(escapeRegExp(trimmed), "i");
  return options.filter(
    (option) =>
      pattern.test(option.title) ||
      option.keywords.some((keyword) => pattern.test(keyword)),
  );
}

export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (looksLikeHttpUrl(trimmed)) return trimmed;
  const withProtocol = `https://${trimmed}`;
  return looksLikeHttpUrl(withProtocol) ? withProtocol : null;
}

/** Image files from a paste/drop DataTransfer (items preferred, then files). */
export function imageFilesFromClipboard(data: {
  items?: ArrayLike<{
    kind: string;
    type: string;
    getAsFile: () => File | null;
  }> | null;
  files?: ArrayLike<File> | null;
}): File[] {
  const fromItems: File[] = [];
  if (data.items) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (item.kind !== "file" || !isImageMime(item.type)) continue;
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  if (fromItems.length > 0) return fromItems;

  const fromFiles: File[] = [];
  if (data.files) {
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      if (isImageMime(file.type)) fromFiles.push(file);
    }
  }
  return fromFiles;
}
