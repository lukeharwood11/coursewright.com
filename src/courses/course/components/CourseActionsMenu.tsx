import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  MegaphoneIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { newDiscussionPath } from "@/discussions/model/paths";
import { courseSettingsPath, newCourseFromPath } from "@/courses/model/paths";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

const triggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

function MenuSeparator() {
  return (
    <div
      className="my-1 border-t border-[var(--line-soft)]"
      role="separator"
      aria-hidden
    />
  );
}

export function CourseActionsMenu({
  orgSlug,
  courseId,
  canEdit,
  isParent,
  onShare,
  onShowDetails,
  className,
}: {
  orgSlug: string;
  courseId: number;
  canEdit: boolean;
  isParent: boolean;
  onShare: () => void;
  onShowDetails: () => void;
  className?: string;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const showDiscussion = canEdit || isParent;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={[triggerClassName, className ?? ""].filter(Boolean).join(" ")}
        aria-label="Course actions"
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
        label="Course actions"
        className="min-w-[11rem]"
      >
        <div className="py-1">
          {showDiscussion ? (
            <Link
              role="menuitem"
              to={newDiscussionPath(orgSlug, {
                audience: "course",
                courseId,
              })}
              className={`${itemClassName} hidden max-[674px]:flex`}
              onClick={() => setOpen(false)}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0" aria-hidden />
              Start a discussion
            </Link>
          ) : null}
          {canEdit ? (
            <Link
              role="menuitem"
              to={newAnnouncementPath(orgSlug, {
                audience: "course",
                courseId,
              })}
              className={`${itemClassName} hidden max-[674px]:flex`}
              onClick={() => setOpen(false)}
            >
              <MegaphoneIcon className="h-4 w-4 shrink-0" aria-hidden />
              Create Announcement
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              onShare();
            }}
          >
            <ShareIcon className="h-4 w-4 shrink-0" aria-hidden />
            Share
          </button>
          {canEdit ? (
            <Link
              role="menuitem"
              to={newCourseFromPath(orgSlug, courseId)}
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              <DocumentDuplicateIcon className="h-4 w-4 shrink-0" aria-hidden />
              Duplicate
            </Link>
          ) : null}
        </div>
        <MenuSeparator />
        <div className="py-1">
          {canEdit ? (
            <Link
              role="menuitem"
              to={courseSettingsPath(orgSlug, courseId)}
              className={`${itemClassName} xl:hidden`}
              onClick={() => setOpen(false)}
            >
              <Cog6ToothIcon className="h-4 w-4 shrink-0" aria-hidden />
              Settings
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              onShowDetails();
            }}
          >
            <InformationCircleIcon className="h-4 w-4 shrink-0" aria-hidden />
            Details
          </button>
        </div>
      </AnchoredPopup>
    </>
  );
}
