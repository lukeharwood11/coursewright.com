import assert from "node:assert/strict";
import { test } from "node:test";
import { placePopup, type Rect, type ViewportRect } from "./popupPosition.ts";

const phone: ViewportRect = { left: 0, top: 0, width: 390, height: 844 };

function box(
  left: number,
  top: number,
  width: number,
  height: number,
): Rect {
  return { left, top, width, height };
}

function inFrame(
  placement: { top: number; left: number; maxWidth: number; maxHeight: number },
  viewport: ViewportRect,
  popup: { width: number; height: number },
  margin = 8,
) {
  const width = Math.min(popup.width, placement.maxWidth);
  const height = Math.min(popup.height, placement.maxHeight);
  assert.ok(placement.left >= viewport.left + margin - 0.5);
  assert.ok(placement.top >= viewport.top + margin - 0.5);
  assert.ok(
    placement.left + width <= viewport.left + viewport.width - margin + 0.5,
  );
  assert.ok(
    placement.top + height <= viewport.top + viewport.height - margin + 0.5,
  );
}

test("left-edge trigger opens to the right and stays on screen", () => {
  const popup = { width: 264, height: 280 };
  const placement = placePopup({
    trigger: box(16, 96, 28, 28),
    popup,
    viewport: phone,
  });
  assert.equal(placement.align, "start");
  assert.equal(placement.side, "bottom");
  assert.ok(placement.left >= 8);
  assert.ok(placement.left + Math.min(popup.width, placement.maxWidth) <= 382);
  inFrame(placement, phone, popup);
});

test("right-edge trigger opens to the left and stays on screen", () => {
  const popup = { width: 320, height: 220 };
  const placement = placePopup({
    trigger: box(350, 96, 28, 28),
    popup,
    viewport: phone,
  });
  assert.equal(placement.align, "end");
  inFrame(placement, phone, popup);
});

test("preferred end-align on the left flips so the menu stays visible", () => {
  const popup = { width: 264, height: 180 };
  const placement = placePopup({
    trigger: box(12, 80, 28, 28),
    popup,
    viewport: phone,
    preferredAlign: "end",
  });
  assert.equal(placement.align, "start");
  inFrame(placement, phone, popup);
});

test("bottom-edge trigger opens upward", () => {
  const popup = { width: 200, height: 180 };
  const placement = placePopup({
    trigger: box(180, 800, 32, 32),
    popup,
    viewport: phone,
  });
  assert.equal(placement.side, "top");
  assert.ok(placement.top + Math.min(popup.height, placement.maxHeight) <= 800);
  inFrame(placement, phone, popup);
});

test("top-edge trigger stays below the button", () => {
  const popup = { width: 200, height: 180 };
  const placement = placePopup({
    trigger: box(180, 12, 32, 32),
    popup,
    viewport: phone,
    preferredSide: "top",
  });
  assert.equal(placement.side, "bottom");
  inFrame(placement, phone, popup);
});

test("menu wider than the viewport is clamped to the frame", () => {
  const popup = { width: 480, height: 120 };
  const placement = placePopup({
    trigger: box(16, 80, 28, 28),
    popup,
    viewport: phone,
  });
  assert.equal(placement.left, 8);
  assert.equal(placement.maxWidth, 374);
  inFrame(placement, phone, popup);
});

test("tall menu near the bottom gets a max height and stays in frame", () => {
  const popup = { width: 220, height: 600 };
  const placement = placePopup({
    trigger: box(40, 700, 32, 32),
    popup,
    viewport: phone,
  });
  assert.equal(placement.side, "top");
  assert.ok(placement.maxHeight <= 700 - 8 - 8);
  inFrame(placement, phone, popup);
});

test("center align stays on screen at the right edge", () => {
  const popup = { width: 180, height: 40 };
  const placement = placePopup({
    trigger: box(360, 200, 20, 20),
    popup,
    viewport: phone,
    preferredAlign: "center",
    preferredSide: "top",
  });
  assert.ok(placement.left + Math.min(popup.width, placement.maxWidth) <= 382);
  inFrame(placement, phone, popup);
});

test("visual viewport offset is respected", () => {
  const viewport: ViewportRect = { left: 40, top: 80, width: 300, height: 400 };
  const popup = { width: 220, height: 160 };
  const placement = placePopup({
    trigger: box(48, 100, 28, 28),
    popup,
    viewport,
  });
  inFrame(placement, viewport, popup);
});
