import { useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  EllipsisHorizontalIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  PrinterIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSidebarStore } from "@/app/layouts/stores/sidebar";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { Button } from "@/ui/Button";

const iconButtonClass = "max-md:!px-2.5 max-md:!py-2 max-md:shrink-0";

const menuItemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

type SelectionActionItem = {
  id: string;
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
};

export function ResourceSelectionBar({
  count,
  canMove,
  canRemove,
  canPublish,
  canPrint,
  canDownload,
  pending,
  downloadPending,
  onClear,
  onMove,
  onRemove,
  onPublish,
  onUnpublish,
  onPrint,
  onDownload,
}: {
  count: number;
  canMove: boolean;
  canRemove: boolean;
  canPublish: boolean;
  canPrint: boolean;
  canDownload: boolean;
  pending: boolean;
  downloadPending: boolean;
  onClear: () => void;
  onMove: () => void;
  onRemove: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onPrint: () => void;
  onDownload: () => void;
}) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  if (count === 0) return null;

  const downloadLabel = downloadPending ? "Preparing download…" : "Download";
  const publish = canPublish
    ? action("publish", "Publish", <GlobeAltIcon className="h-5 w-5" aria-hidden />, pending, onPublish)
    : null;
  const unpublish = canPublish
    ? action(
        "unpublish",
        "Unpublish",
        <EyeSlashIcon className="h-5 w-5" aria-hidden />,
        pending,
        onUnpublish,
      )
    : null;
  const print = canPrint
    ? action("print", "Print", <PrinterIcon className="h-5 w-5" aria-hidden />, pending, onPrint)
    : null;
  const download = canDownload
    ? action(
        "download",
        downloadLabel,
        <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />,
        pending || downloadPending,
        onDownload,
      )
    : null;
  const move = canMove
    ? action("move", "Move", <ArrowRightIcon className="h-5 w-5" aria-hidden />, pending, onMove)
    : null;
  const remove = canRemove
    ? action("remove", "Remove", <TrashIcon className="h-5 w-5" aria-hidden />, pending, onRemove)
    : null;
  const clear = action(
    "clear",
    "Clear",
    <XMarkIcon className="h-5 w-5 md:hidden" aria-hidden />,
    pending,
    onClear,
  );

  const desktop = [publish, unpublish, print, download, move, remove, clear].filter(
    (item): item is SelectionActionItem => item != null,
  );
  const mobilePrimary = [download, print, remove].filter(
    (item): item is SelectionActionItem => item != null,
  );
  const mobileMore = [publish, unpublish, move, clear].filter(
    (item): item is SelectionActionItem => item != null,
  );

  return (
    <div
      className={[
        "pointer-events-none fixed z-30 flex",
        "inset-x-0 bottom-0 justify-stretch pb-[env(safe-area-inset-bottom)]",
        "md:bottom-4 md:justify-center md:pb-0 md:pr-4",
        collapsed ? "md:left-[4.25rem] md:pl-20" : "md:left-[16.5rem] md:pl-20",
      ].join(" ")}
    >
      <section className="pointer-events-auto w-full border-t border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[0_-8px_24px_rgba(28,25,23,0.08)] md:w-auto md:max-w-full md:rounded-[12px] md:border md:px-3 md:shadow-[var(--shadow)]">
        <div className="flex items-center gap-2">
          <p className="mr-auto shrink-0 text-[14px] font-extrabold text-[var(--ink)]">
            {count === 1 ? "1 selected" : `${count} selected`}
          </p>
          <div className="hidden items-center gap-2 md:flex">
            {desktop.map((item) => (
              <SelectionAction key={item.id} item={item} />
            ))}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {mobilePrimary.map((item) => (
              <SelectionAction key={item.id} item={item} compact />
            ))}
            {mobileMore.length > 0 ? (
              <SelectionMoreMenu items={mobileMore} pending={pending} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function action(
  id: string,
  label: string,
  icon: ReactNode,
  disabled: boolean,
  onClick: () => void,
): SelectionActionItem {
  return { id, label, icon, disabled, onClick };
}

function SelectionAction({
  item,
  compact = false,
}: {
  item: SelectionActionItem;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={compact ? iconButtonClass : undefined}
      disabled={item.disabled}
      aria-label={item.label}
      onClick={item.onClick}
    >
      {item.icon}
      <span className={compact ? "sr-only" : undefined}>{item.label}</span>
    </Button>
  );
}

function SelectionMoreMenu({
  items,
  pending,
}: {
  items: SelectionActionItem[];
  pending: boolean;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant="secondary"
        className={iconButtonClass}
        disabled={pending}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </Button>
      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label="More actions"
        preferredSide="top"
        preferredAlign="end"
        className="min-w-[11rem]"
      >
        <div className="py-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={menuItemClassName}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </AnchoredPopup>
    </>
  );
}
