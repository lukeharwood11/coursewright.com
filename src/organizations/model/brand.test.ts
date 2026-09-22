import assert from "node:assert/strict";
import { test } from "node:test";
import { canManageBranding } from "./role.ts";
import {
  brandIconObjectPath,
  brandIconPublicUrl,
  chromeAccentFromHex,
  contrastRatio,
  parseAccentHex,
  validateAccentInput,
  validateBrandIcon,
} from "./brand.ts";

test("parseAccentHex accepts a 6-digit color and lowercases it", () => {
  assert.equal(parseAccentHex("#33604D"), "#33604d");
  assert.equal(parseAccentHex("33604d"), "#33604d");
  assert.equal(parseAccentHex("#fff"), null);
  assert.equal(parseAccentHex("green"), null);
  assert.equal(parseAccentHex(""), null);
});

test("chrome accent keeps white text readable and derives a darker hover", () => {
  const chrome = chromeAccentFromHex("#33604d");
  assert.ok(chrome);
  assert.equal(chrome.accent, "#33604d");
  assert.ok(contrastRatio("#ffffff", chrome.accent)! >= 4.5);
  assert.ok(contrastRatio(chrome.deep, chrome.tint)! >= 4.5);

  const black = chromeAccentFromHex("#000000");
  assert.ok(black);
  assert.ok(contrastRatio(black.deep, black.tint)! >= 4.5);
});

test("chrome accent rejects colors that are too light for white text", () => {
  assert.equal(chromeAccentFromHex("#ffffff"), null);
  assert.equal(chromeAccentFromHex("#eeeeee"), null);
  assert.equal(chromeAccentFromHex("#ffcc00"), null);
  const rejected = validateAccentInput("#ffcc00");
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.error, "Choose a darker color so white text stays readable.");
  }
});

test("validateAccentInput treats a blank field as clearing the color", () => {
  const cleared = validateAccentInput("  ");
  assert.deepEqual(cleared, { ok: true, value: null });
  const invalid = validateAccentInput("blue");
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.error, "Enter a color like #33604D.");
});

test("validateBrandIcon allows a small png and rejects other files", () => {
  assert.deepEqual(validateBrandIcon({ type: "image/png", size: 1200 }), {
    ok: true,
    extension: "png",
  });
  assert.deepEqual(validateBrandIcon({ type: "image/jpeg", size: 1200 }), {
    ok: true,
    extension: "jpg",
  });
  const svg = validateBrandIcon({ type: "image/svg+xml", size: 100 });
  assert.equal(svg.ok, false);
  const huge = validateBrandIcon({ type: "image/webp", size: 256 * 1024 + 1 });
  assert.equal(huge.ok, false);
  if (!huge.ok) {
    assert.match(huge.error, /256 KB/);
  }
});

test("brand icon path and public url stay stable", () => {
  assert.equal(brandIconObjectPath(12, "png"), "12/icon.png");
  assert.equal(
    brandIconPublicUrl("https://example.supabase.co/", "12/icon.png", "2026-09-22T00:00:00.000Z"),
    "https://example.supabase.co/storage/v1/object/public/org-brand/12/icon.png?v=2026-09-22T00%3A00%3A00.000Z",
  );
});

test("only owners can manage branding", () => {
  assert.equal(canManageBranding("owner"), true);
  assert.equal(canManageBranding("admin"), false);
  assert.equal(canManageBranding("instructor"), false);
  assert.equal(canManageBranding("parent"), false);
});
