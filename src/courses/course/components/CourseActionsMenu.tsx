import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { Button } from "@/ui/Button";
import { newCourseFromPath } from "@/courses/model/paths";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

export function CourseActionsMenu({
  orgSlug,
  courseId,
  canDuplicate,
  onShare,
}: {
  orgSlug: string;
  courseId: number;
  canDuplicate: boolean;
  onShare: () => void;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        aria-label="More course actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
        More
      </Button>

      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label="Course actions"
        className="min-w-[11rem]"
      >
        <div className="py-1">
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
          {canDuplicate ? (
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
      </AnchoredPopup>
    </>
  );
}
