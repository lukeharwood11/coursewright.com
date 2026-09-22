import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { AnchoredPopup, type Rect } from "@/ui/AnchoredPopup";

export type ResourceMenuEntry = {
  id: string;
  label: string;
  icon?: ReactNode;
  separatorBefore?: boolean;
  onSelect: () => void;
};

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

export function pointRect(clientX: number, clientY: number): Rect {
  return { top: clientY, left: clientX, width: 0, height: 0 };
}

export function ResourceContextMenu({
  open,
  label,
  items,
  onClose,
  anchorRef,
  anchorRect,
  id,
}: {
  open: boolean;
  label: string;
  items: ResourceMenuEntry[];
  onClose: () => void;
  anchorRef?: RefObject<Element | null>;
  anchorRect?: Rect | null;
  id?: string;
}) {
  const generatedId = useId();
  const menuId = id ?? generatedId;
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
  }, [open]);

  return (
    <AnchoredPopup
      open={open && items.length > 0}
      onClose={onClose}
      anchorRef={anchorRef}
      anchorRect={anchorRect}
      id={menuId}
      label={label}
      preferredAlign="start"
      preferredSide="bottom"
      gap={4}
      className="min-w-[12rem]"
    >
      <div className="py-1" role="none">
        {items.map((item, index) => (
          <div key={item.id} role="none">
            {item.separatorBefore ? (
              <div
                className="my-1 border-t border-[var(--line-soft)]"
                role="separator"
              />
            ) : null}
            <button
              ref={index === 0 ? firstRef : undefined}
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => {
                onClose();
                item.onSelect();
              }}
            >
              {item.icon ? (
                <span className="text-[var(--ink-soft)]" aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </AnchoredPopup>
  );
}
