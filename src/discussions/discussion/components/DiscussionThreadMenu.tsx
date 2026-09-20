import { useId, useRef, useState } from "react";
import {
  EllipsisHorizontalIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

export function DiscussionThreadMenu({
  onMembers,
}: {
  onMembers: () => void;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
        aria-label="Discussion actions"
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
        label="Discussion actions"
        className="min-w-[11rem]"
      >
        <div className="py-1">
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              onMembers();
            }}
          >
            <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden />
            Members
          </button>
        </div>
      </AnchoredPopup>
    </>
  );
}
