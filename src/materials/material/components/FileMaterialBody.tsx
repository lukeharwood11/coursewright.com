import { useState } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { filePlaybackKind } from "@/materials/model/playback";
import type { FileRecord } from "@/materials/databridge/files";
import { AudioPlayer } from "./AudioPlayer";
import { FilePreviewOverlay } from "./FilePreviewOverlay";

type Props = {
  file: FileRecord;
  fileUrl: string | null;
  fileDownloadUrl: string | null;
  onRetryFileUrl?: () => void;
};

export function FileMaterialBody({
  file,
  fileUrl,
  fileDownloadUrl,
  onRetryFileUrl,
}: Props) {
  const kind = filePlaybackKind(file.mimeType, file.filename);
  const [previewOpen, setPreviewOpen] = useState(false);
  const canPreviewPdf = kind === "pdf" && Boolean(fileUrl);
  const canExpandImage = kind === "image" && Boolean(fileUrl);

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
        <p className="flex min-w-0 items-start gap-2 text-[14px] text-[var(--ink)]">
          {kind === "pdf" ? (
            <DocumentTextIcon
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ink-soft)]"
              aria-hidden
            />
          ) : null}
          <span className="min-w-0">
            <span className="font-bold">{file.filename}</span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
              {file.mimeType || "File"}
            </span>
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {canPreviewPdf ? (
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
          ) : null}
          {canExpandImage ? (
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
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
        <AudioPlayer
          className="max-w-xl"
          src={fileUrl}
          onRetry={onRetryFileUrl}
        />
      ) : null}

      {kind === "video" && fileUrl ? (
        <video className="w-full max-w-2xl" controls playsInline src={fileUrl} />
      ) : null}

      {canExpandImage ? (
        <div className="overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-white">
          <div className="flex h-[min(50vh,28rem)] w-full items-center justify-center overflow-auto">
            <img
              src={fileUrl!}
              alt={file.filename}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}

      {kind === "other" && !fileDownloadUrl ? (
        <p className="text-[14px] text-[var(--ink-soft)]">{file.filename}</p>
      ) : null}

      <FilePreviewOverlay
        open={previewOpen && Boolean(fileUrl) && (kind === "pdf" || kind === "image")}
        title={file.filename}
        onClose={() => setPreviewOpen(false)}
        actions={
          <Button
            type="button"
            variant="secondary"
            disabled={!fileDownloadUrl}
            onClick={startDownload}
          >
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
            Download
          </Button>
        }
      >
        {kind === "image" && fileUrl ? (
          <div className="flex h-full w-full items-center justify-center overflow-auto">
            <img
              src={fileUrl}
              alt={file.filename}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : null}
        {kind === "pdf" && fileUrl ? (
          <iframe
            title={file.filename}
            className="h-full w-full border-0 bg-white"
            src={fileUrl}
          />
        ) : null}
      </FilePreviewOverlay>
    </div>
  );
}
