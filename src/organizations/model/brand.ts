export const BRAND_ICON_MAX_BYTES = 256 * 1024;

export const DEFAULT_CHROME = {
  accent: "#33604d",
  deep: "#234739",
  tint: "#e6ede7",
} as const;

const ACCENT_ON_WHITE_MIN = 4.5;

export type ChromeAccent = {
  accent: string;
  deep: string;
  tint: string;
};

export type ChromeAccentVars = {
  "--chrome-accent": string;
  "--chrome-accent-deep": string;
  "--chrome-accent-tint": string;
};

type Rgb = { r: number; g: number; b: number };

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

export function parseAccentHex(value: string): string | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
  if (!match) return null;
  return `#${match[1].toLowerCase()}`;
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = rgbFromHex(foreground);
  const bg = rgbFromHex(background);
  if (!fg || !bg) return null;
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

/** One accent, or null when the hex is invalid or white text would fail WCAG AA. */
export function chromeAccentFromHex(value: string): ChromeAccent | null {
  const accent = parseAccentHex(value);
  if (!accent) return null;
  const rgb = rgbFromHex(accent);
  if (!rgb) return null;
  if (contrastRatio(accent, "#ffffff")! < ACCENT_ON_WHITE_MIN) return null;

  const tint = mix(rgb, WHITE, 0.88);
  let deep = rgb;
  let towardBlack = 0;
  while (contrastRatio(hexFromRgb(deep), hexFromRgb(tint))! < ACCENT_ON_WHITE_MIN && towardBlack < 0.85) {
    towardBlack += 0.08;
    deep = mix(rgb, BLACK, towardBlack);
  }

  return {
    accent,
    deep: hexFromRgb(deep),
    tint: hexFromRgb(tint),
  };
}

export function chromeAccentVars(
  accentColor: string | null | undefined,
): ChromeAccentVars | undefined {
  if (!accentColor) return undefined;
  const chrome = chromeAccentFromHex(accentColor);
  if (!chrome) return undefined;
  return {
    "--chrome-accent": chrome.accent,
    "--chrome-accent-deep": chrome.deep,
    "--chrome-accent-tint": chrome.tint,
  };
}

export function validateAccentInput(
  value: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  const parsed = parseAccentHex(trimmed);
  if (!parsed) return { ok: false, error: "Enter a color like #33604D." };
  if (!chromeAccentFromHex(parsed)) {
    return { ok: false, error: "Choose a darker color so white text stays readable." };
  }
  return { ok: true, value: parsed };
}

export type BrandIconExtension = "png" | "jpg" | "webp";

export function validateBrandIcon(
  file: { type: string; size: number },
): { ok: true; extension: BrandIconExtension } | { ok: false; error: string } {
  const extension = extensionForMime(file.type);
  if (!extension) {
    return { ok: false, error: "Use a PNG, JPEG, or WebP image." };
  }
  if (file.size > BRAND_ICON_MAX_BYTES) {
    return { ok: false, error: "That icon is too large. Use an image under 256 KB." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "That file is empty. Choose an image." };
  }
  return { ok: true, extension };
}

export function brandIconObjectPath(
  organizationId: number,
  extension: BrandIconExtension,
): string {
  return `${organizationId}/icon.${extension}`;
}

export function brandIconPublicUrl(
  supabaseUrl: string,
  iconPath: string,
  updatedAt: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/org-brand/${iconPath}?v=${encodeURIComponent(updatedAt)}`;
}

function extensionForMime(type: string): BrandIconExtension | null {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return null;
}

function rgbFromHex(hex: string): Rgb | null {
  const parsed = parseAccentHex(hex);
  if (!parsed) return null;
  return {
    r: Number.parseInt(parsed.slice(1, 3), 16),
    g: Number.parseInt(parsed.slice(3, 5), 16),
    b: Number.parseInt(parsed.slice(5, 7), 16),
  };
}

function hexFromRgb(rgb: Rgb): string {
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
}

function channel(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  };
}

function relativeLuminance(rgb: Rgb): number {
  const channelL = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channelL(rgb.r) + 0.7152 * channelL(rgb.g) + 0.0722 * channelL(rgb.b);
}
