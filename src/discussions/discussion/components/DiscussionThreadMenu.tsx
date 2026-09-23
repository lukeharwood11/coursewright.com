import { useId, useRef, useState } from "react";
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { UserCard } from "@/organizations/user-card/UserCard";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

const triggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

export function DiscussionThreadMenu({
  orgSlug,
  starterUserId,
  starterName,
  startedLabel,
  onMembers,
  answered,
  onMarkAnswered,
  markAnsweredPending = false,
  onDelete,
  className,
}: {
  orgSlug: string;
  starterUserId: string;
  starterName: string;
  /** e.g. "Started Mar 5" — plain note, not a link. */
  startedLabel: string;
  onMembers: () => void;
  answered?: boolean;
  onMarkAnswered?: () => void;
  markAnsweredPending?: boolean;
  onDelete?: () => void;
  className?: string;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const showOverflowActions = onMarkAnswered != null || onDelete != null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={[triggerClassName, className ?? ""].filter(Boolean).join(" ")}
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
        className="min-w-[15rem]"
      >
        <div className="border-b border-[var(--line-soft)] px-3.5 py-2.5">
          <p className="text-[11.5px] font-bold text-[var(--ink-faint)]">
            Started by
          </p>
          <div className="mt-1.5">
            <UserCard
              orgSlug={orgSlug}
              userId={starterUserId}
              name={starterName}
              compact
            />
          </div>
          {startedLabel ? (
            <p className="mt-1.5 text-[12px] font-semibold text-[var(--ink-faint)]">
              {startedLabel}
            </p>
          ) : null}
        </div>
        {showOverflowActions ? (
          <div className="border-b border-[var(--line-soft)] py-1">
            {onMarkAnswered ? (
              <button
                type="button"
                role="menuitem"
                className={`${itemClassName} xl:hidden`}
                disabled={markAnsweredPending}
                onClick={() => {
                  setOpen(false);
                  onMarkAnswered();
                }}
              >
                {answered ? (
                  <ArrowUturnLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {answered ? "Mark as open" : "Mark as answered"}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[#C44536] hover:bg-[#C44536]/10 hover:text-[#A3382C] focus-visible:bg-[#C44536]/10 focus-visible:outline-none"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
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
