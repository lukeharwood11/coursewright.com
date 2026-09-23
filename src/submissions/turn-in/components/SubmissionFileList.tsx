import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import type { SubmissionFileRecord } from "@/submissions/databridge/submissions";

export function SubmissionFileList({
  files,
  onOpen,
}: {
  files: SubmissionFileRecord[];
  onOpen: (file: SubmissionFileRecord, download: boolean) => void;
}) {
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2"
        >
          <span className="min-w-0 text-[14px] font-semibold text-[var(--ink)]">
            {file.filename}
          </span>
          <span className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onOpen(file, false)}>
              Open
            </Button>
            <Button variant="secondary" onClick={() => onOpen(file, true)}>
              <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
              Download
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}
