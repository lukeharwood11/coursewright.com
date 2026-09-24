import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LETTER_BAND_PRESETS,
  STARTER_LETTER_BANDS,
  finalOverrideNeedsConfirm,
  formatGradeDisplay,
  formatLetterBandRange,
  letterBandRanges,
  matchingLetterPresetId,
  percentOf,
  percentToLabel,
  unweightedMean,
  validateScaleDraft,
} from "./scale.ts";

const letter = {
  mode: "letter" as const,
  passThreshold: null,
  bands: STARTER_LETTER_BANDS,
};

test("new-org style none has no label", () => {
  assert.equal(percentToLabel(100, { mode: "none", passThreshold: null, bands: [] }), null);
  assert.equal(
    formatGradeDisplay({ percent: 88, scale: { mode: "none", passThreshold: null, bands: [] } }),
    "88%",
  );
});

test("pass is inclusive and fail is below the threshold", () => {
  const scale = { mode: "pass_fail" as const, passThreshold: 70, bands: [] };
  assert.equal(percentToLabel(70, scale), "Pass");
  assert.equal(percentToLabel(69.99, scale), "Fail");
});

test("an exact letter boundary uses the higher band", () => {
  assert.equal(percentToLabel(92, letter), "A");
  assert.equal(percentToLabel(84, letter), "B");
  assert.equal(percentToLabel(0, letter), "F");
  assert.equal(percentToLabel(91.99, letter), "B");
});

test("final is the unweighted mean of locked percents only", () => {
  assert.equal(unweightedMean([]), null);
  assert.equal(unweightedMean([80, 100]), 90);
  assert.equal(percentOf(0, 0), null);
  assert.equal(percentOf(1, 2), 50);
});

test("letter bands must cover zero without duplicate cuts", () => {
  const missing = validateScaleDraft({
    mode: "letter",
    passThreshold: "",
    bands: [{ label: "A", minPercent: 90 }],
  });
  assert.equal(missing.ok, false);

  const overlap = validateScaleDraft({
    mode: "letter",
    passThreshold: "",
    bands: [
      { label: "A", minPercent: 0 },
      { label: "B", minPercent: 0 },
    ],
  });
  assert.equal(overlap.ok, false);

  const ok = validateScaleDraft({
    mode: "letter",
    passThreshold: "",
    bands: STARTER_LETTER_BANDS,
  });
  assert.equal(ok.ok, true);
});

test("letter presets validate and cover zero", () => {
  assert.equal(LETTER_BAND_PRESETS.length, 3);
  for (const preset of LETTER_BAND_PRESETS) {
    const result = validateScaleDraft({
      mode: "letter",
      passThreshold: "",
      bands: preset.bands,
    });
    assert.equal(result.ok, true, preset.id);
    assert.equal(percentToLabel(100, { mode: "letter", passThreshold: null, bands: preset.bands }), preset.bands[0]?.label);
    assert.equal(percentToLabel(0, { mode: "letter", passThreshold: null, bands: preset.bands }), "F");
  }
});

test("letter band ranges are inclusive display cuts", () => {
  const ranges = letterBandRanges(STARTER_LETTER_BANDS);
  assert.deepEqual(
    ranges.map((range) => formatLetterBandRange(range)),
    ["A 92–100", "B 84–91", "C 76–83", "D 68–75", "F 0–67"],
  );
  assert.equal(matchingLetterPresetId(STARTER_LETTER_BANDS), "classic_abcdf");
  assert.equal(
    matchingLetterPresetId([
      { label: "A", minPercent: 90 },
      { label: "F", minPercent: 0 },
    ]),
    null,
  );
});

test("a final override stays but asks for confirmation after the scale changes", () => {
  assert.equal(
    finalOverrideNeedsConfirm({
      overrideLabel: "A",
      overriddenAt: "2026-01-01T00:00:00Z",
      scaleUpdatedAt: "2026-02-01T00:00:00Z",
      scale: letter,
    }),
    true,
  );
  assert.equal(
    finalOverrideNeedsConfirm({
      overrideLabel: "A",
      overriddenAt: "2026-03-01T00:00:00Z",
      scaleUpdatedAt: "2026-02-01T00:00:00Z",
      scale: letter,
    }),
    false,
  );
  assert.equal(
    finalOverrideNeedsConfirm({
      overrideLabel: "A",
      overriddenAt: "2026-03-01T00:00:00Z",
      scaleUpdatedAt: "2026-01-01T00:00:00Z",
      scale: { mode: "pass_fail", passThreshold: 60, bands: [] },
    }),
    true,
  );
});
