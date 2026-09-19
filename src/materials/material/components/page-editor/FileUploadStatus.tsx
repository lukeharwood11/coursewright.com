import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePageEditorActions } from "./PageEditorActions";

export function FileUploadStatus() {
  const { uploading, uploadingFilename, uploadError } = usePageEditorActions();

  if (!uploading && !uploadError) return null;

  return (
    <div className="border-b border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2.5">
      {uploading ? (
        <p
          className="flex items-center gap-2 text-[13px] font-bold text-[var(--ink-soft)]"
          role="status"
          aria-live="polite"
        >
          <ArrowPathIcon
            className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
          <span className="min-w-0 truncate">
            Uploading
            {uploadingFilename ? ` ${uploadingFilename}` : ""}…
          </span>
        </p>
      ) : null}
      {uploadError ? (
        <p className="text-[13px] text-[var(--amber-deep)]" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
