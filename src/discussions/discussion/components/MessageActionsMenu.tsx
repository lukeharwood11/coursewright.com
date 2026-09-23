import { useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup, type Rect } from "@/ui/AnchoredPopup";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

const dangerItemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[#C44536] hover:bg-[#C44536]/10 hover:text-[#A3382C] focus-visible:bg-[#C44536]/10 focus-visible:outline-none";

const LONG_PRESS_MS = 480;
const MOVE_CANCEL_PX = 12;

function pointRect(clientX: number, clientY: number): Rect {
  return { top: clientY, left: clientX, width: 0, height: 0 };
}

export function useMessageActionsMenu() {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const pressRef = useRef<{
    timer: number | null;
    x: number;
    y: number;
    opened: boolean;
  }>({ timer: null, x: 0, y: 0, opened: false });

  function close() {
    setOpen(false);
    setAnchorRect(null);
  }

  function openAt(clientX: number, clientY: number) {
    setAnchorRect(pointRect(clientX, clientY));
    setOpen(true);
  }

  function clearPressTimer() {
    const press = pressRef.current;
    if (press.timer != null) {
      window.clearTimeout(press.timer);
      press.timer = null;
    }
  }

  function openFromContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    clearPressTimer();
    pressRef.current.opened = false;
    openAt(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    // Mouse left-click stays a normal click; right-click uses contextmenu.
    if (event.pointerType === "mouse") return;
    if (!event.isPrimary) return;

    clearPressTimer();
    const x = event.clientX;
    const y = event.clientY;
    pressRef.current = {
      x,
      y,
      opened: false,
      timer: window.setTimeout(() => {
        pressRef.current.timer = null;
        pressRef.current.opened = true;
        openAt(x, y);
        try {
          navigator.vibrate?.(8);
        } catch {
          // Vibration is optional (PWAs / some Android browsers).
        }
      }, LONG_PRESS_MS),
    };
  }

  function onPointerMove(event: PointerEvent) {
    const press = pressRef.current;
    if (press.timer == null) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      clearPressTimer();
    }
  }

  function onPointerUp() {
    clearPressTimer();
    if (!pressRef.current.opened) return;
    pressRef.current.opened = false;
    // Swallow the click that browsers synthesize after a long-press.
    const suppressClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", suppressClick, {
      capture: true,
      once: true,
    });
    window.setTimeout(() => {
      document.removeEventListener("click", suppressClick, {
        capture: true,
      });
    }, 400);
  }

  function onPointerCancel() {
    clearPressTimer();
    pressRef.current.opened = false;
  }

  useEffect(() => {
    return () => clearPressTimer();
  }, []);

  return {
    open,
    anchorRect,
    close,
    openFromContextMenu,
    longPressHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}

export function MessageActionsMenu({
  canEdit,
  canQuote,
  canRemove,
  onEdit,
  onQuote,
  onCopyLink,
  onRemove,
  open,
  onClose,
  anchorRect,
}: {
  canEdit: boolean;
  canQuote: boolean;
  canRemove: boolean;
  onEdit: () => void;
  onQuote: () => void;
  onCopyLink: () => void;
  onRemove: () => void;
  open: boolean;
  onClose: () => void;
  anchorRect: Rect | null;
}) {
  const menuId = useId();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <AnchoredPopup
      open={open && anchorRect != null}
      onClose={onClose}
      anchorRect={anchorRect}
      id={menuId}
      label="Message actions"
      preferredAlign="start"
      preferredSide="bottom"
      gap={4}
      className="min-w-[12rem]"
    >
      <div className="py-1">
        {canEdit ? (
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              onClose();
              onEdit();
            }}
          >
            <PencilSquareIcon className="h-4 w-4 shrink-0" aria-hidden />
            Edit
          </button>
        ) : null}
        {canQuote ? (
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              onClose();
              onQuote();
            }}
          >
            <ChatBubbleBottomCenterTextIcon
              className="h-4 w-4 shrink-0"
              aria-hidden
            />
            Quote message
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={itemClassName}
          onClick={() => {
            onCopyLink();
            setCopied(true);
            onClose();
          }}
        >
          <LinkIcon className="h-4 w-4 shrink-0" aria-hidden />
          {copied ? "Copied" : "Copy link"}
        </button>
        {canRemove ? (
          <button
            type="button"
            role="menuitem"
            className={dangerItemClassName}
            onClick={() => {
              onClose();
              onRemove();
            }}
          >
            <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
            Delete
          </button>
        ) : null}
      </div>
    </AnchoredPopup>
  );
}
