import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import type { SubmissionFileRecord } from "@/submissions/databridge/submissions";
import { canOpenSubmissionFile } from "@/submissions/model/preview";

export function SubmissionFileList({
  files,
  onOpen,
  onDownload,
}: {
  files: SubmissionFileRecord[];
  onOpen: (file: SubmissionFileRecord) => void;
  onDownload: (file: SubmissionFileRecord) => void;
}) {
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {files.map((file) => {
        const canOpen = canOpenSubmissionFile(file.mimeType, file.filename);
        return (
          <li
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2"
          >
            <span className="min-w-0 text-[14px] font-semibold text-[var(--ink)]">
              {file.filename}
            </span>
            <span className="flex flex-wrap gap-2">
              {canOpen ? (
                <Button variant="secondary" onClick={() => onOpen(file)}>
                  Open
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => onDownload(file)}>
                <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
                Download
              </Button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
