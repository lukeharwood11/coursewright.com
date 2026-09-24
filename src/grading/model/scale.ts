/** Org grading scale. Not the age-level grade scheme. */

export const GRADING_MODES = ["none", "pass_fail", "letter"] as const;
export type GradingMode = (typeof GRADING_MODES)[number];

export type LetterBand = {
  label: string;
  minPercent: number;
};

export type GradingScale = {
  mode: GradingMode;
  passThreshold: number | null;
  bands: LetterBand[];
  updatedAt: string | null;
};

export const EMPTY_GRADING_SCALE: GradingScale = {
  mode: "none",
  passThreshold: null,
  bands: [],
  updatedAt: null,
};

export type LetterBandPreset = {
  id: string;
  /** Short control label in Org Settings → Grading. */
  label: string;
  bands: LetterBand[];
};

/** Classic A–F with A at 92. One band starts at 0. */
export const CLASSIC_ABCDF_BANDS: LetterBand[] = [
  { label: "A", minPercent: 92 },
  { label: "B", minPercent: 84 },
  { label: "C", minPercent: 76 },
  { label: "D", minPercent: 68 },
  { label: "F", minPercent: 0 },
];

/** Dual letters (A, AB, B, …) with no D. One band starts at 0. */
export const AB_DUAL_BANDS: LetterBand[] = [
  { label: "A", minPercent: 93 },
  { label: "AB", minPercent: 88 },
  { label: "B", minPercent: 83 },
  { label: "BC", minPercent: 78 },
  { label: "C", minPercent: 73 },
  { label: "CD", minPercent: 68 },
  { label: "F", minPercent: 0 },
];

/** Plus/minus letters. One band starts at 0. */
export const PLUS_MINUS_BANDS: LetterBand[] = [
  { label: "A+", minPercent: 97 },
  { label: "A", minPercent: 93 },
  { label: "A-", minPercent: 90 },
  { label: "B+", minPercent: 87 },
  { label: "B", minPercent: 83 },
  { label: "B-", minPercent: 80 },
  { label: "C+", minPercent: 77 },
  { label: "C", minPercent: 73 },
  { label: "C-", minPercent: 70 },
  { label: "D+", minPercent: 67 },
  { label: "D", minPercent: 63 },
  { label: "D-", minPercent: 60 },
  { label: "F", minPercent: 0 },
];

export const LETTER_BAND_PRESETS: LetterBandPreset[] = [
  { id: "classic_abcdf", label: "Classic A–F (92)", bands: CLASSIC_ABCDF_BANDS },
  { id: "ab_dual", label: "A / AB / B…", bands: AB_DUAL_BANDS },
  { id: "plus_minus", label: "A+ / A / A-…", bands: PLUS_MINUS_BANDS },
];

/** Default when switching into Letters with an empty band list. */
export const STARTER_LETTER_BANDS: LetterBand[] = CLASSIC_ABCDF_BANDS;

function bandKey(band: LetterBand): string {
  return `${band.label.trim()}\0${Math.round(band.minPercent * 100) / 100}`;
}

export function letterBandsMatch(a: readonly LetterBand[], b: readonly LetterBand[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].map(bandKey).sort();
  const right = [...b].map(bandKey).sort();
  return left.every((key, index) => key === right[index]);
}

/** Which preset matches the current bands, if any. */
export function matchingLetterPresetId(bands: readonly LetterBand[]): string | null {
  const preset = LETTER_BAND_PRESETS.find((entry) => letterBandsMatch(bands, entry.bands));
  return preset?.id ?? null;
}

export type LetterBandRange = {
  label: string;
  minPercent: number;
  /** Inclusive upper bound for display (higher band wins the shared cut). */
  maxPercent: number;
};

function inclusiveMaxBelow(nextMin: number): number {
  const stepped = Math.round(nextMin * 100) / 100;
  if (Number.isInteger(stepped)) return stepped - 1;
  return Math.round((stepped - 0.01) * 100) / 100;
}

/** Display ranges from floors. Sorted high → low. */
export function letterBandRanges(bands: readonly LetterBand[]): LetterBandRange[] {
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent);
  return sorted.map((band, index) => {
    const higher = sorted[index - 1];
    const maxPercent = higher ? inclusiveMaxBelow(higher.minPercent) : 100;
    return {
      label: band.label.trim() || "—",
      minPercent: Math.round(band.minPercent * 100) / 100,
      maxPercent,
    };
  });
}

export function formatPercentNumber(percent: number): string {
  const rounded = Math.round(percent * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

export function formatLetterBandRange(range: LetterBandRange): string {
  if (range.minPercent === range.maxPercent) {
    return `${range.label} ${formatPercentNumber(range.minPercent)}`;
  }
  return `${range.label} ${formatPercentNumber(range.minPercent)}–${formatPercentNumber(range.maxPercent)}`;
}

export function parseGradingMode(value: string | null | undefined): GradingMode {
  if (value === "pass_fail" || value === "letter" || value === "none") return value;
  return "none";
}

export function percentOf(earned: number, possible: number): number | null {
  if (!Number.isFinite(earned) || !Number.isFinite(possible) || possible <= 0) return null;
  return Math.round((earned / possible) * 10000) / 100;
}

/** Unweighted mean of locked percents. Empty when nothing is locked. */
export function unweightedMean(percents: readonly number[]): number | null {
  const usable = percents.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return null;
  const sum = usable.reduce((total, value) => total + value, 0);
  return Math.round((sum / usable.length) * 100) / 100;
}

/**
 * Higher band wins an exact boundary.
 * Pass is inclusive of the threshold. Mode `none` has no label.
 */
export function percentToLabel(
  percent: number | null,
  scale: Pick<GradingScale, "mode" | "passThreshold" | "bands">,
): string | null {
  if (percent == null || !Number.isFinite(percent)) return null;
  if (scale.mode === "none") return null;
  if (scale.mode === "pass_fail") {
    if (scale.passThreshold == null) return null;
    return percent >= scale.passThreshold ? "Pass" : "Fail";
  }
  let best: LetterBand | null = null;
  for (const band of scale.bands) {
    if (percent >= band.minPercent && (best == null || band.minPercent > best.minPercent)) {
      best = band;
    }
  }
  return best?.label ?? null;
}

export function formatPercent(percent: number | null): string {
  if (percent == null || !Number.isFinite(percent)) return "No grade yet";
  const rounded = Math.round(percent * 100) / 100;
  const shown = rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${shown}%`;
}

/** Points first. A letter or Pass/Fail is added only when the org mode says so. */
export function formatGradeDisplay(args: {
  percent: number | null;
  scale: Pick<GradingScale, "mode" | "passThreshold" | "bands">;
  overrideLabel?: string | null;
}): string {
  const percentText = formatPercent(args.percent);
  if (args.overrideLabel) return args.overrideLabel;
  const label = percentToLabel(args.percent, args.scale);
  if (!label || args.percent == null) return percentText;
  return `${percentText} · ${label}`;
}

export function labelFitsScale(
  label: string | null | undefined,
  scale: Pick<GradingScale, "mode" | "bands">,
): boolean {
  if (!label) return true;
  if (scale.mode === "none") return false;
  if (scale.mode === "pass_fail") return label === "Pass" || label === "Fail";
  return scale.bands.some((band) => band.label === label);
}

/**
 * Keep the override, but ask the teacher to confirm it after the scale changes
 * or when the saved label no longer matches the mode.
 */
export function finalOverrideNeedsConfirm(args: {
  overrideLabel: string | null;
  overriddenAt: string | null;
  scaleUpdatedAt: string | null;
  scale: Pick<GradingScale, "mode" | "bands">;
}): boolean {
  if (!args.overrideLabel) return false;
  if (!labelFitsScale(args.overrideLabel, args.scale)) return true;
  if (!args.overriddenAt || !args.scaleUpdatedAt) return false;
  return args.scaleUpdatedAt > args.overriddenAt;
}

export type ScaleDraftResult =
  | { ok: true; mode: GradingMode; passThreshold: number | null; bands: LetterBand[] }
  | { ok: false; error: string };

export function validateScaleDraft(input: {
  mode: GradingMode;
  passThreshold: string;
  bands: LetterBand[];
}): ScaleDraftResult {
  if (input.mode === "none") {
    return { ok: true, mode: "none", passThreshold: null, bands: [] };
  }
  if (input.mode === "pass_fail") {
    const value = Number(input.passThreshold);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return { ok: false, error: "Pass needs a percent from 0 to 100." };
    }
    return {
      ok: true,
      mode: "pass_fail",
      passThreshold: Math.round(value * 100) / 100,
      bands: [],
    };
  }
  if (input.bands.length === 0) {
    return { ok: false, error: "Add at least one letter, including a band that starts at 0." };
  }
  const labels = new Set<string>();
  const mins = new Set<number>();
  let seenZero = false;
  const bands: LetterBand[] = [];
  for (const band of input.bands) {
    const label = band.label.trim();
    if (!label || label.length > 24) {
      return { ok: false, error: "Each letter needs a short name." };
    }
    if (!Number.isFinite(band.minPercent) || band.minPercent < 0 || band.minPercent > 100) {
      return { ok: false, error: "Percents have to stay between 0 and 100." };
    }
    const minPercent = Math.round(band.minPercent * 100) / 100;
    if (labels.has(label)) {
      return { ok: false, error: "Letter names have to be different." };
    }
    if (mins.has(minPercent)) {
      return { ok: false, error: "Two letters can’t start at the same percent." };
    }
    if (minPercent === 0) seenZero = true;
    labels.add(label);
    mins.add(minPercent);
    bands.push({ label, minPercent });
  }
  if (!seenZero) {
    return { ok: false, error: "One letter has to start at 0 so every score has a name." };
  }
  return { ok: true, mode: "letter", passThreshold: null, bands };
}
