import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckIcon,
  DocumentCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

/** Cancel + Save for settings-style pages — sits in the page header. */
export function PageFormActions({
  formId,
  saving,
  hasChanges,
  canSave = true,
  cancelTo,
  onCancel,
  onSaveAndClose,
  closeWhenUnchanged = false,
  saveLabel = "Save",
  saveAndCloseLabel = "Save & close",
}: {
  formId: string;
  saving: boolean;
  hasChanges: boolean;
  /** When false, Save stays disabled even if the form has changes. */
  canSave?: boolean;
  /** View URL to open when Cancel is not handled locally. */
  cancelTo: string;
  /** When set, Cancel leaves edit mode here instead of navigating. */
  onCancel?: () => void | Promise<void>;
  /**
   * Desktop-only: save then leave edit. When unchanged, just leaves.
   * Omit on pages that should not offer this action.
   */
  onSaveAndClose?: () => void | Promise<void>;
  /** When true and nothing is staged, Cancel reads “Close”. */
  closeWhenUnchanged?: boolean;
  saveLabel?: string;
  saveAndCloseLabel?: string;
}) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saveDisabled = saving || !hasChanges || !canSave;
  const saveAndCloseDisabled = saving || (hasChanges && !canSave);
  const leaveLabel =
    closeWhenUnchanged && !hasChanges ? "Close" : "Cancel";

  async function leave() {
    if (onCancel) {
      await onCancel();
      return;
    }
    navigate(cancelTo);
  }

  function onCancelClick() {
    if (saving) return;
    if (hasChanges) {
      setConfirmOpen(true);
      return;
    }
    void leave();
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelClick}
          disabled={saving}
        >
          <XMarkIcon className="h-4 w-4" aria-hidden />
          {leaveLabel}
        </Button>
        <Button
          type="submit"
          form={formId}
          variant={onSaveAndClose ? "secondary" : "primary"}
          disabled={saveDisabled}
        >
          <CheckIcon className="h-4 w-4" aria-hidden />
          {saving ? "Saving…" : saveLabel}
        </Button>
        {onSaveAndClose ? (
          <Button
            type="button"
            className="hidden md:inline-flex"
            onClick={() => {
              void onSaveAndClose();
            }}
            disabled={saveAndCloseDisabled}
          >
            <DocumentCheckIcon className="h-4 w-4" aria-hidden />
            {saving ? "Saving…" : saveAndCloseLabel}
          </Button>
        ) : null}
      </div>
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
