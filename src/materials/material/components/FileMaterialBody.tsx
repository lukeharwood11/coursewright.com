import { useEffect, useId, useState } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { filePlaybackKind } from "@/materials/model/playback";
import type { FileRecord } from "@/materials/databridge/files";

type Props = {
  file: FileRecord;
  fileUrl: string | null;
  fileDownloadUrl: string | null;
};

export function FileMaterialBody({ file, fileUrl, fileDownloadUrl }: Props) {
  const kind = filePlaybackKind(file.mimeType);
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  const canPreview = Boolean(fileUrl) && (kind === "pdf" || kind === "image");

  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  function startDownload() {
    if (!fileDownloadUrl) return;
    const link = document.createElement("a");
    link.href = fileDownloadUrl;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-[14px] text-[var(--ink)]">
          <span className="font-bold">{file.filename}</span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
            {file.mimeType || "File"}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {canPreview ? (
            <Button variant="secondary" onClick={() => setExpanded(true)}>
              <ArrowsPointingOutIcon className="h-5 w-5" aria-hidden />
              Expand
            </Button>
          ) : null}
          <Button
            variant="primary"
            disabled={!fileDownloadUrl}
            onClick={startDownload}
          >
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
            Download
          </Button>
        </div>
      </div>

      {kind === "audio" && fileUrl ? (
        <audio className="w-full max-w-xl" controls src={fileUrl} />
      ) : null}

      {kind === "video" && fileUrl ? (
        <video className="w-full max-w-2xl" controls playsInline src={fileUrl} />
      ) : null}

      {canPreview ? (
        <div className="overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-white">
          <FilePreview
            kind={kind === "pdf" ? "pdf" : "image"}
            filename={file.filename}
            src={fileUrl!}
            className="h-[min(50vh,28rem)] w-full"
          />
        </div>
      ) : null}

      {kind === "other" && !fileDownloadUrl ? (
        <p className="text-[14px] text-[var(--ink-soft)]">{file.filename}</p>
      ) : null}

      {expanded && fileUrl && (kind === "pdf" || kind === "image") ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setExpanded(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-soft)] px-4 py-3">
              <p
                id={titleId}
                className="min-w-0 truncate text-[14px] font-bold text-[var(--ink)]"
              >
                {file.filename}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!fileDownloadUrl}
                  onClick={startDownload}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
                  Download
                </Button>
                <Button variant="secondary" onClick={() => setExpanded(false)}>
                  <XMarkIcon className="h-5 w-5" aria-hidden />
                  Close
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-[var(--paper)]">
              <FilePreview
                kind={kind}
                filename={file.filename}
                src={fileUrl}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilePreview({
  kind,
  filename,
  src,
  className,
}: {
  kind: "pdf" | "image";
  filename: string;
  src: string;
  className: string;
}) {
  if (kind === "image") {
    return (
      <div className={`flex items-center justify-center overflow-auto ${className}`}>
        <img
          src={src}
          alt={filename}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <iframe title={filename} className={`border-0 bg-white ${className}`} src={src} />
  );
}
