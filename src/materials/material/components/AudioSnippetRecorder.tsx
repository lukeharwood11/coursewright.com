import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { AudioPlayer } from "./AudioPlayer";
import { useAudioSnippetRecorder } from "../hooks/useAudioSnippetRecorder";
import {
  AUDIO_SNIPPET_MAX_SECONDS,
  canRecordAudioSnippet,
  formatSnippetClock,
} from "@/materials/model/audioSnippet";

type Props = {
  file: File | null;
  onFile: (file: File | null) => void;
};

export function AudioSnippetRecorder({ file, onFile }: Props) {
  const recorder = useAudioSnippetRecorder(file, onFile);
  const previewUrl =
    file && file.type.startsWith("audio/") ? recorder.previewUrl : null;

  if (!canRecordAudioSnippet()) {
    return (
      <p className="text-[12px] text-[var(--ink-faint)]">
        Recording isn’t available in this browser. Upload an audio file instead.
      </p>
    );
  }

  return (
    <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-3">
      <p className="text-[13px] font-bold text-[var(--ink-soft)]">
        Or record a short audio clip
      </p>
      <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
        Up to {AUDIO_SNIPPET_MAX_SECONDS / 60} minutes, using this device’s
        microphone.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {recorder.status === "recording" ? (
          <Button type="button" variant="secondary" onClick={recorder.stop}>
            <StopIcon className="h-5 w-5" aria-hidden />
            Stop
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={recorder.start}
            disabled={recorder.status === "starting"}
          >
            <MicrophoneIcon className="h-5 w-5" aria-hidden />
            {recorder.status === "starting" ? "Starting…" : "Record"}
          </Button>
        )}
        <span className="text-[13px] tabular-nums text-[var(--ink-soft)]">
          {formatSnippetClock(recorder.elapsedMs)} /{" "}
          {formatSnippetClock(AUDIO_SNIPPET_MAX_SECONDS * 1000)}
        </span>
        {file && file.type.startsWith("audio/") ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              recorder.clearPreview();
              onFile(null);
            }}
          >
            Discard clip
          </Button>
        ) : null}
      </div>

      {recorder.error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
          {recorder.error}
        </p>
      ) : null}

      {previewUrl ? (
        <AudioPlayer className="mt-3 max-w-xl" src={previewUrl} title={file?.name} />
      ) : null}
    </div>
  );
}
