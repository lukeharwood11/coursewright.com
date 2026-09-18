import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

/** Cancel + Save for settings-style pages — sits in the page header. */
export function PageFormActions({
  formId,
  saving,
  hasChanges,
  cancelTo,
  saveLabel = "Save",
}: {
  formId: string;
  saving: boolean;
  hasChanges: boolean;
  /** Fallback when there’s no history entry to go back to. */
  cancelTo: string;
  saveLabel?: string;
}) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function leave() {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
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
    leave();
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
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={saving || !hasChanges}
        >
          {saving ? "Saving…" : saveLabel}
        </Button>
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
          leave();
        }}
      />
    </>
  );
}
