import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  PrinterIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import {
  resourceItemEditPath,
  resourceItemPrintPath,
} from "@/resources/model/paths";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

const triggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

export function ResourceActionsMenu({
  orgSlug,
  itemId,
  itemType,
  isStaff,
  onMove,
  onAccess,
  onRemove,
  className,
}: {
  orgSlug: string;
  itemId: number;
  itemType: "document" | "link" | "file";
  isStaff: boolean;
  onMove: () => void;
  onAccess: () => void;
  onRemove: () => void;
  className?: string;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const canPrint = itemType !== "link";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={[triggerClassName, className ?? ""].filter(Boolean).join(" ")}
        aria-label="Resource actions"
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
        label="Resource actions"
        className="min-w-[11rem]"
      >
        <div className="py-1">
          {canPrint ? (
            <Link
              role="menuitem"
              to={resourceItemPrintPath(orgSlug, itemId)}
              className={`${itemClassName} xl:hidden`}
              onClick={() => setOpen(false)}
            >
              <PrinterIcon className="h-4 w-4 shrink-0" aria-hidden />
              Print
            </Link>
          ) : null}
          <Link
            role="menuitem"
            to={resourceItemEditPath(orgSlug, itemId)}
            className={`${itemClassName} xl:hidden`}
            onClick={() => setOpen(false)}
          >
            <PencilSquareIcon className="h-4 w-4 shrink-0" aria-hidden />
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              onMove();
            }}
          >
            <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden />
            Move
          </button>
          {isStaff ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => {
                setOpen(false);
                onAccess();
              }}
            >
              <Cog6ToothIcon className="h-4 w-4 shrink-0" aria-hidden />
              Manage access
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={`${itemClassName} text-[var(--amber-deep)]`}
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
            Remove
          </button>
        </div>
      </AnchoredPopup>
    </>
  );
}
