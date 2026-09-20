import { useId, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { ActivityMenuPanel } from "./components/ActivityMenuPanel";
import { useActivityMenu } from "./hooks/useActivityMenu";

export function ActivityMenu() {
  const menu = useActivityMenu();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  if (!menu.visible) return null;

  const unreadLabel =
    menu.unreadCount > 99 ? "99+" : String(menu.unreadCount);
  const ariaLabel =
    menu.unreadCount > 0
      ? `Activity, ${menu.unreadCount} unread`
      : "Activity";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="relative cursor-pointer rounded-[6px] p-1.5 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon className="h-6 w-6" aria-hidden />
        {menu.unreadCount > 0 ? (
          <span
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C44536] px-0.5 text-[9px] font-extrabold leading-none text-white"
            aria-hidden
          >
            {unreadLabel}
          </span>
        ) : null}
      </button>

      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label="Activity"
        className="w-[20rem]"
      >
        <ActivityMenuPanel
          preview={menu.preview}
          remainingUnread={menu.remainingUnread}
          loading={menu.loading}
          error={menu.error}
          openingId={menu.openingId}
          activityHref={menu.activityHref}
          onOpen={(item) => {
            setOpen(false);
            menu.onOpen(item);
          }}
          onViewAll={() => setOpen(false)}
        />
      </AnchoredPopup>
    </>
  );
}
