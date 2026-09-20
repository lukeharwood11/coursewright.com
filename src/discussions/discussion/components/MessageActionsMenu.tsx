import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

type MenuPosition = { top: number; left: number };

export function MessageActionsMenu({
  canEdit,
  canQuote,
  onEdit,
  onQuote,
  onCopyLink,
}: {
  canEdit: boolean;
  canQuote: boolean;
  onEdit: () => void;
  onQuote: () => void;
  onCopyLink: () => void;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    function place() {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth ?? 192;
      const menuHeight = menu?.offsetHeight ?? 88;
      const gap = 4;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
      const top = openUp
        ? Math.max(8, rect.top - menuHeight - gap)
        : rect.bottom + gap;
      const left = Math.min(
        window.innerWidth - menuWidth - 8,
        Math.max(8, rect.right - menuWidth),
      );
      setPosition({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
        className="rounded-[6px] p-1.5 text-[var(--ink-faint)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Message actions"
              className="fixed z-50 min-w-[12rem] overflow-hidden rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)]"
              style={
                position
                  ? { top: position.top, left: position.left }
                  : { visibility: "hidden", top: 0, left: 0 }
              }
            >
              <div className="py-1">
                {canEdit ? (
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClassName}
                    onClick={() => {
                      setOpen(false);
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
                      setOpen(false);
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
                    setOpen(false);
                  }}
                >
                  <LinkIcon className="h-4 w-4 shrink-0" aria-hidden />
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
