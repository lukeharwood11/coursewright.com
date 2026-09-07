import { ArrowLeftIcon, ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printPreviewFrame(blob: Blob) {
  const frame = document.getElementById("print-pdf-frame");
  if (frame instanceof HTMLIFrameElement) {
    const win = frame.contentWindow;
    if (win) {
      win.focus();
      win.print();
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    downloadBlob(blob, "print.pdf");
  }
}

export function PrintActionBar({
  backTo,
  filename,
  blob,
  disabled,
}: {
  backTo: string;
  filename: string;
  blob: Blob | null;
  disabled?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <ButtonLink variant="secondary" to={backTo} className="px-2.5 py-2">
        <ArrowLeftIcon className="h-5 w-5" aria-hidden />
        Back
      </ButtonLink>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={disabled || !blob}
          onClick={() => {
            if (blob) downloadBlob(blob, filename);
          }}
        >
          <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
          Download
        </Button>
        <Button
          disabled={disabled || !blob}
          onClick={() => {
            if (blob) printPreviewFrame(blob);
          }}
        >
          <PrinterIcon className="h-5 w-5" aria-hidden />
          Print
        </Button>
      </div>
    </header>
  );
}
