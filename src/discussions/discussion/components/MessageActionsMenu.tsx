import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup, type Rect } from "@/ui/AnchoredPopup";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

const dangerItemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[#C44536] hover:bg-[#C44536]/10 hover:text-[#A3382C] focus-visible:bg-[#C44536]/10 focus-visible:outline-none";

function pointRect(clientX: number, clientY: number): Rect {
  return { top: clientY, left: clientX, width: 0, height: 0 };
}

export function useMessageActionsMenu() {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);

  function close() {
    setOpen(false);
    setAnchorRect(null);
  }

  function openFromContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setAnchorRect(pointRect(event.clientX, event.clientY));
    setOpen(true);
  }

  function openFromTrigger() {
    setAnchorRect(null);
    setOpen((value) => !value);
  }

  return {
    open,
    anchorRect,
    close,
    openFromContextMenu,
    openFromTrigger,
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
  onTriggerClick,
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
  onTriggerClick: () => void;
  /** When set (right-click), menu anchors to the pointer; otherwise to the mobile ⋯ button. */
  anchorRect: Rect | null;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="rounded-[6px] p-1.5 text-[var(--ink-faint)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] md:hidden"
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onTriggerClick}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>

      <AnchoredPopup
        open={open}
        onClose={onClose}
        anchorRef={anchorRect ? undefined : buttonRef}
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
    </>
  );
}
