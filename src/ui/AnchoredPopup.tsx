import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  placePopup,
  popupStyle,
  readViewportRect,
  type PopupAlign,
  type PopupPlacement,
  type PopupSide,
  type Rect,
} from "./popupPosition";

export { placePopup, popupStyle, readViewportRect };
export type { PopupAlign, PopupPlacement, PopupSide, Rect };

const PANEL_CLASS =
  "fixed z-50 overflow-auto rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)]";

function rectFromDom(element: Element): Rect {
  const box = element.getBoundingClientRect();
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}

export function usePopupPlacement({
  open,
  popupRef,
  anchorRef,
  anchorRect,
  preferredAlign,
  preferredSide,
  gap,
}: {
  open: boolean;
  popupRef: RefObject<HTMLElement | null>;
  anchorRef?: RefObject<Element | null>;
  anchorRect?: Rect | null;
  preferredAlign?: PopupAlign;
  preferredSide?: PopupSide;
  gap?: number;
}): PopupPlacement | null {
  const [placement, setPlacement] = useState<PopupPlacement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    function place() {
      const popup = popupRef.current;
      const trigger =
        anchorRect ??
        (anchorRef?.current ? rectFromDom(anchorRef.current) : null);
      if (!popup || !trigger) return;
      setPlacement(
        placePopup({
          trigger,
          popup: { width: popup.offsetWidth, height: popup.offsetHeight },
          viewport: readViewportRect(),
          preferredAlign,
          preferredSide,
          gap,
        }),
      );
    }

    place();
    const popup = popupRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    if (popup) observer?.observe(popup);
    const anchor = anchorRef?.current;
    if (anchor) observer?.observe(anchor);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [
    open,
    popupRef,
    anchorRef,
    anchorRect,
    preferredAlign,
    preferredSide,
    gap,
  ]);

  return placement;
}

type AnchoredPopupProps = {
  open: boolean;
  onClose?: () => void;
  dismiss?: boolean;
  anchorRef?: RefObject<Element | null>;
  anchorRect?: Rect | null;
  id?: string;
  role?: "menu" | "listbox" | "tooltip" | "dialog";
  label?: string;
  preferredAlign?: PopupAlign;
  preferredSide?: PopupSide;
  gap?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function AnchoredPopup({
  open,
  onClose,
  dismiss = true,
  anchorRef,
  anchorRect,
  id,
  role = "menu",
  label,
  preferredAlign,
  preferredSide,
  gap,
  className,
  style,
  children,
}: AnchoredPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const placement = usePopupPlacement({
    open,
    popupRef,
    anchorRef,
    anchorRect,
    preferredAlign,
    preferredSide,
    gap,
  });

  useEffect(() => {
    if (!open || !dismiss) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popupRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      onClose?.();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismiss, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  const placed = popupStyle(placement);

  return createPortal(
    <div
      ref={popupRef}
      id={id}
      role={role}
      aria-label={label}
      className={[PANEL_CLASS, className ?? ""].filter(Boolean).join(" ")}
      style={{ ...placed, ...style }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function TypeaheadPopup({
  anchor,
  children,
  className,
  role = "listbox",
  label,
}: {
  anchor: HTMLElement;
  children: ReactNode;
  className?: string;
  role?: "menu" | "listbox" | "tooltip" | "dialog";
  label?: string;
}) {
  const [rect, setRect] = useState(() => rectFromDom(anchor));

  useLayoutEffect(() => {
    function update() {
      const next = rectFromDom(anchor);
      setRect((current) =>
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width &&
        current.height === next.height
          ? current
          : next,
      );
    }

    update();
    const observer = new MutationObserver(update);
    observer.observe(anchor, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchor]);

  return (
    <AnchoredPopup
      open
      dismiss={false}
      anchorRect={rect}
      role={role}
      label={label}
      preferredAlign="start"
      className={className}
    >
      {children}
    </AnchoredPopup>
  );
}
