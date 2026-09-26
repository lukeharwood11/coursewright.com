import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckIcon,
  DocumentCheckIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PageFormActions } from "@/ui/PageFormActions";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

const triggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

const descriptionClassName =
  "shrink-0 rounded-[6px] border-0 bg-transparent px-2 py-1.5 text-[13px] font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

export function ResourceEditHeaderActions({
  formId,
  saving,
  hasChanges,
  cancelTo,
  descriptionLabel,
  onDescription,
  versionHistoryLabel = "Version history",
  onVersionHistory,
  versionHistoryDisabled = false,
  commitTitle,
  onSaveAndClose,
}: {
  formId: string;
  saving: boolean;
  hasChanges: boolean;
  cancelTo: string;
  descriptionLabel: string;
  onDescription: () => void;
  versionHistoryLabel?: string;
  onVersionHistory?: () => void;
  versionHistoryDisabled?: boolean;
  commitTitle: () => Promise<boolean>;
  onSaveAndClose: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saveDisabled = saving || !hasChanges;
  const leaveLabel = hasChanges ? "Cancel" : "Close";

  async function leave() {
    await commitTitle();
    navigate(cancelTo);
  }

  function onLeave() {
    setOpen(false);
    if (saving) return;
    if (hasChanges) {
      setConfirmOpen(true);
      return;
    }
    void leave();
  }

  return (
    <>
      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <button type="button" className={descriptionClassName} onClick={onDescription}>
          {descriptionLabel}
        </button>
        {onVersionHistory ? (
          <button
            type="button"
            className={descriptionClassName}
            disabled={versionHistoryDisabled}
            onClick={onVersionHistory}
          >
            {versionHistoryLabel}
          </button>
        ) : null}
        <PageFormActions
          formId={formId}
          saving={saving}
          hasChanges={hasChanges}
          cancelTo={cancelTo}
          closeWhenUnchanged
          onCancel={leave}
          onSaveAndClose={onSaveAndClose}
        />
      </div>

      <button
        ref={buttonRef}
        type="button"
        className={`${triggerClassName} md:hidden`}
        aria-label="Edit actions"
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
        label="Edit actions"
        preferredAlign="end"
        className="min-w-[12rem] md:hidden"
      >
        <div className="py-1">
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              onDescription();
            }}
          >
            {descriptionLabel}
          </button>
          {onVersionHistory ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              disabled={versionHistoryDisabled}
              onClick={() => {
                setOpen(false);
                onVersionHistory();
              }}
            >
              {versionHistoryLabel}
            </button>
          ) : null}
          <button type="button" role="menuitem" className={itemClassName} onClick={onLeave}>
            <XMarkIcon className="h-4 w-4 shrink-0" aria-hidden />
            {leaveLabel}
          </button>
          <button
            type="submit"
            form={formId}
            role="menuitem"
            className={itemClassName}
            disabled={saveDisabled}
            onClick={() => setOpen(false)}
          >
            <CheckIcon className="h-4 w-4 shrink-0" aria-hidden />
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            disabled={saving}
            onClick={() => {
              setOpen(false);
              void onSaveAndClose();
            }}
          >
            <DocumentCheckIcon className="h-4 w-4 shrink-0" aria-hidden />
            {saving ? "Saving…" : "Save & close"}
          </button>
        </div>
      </AnchoredPopup>

      <ConfirmDialog
        open={confirmOpen}
        title="Leave without saving?"
        body="You have unsaved changes. If you leave, they’ll be lost."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void leave();
        }}
      />
    </>
  );
}
