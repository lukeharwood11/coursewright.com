import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";

const CloseMenuContext = createContext<() => void>(() => {});

export function ToolbarDivider() {
  return <div className="cw-editor-toolbar-divider" aria-hidden />;
}

export function FormatMark({
  letter,
  style,
}: {
  letter: string;
  style?: "italic" | "underline" | "strike";
}) {
  return (
    <span
      className={[
        "text-[13px] font-extrabold leading-none",
        style === "italic" ? "italic" : "",
        style === "underline" ? "underline" : "",
        style === "strike" ? "line-through" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {letter}
    </span>
  );
}

export function ToolbarIconButton({
  pressed = false,
  disabled,
  label,
  onClick,
  children,
}: {
  pressed?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={[
        "cw-editor-toolbar-item",
        pressed ? "is-active" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ToolbarDropdown({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 220;
      setPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - width - 8),
      });
    }

    place();

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className={["cw-editor-toolbar-item cw-editor-toolbar-dropdown", open ? "is-active" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {icon}
        <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </button>
      {open
        ? createPortal(
            <CloseMenuContext.Provider value={() => setOpen(false)}>
              <div
                ref={menuRef}
                role="menu"
                aria-label={label}
                className="cw-editor-menu"
                style={{ top: position.top, left: position.left }}
              >
                {children}
              </div>
            </CloseMenuContext.Provider>,
            document.body,
          )
        : null}
    </>
  );
}

export function DropdownItem({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
}) {
  const closeMenu = useContext(CloseMenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onClick();
        closeMenu();
      }}
      className={["cw-editor-menu-item", active ? "is-active" : ""].join(" ")}
    >
      <span className="cw-editor-menu-icon">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {hint ? <span className="text-[11px] text-[var(--ink-faint)]">{hint}</span> : null}
    </button>
  );
}

export function EditorDialog({
  open,
  title,
  children,
  confirmLabel,
  confirmDisabled,
  extraAction,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  extraAction?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input,button,select,textarea",
    );
    focusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2 id={titleId} className="text-[15.5px] font-extrabold text-[var(--ink)]">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {extraAction}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
