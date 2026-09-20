export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type ViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PopupAlign = "start" | "end" | "center";
export type PopupSide = "top" | "bottom";

export type PlacePopupInput = {
  trigger: Rect;
  popup: { width: number; height: number };
  viewport: ViewportRect;
  gap?: number;
  margin?: number;
  preferredSide?: PopupSide;
  preferredAlign?: PopupAlign;
};

export type PopupPlacement = {
  top: number;
  left: number;
  maxWidth: number;
  maxHeight: number;
  side: PopupSide;
  align: PopupAlign;
};

const DEFAULT_GAP = 8;
const DEFAULT_MARGIN = 8;

export function readViewportRect(): ViewportRect {
  const visual = window.visualViewport;
  if (!visual) {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return {
    left: visual.offsetLeft,
    top: visual.offsetTop,
    width: visual.width,
    height: visual.height,
  };
}

export function popupStyle(
  placement: PopupPlacement | null,
): {
  top: number;
  left: number;
  maxWidth?: number;
  maxHeight?: number;
  visibility?: "hidden";
} {
  if (!placement) {
    return {
      top: 0,
      left: 0,
      visibility: "hidden",
    };
  }
  return {
    top: placement.top,
    left: placement.left,
    maxWidth: placement.maxWidth,
    maxHeight: placement.maxHeight,
  };
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function horizontalOverflow(
  left: number,
  width: number,
  viewLeft: number,
  viewRight: number,
) {
  return Math.max(0, viewLeft - left) + Math.max(0, left + width - viewRight);
}

export function placePopup({
  trigger,
  popup,
  viewport,
  gap = DEFAULT_GAP,
  margin = DEFAULT_MARGIN,
  preferredSide = "bottom",
  preferredAlign,
}: PlacePopupInput): PopupPlacement {
  const viewLeft = viewport.left + margin;
  const viewTop = viewport.top + margin;
  const viewRight = viewport.left + viewport.width - margin;
  const viewBottom = viewport.top + viewport.height - margin;
  const viewWidth = Math.max(0, viewRight - viewLeft);
  const viewHeight = Math.max(0, viewBottom - viewTop);

  const maxWidth = viewWidth;
  const popupWidth = Math.min(Math.max(popup.width, 0), maxWidth);
  const triggerRight = trigger.left + trigger.width;
  const triggerBottom = trigger.top + trigger.height;
  const triggerCenterX = trigger.left + trigger.width / 2;

  let align: PopupAlign =
    preferredAlign ??
    (triggerCenterX < viewport.left + viewport.width / 2 ? "start" : "end");

  const startLeft = trigger.left;
  const endLeft = triggerRight - popupWidth;
  const centerLeft = triggerCenterX - popupWidth / 2;

  function leftFor(nextAlign: PopupAlign) {
    if (nextAlign === "start") return startLeft;
    if (nextAlign === "end") return endLeft;
    return centerLeft;
  }

  let left = leftFor(align);
  const candidates: PopupAlign[] =
    align === "center" ? ["center", "start", "end"] : [align, align === "start" ? "end" : "start"];
  let bestOverflow = horizontalOverflow(left, popupWidth, viewLeft, viewRight);
  for (const candidate of candidates) {
    const candidateLeft = leftFor(candidate);
    const overflow = horizontalOverflow(
      candidateLeft,
      popupWidth,
      viewLeft,
      viewRight,
    );
    if (overflow < bestOverflow) {
      bestOverflow = overflow;
      left = candidateLeft;
      align = candidate;
    }
  }
  left = clamp(left, viewLeft, viewRight - popupWidth);

  const spaceBelow = viewBottom - triggerBottom - gap;
  const spaceAbove = trigger.top - gap - viewTop;
  let side = preferredSide;
  const preferredSpace = side === "bottom" ? spaceBelow : spaceAbove;
  const otherSide: PopupSide = side === "bottom" ? "top" : "bottom";
  const otherSpace = otherSide === "bottom" ? spaceBelow : spaceAbove;
  const fitsPreferred = popup.height <= preferredSpace;
  if (!fitsPreferred && otherSpace > preferredSpace) {
    side = otherSide;
  }

  const available = side === "bottom" ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(0, Math.min(viewHeight, available));
  const height =
    maxHeight > 0
      ? Math.min(Math.max(popup.height, 0), maxHeight)
      : Math.min(Math.max(popup.height, 0), viewHeight);

  let top =
    side === "bottom" ? triggerBottom + gap : trigger.top - gap - height;
  if (maxHeight <= 0) {
    top = viewTop;
  } else {
    top = clamp(top, viewTop, viewBottom - height);
  }

  return {
    top,
    left,
    maxWidth,
    maxHeight: maxHeight > 0 ? maxHeight : viewHeight,
    side,
    align,
  };
}
