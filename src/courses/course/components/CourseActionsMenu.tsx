import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className="relative">
      <Button
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

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Course actions"
          className="absolute right-0 z-20 mt-2 min-w-[11rem] overflow-hidden rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)]"
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
        </div>
      ) : null}
    </div>
  );
}
