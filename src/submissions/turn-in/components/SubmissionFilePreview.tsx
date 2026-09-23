import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { AudioPlayer } from "@/materials/material/components/AudioPlayer";
import { FilePreviewOverlay } from "@/materials/material/components/FilePreviewOverlay";
import { Button } from "@/ui/Button";
import type { SubmissionPreviewKind } from "@/submissions/model/preview";

type Props = {
  open: boolean;
  title: string;
  kind: SubmissionPreviewKind;
  url: string | null;
  text: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onDownload: () => void;
};

export function SubmissionFilePreview({
  open,
  title,
  kind,
  url,
  text,
  loading,
  error,
  onClose,
  onDownload,
}: Props) {
  return (
    <FilePreviewOverlay
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <Button type="button" variant="secondary" onClick={onDownload}>
          <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
          Download
        </Button>
      }
    >
      {loading ? (
        <p className="p-4 text-[14px] text-[var(--ink-soft)]">Loading…</p>
      ) : null}
      {error && !loading ? (
        <p className="p-4 text-[14px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && kind === "pdf" && url ? (
        <iframe title={title} className="h-full w-full border-0 bg-white" src={url} />
      ) : null}
      {!loading && !error && kind === "image" && url ? (
        <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
          <img src={url} alt={title} className="max-h-full max-w-full object-contain" />
        </div>
      ) : null}
      {!loading && !error && kind === "audio" && url ? (
        <div className="flex h-full w-full items-center justify-center p-6">
          <AudioPlayer className="w-full max-w-xl" src={url} title={title} />
        </div>
      ) : null}
      {!loading && !error && kind === "video" && url ? (
        <div className="flex h-full w-full items-center justify-center bg-black p-2">
          <video className="max-h-full max-w-full" controls playsInline src={url} />
        </div>
      ) : null}
      {!loading && !error && kind === "text" && text != null ? (
        <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13.5px] leading-relaxed text-[var(--ink)]">
          {text}
        </pre>
      ) : null}
    </FilePreviewOverlay>
  );
}
