import { DescriptionDialog } from "@/ui/DescriptionDialog";

/** Resource editor wrapper — same dialog, resource placeholder. */
export function ResourceDescriptionDialog({
  open,
  value,
  onClose,
  onSave,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (next: string) => void;
}) {
  return (
    <DescriptionDialog
      open={open}
      value={value}
      placeholder="Short note people see with this resource"
      onClose={onClose}
      onSave={onSave}
    />
  );
}
