import { useEffect, useId, useRef, useState } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

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
  const [open, setOpen] = useState(false);
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
        className="rounded-[6px] p-1.5 text-[var(--ink-faint)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>

      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label="Message actions"
        className="min-w-[12rem]"
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
      </AnchoredPopup>
    </>
  );
}
