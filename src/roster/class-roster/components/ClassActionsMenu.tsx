import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  EllipsisHorizontalIcon,
  MegaphoneIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { newDiscussionPath } from "@/discussions/model/paths";
import { newEventPath } from "@/events/model/paths";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

const triggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

export function ClassActionsMenu({
  orgSlug,
  classId,
  canEdit,
  className,
}: {
  orgSlug: string;
  classId: number;
  canEdit: boolean;
  className?: string;
}) {
  const { organization } = useOrgShell();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const showDiscussions = organization.features.discussions;
  const showAnnouncements = organization.features.announcements;
  const showEvents = organization.features.events;

  if (!canEdit || (!showDiscussions && !showAnnouncements && !showEvents)) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={[triggerClassName, className ?? ""].filter(Boolean).join(" ")}
        aria-label="Class actions"
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
        label="Class actions"
        className="min-w-[11rem]"
      >
        <div className="py-1">
          {showDiscussions ? (
            <Link
              role="menuitem"
              to={newDiscussionPath(orgSlug, {
                audience: "class",
                classId,
              })}
              className={`${itemClassName} xl:hidden`}
              onClick={() => setOpen(false)}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0" aria-hidden />
              Start a discussion
            </Link>
          ) : null}
          {showAnnouncements ? (
            <Link
              role="menuitem"
              to={newAnnouncementPath(orgSlug, {
                audience: "class",
                classId,
              })}
              className={`${itemClassName} xl:hidden`}
              onClick={() => setOpen(false)}
            >
              <MegaphoneIcon className="h-4 w-4 shrink-0" aria-hidden />
              Create Announcement
            </Link>
          ) : null}
          {showEvents ? (
            <Link
              role="menuitem"
              to={newEventPath(orgSlug, { audience: "class", classId })}
              className={`${itemClassName} xl:hidden`}
              onClick={() => setOpen(false)}
            >
              <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
              Add event
            </Link>
          ) : null}
        </div>
      </AnchoredPopup>
    </>
  );
}
