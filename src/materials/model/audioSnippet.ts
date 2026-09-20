export const AUDIO_SNIPPET_MAX_SECONDS = 5 * 60;

const RECORDER_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function canRecordAudioSnippet(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

export function audioSnippetExtension(mimeType: string): "webm" | "m4a" | "ogg" {
  const mime = mimeType.toLowerCase();
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function audioSnippetFilename(
  mimeType: string,
  recordedAt: Date = new Date(),
): string {
  const stamp = recordedAt.toISOString().slice(0, 10);
  return `audio-snippet-${stamp}.${audioSnippetExtension(mimeType)}`;
}

export function snippetReachedMax(elapsedMs: number): boolean {
  return elapsedMs >= AUDIO_SNIPPET_MAX_SECONDS * 1000;
}

export function formatSnippetClock(elapsedMs: number): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
