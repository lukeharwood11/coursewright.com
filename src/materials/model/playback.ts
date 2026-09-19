const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "m4a",
  "aac",
  "wav",
  "ogg",
  "oga",
  "flac",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "ogv"]);

function extensionOf(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

function mimeIsVague(mime: string): boolean {
  const normalized = mime.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "application/octet-stream" ||
    normalized === "binary/octet-stream"
  );
}

export function isAudioMime(mime: string): boolean {
  return mime.trim().toLowerCase().startsWith("audio/");
}

export function isVideoMime(mime: string): boolean {
  return mime.trim().toLowerCase().startsWith("video/");
}

export function isPdfMime(mime: string): boolean {
  return mime.trim().toLowerCase() === "application/pdf";
}

export function isImageMime(mime: string): boolean {
  return mime.trim().toLowerCase().startsWith("image/");
}

export function isLikelyPlayableAudio(mime: string, filename = ""): boolean {
  if (isAudioMime(mime)) return true;
  if (!mimeIsVague(mime)) return false;
  const ext = extensionOf(filename);
  return AUDIO_EXTENSIONS.has(ext);
}

export function filePlaybackKind(
  mime: string,
  filename = "",
): "audio" | "video" | "pdf" | "image" | "other" {
  if (isAudioMime(mime)) return "audio";
  if (isVideoMime(mime)) return "video";
  if (isPdfMime(mime)) return "pdf";
  if (isImageMime(mime)) return "image";

  if (mimeIsVague(mime)) {
    const ext = extensionOf(filename);
    if (AUDIO_EXTENSIONS.has(ext)) return "audio";
    if (VIDEO_EXTENSIONS.has(ext)) return "video";
  }

  return "other";
}

/** Format media seconds as m:ss or h:mm:ss. */
export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedSecs = String(secs).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSecs}`;
  }
  return `${minutes}:${paddedSecs}`;
}
