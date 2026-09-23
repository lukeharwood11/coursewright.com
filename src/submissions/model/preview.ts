import { fileExtension } from "./fileTypes";

export const SUBMISSION_PREVIEW_KINDS = [
  "pdf",
  "image",
  "audio",
  "video",
  "text",
] as const;

export type SubmissionPreviewKind = (typeof SUBMISSION_PREVIEW_KINDS)[number];

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "m4a",
  "aac",
  "wav",
  "ogg",
  "oga",
  "flac",
  "webm",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "m4v", "mov"]);
const TEXT_EXTENSIONS = new Set(["txt"]);

function mimeIsVague(mime: string): boolean {
  const normalized = mime.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "application/octet-stream" ||
    normalized === "binary/octet-stream"
  );
}

/**
 * Browser-renderable kinds for the submissions Open portal.
 * Office docs, Pages, HEIC, AVI/MKV, etc. return null — Download only.
 */
export function submissionPreviewKind(
  mime: string,
  filename: string,
): SubmissionPreviewKind | null {
  const normalized = mime.trim().toLowerCase();
  const ext = fileExtension(filename);

  if (normalized === "application/pdf" || ext === "pdf") return "pdf";

  if (normalized === "text/plain" || TEXT_EXTENSIONS.has(ext)) return "text";

  if (normalized.startsWith("image/")) {
    if (normalized.includes("heic") || normalized.includes("heif")) return null;
    if (
      normalized === "image/jpeg" ||
      normalized === "image/png" ||
      normalized === "image/gif" ||
      normalized === "image/webp"
    ) {
      return "image";
    }
    // Unknown image/* — try if extension is a known browser format
    if (IMAGE_EXTENSIONS.has(ext)) return "image";
    return null;
  }
  if (mimeIsVague(mime) && IMAGE_EXTENSIONS.has(ext)) return "image";

  if (normalized.startsWith("audio/")) return "audio";
  if (mimeIsVague(mime) && AUDIO_EXTENSIONS.has(ext)) return "audio";

  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (
    normalized === "video/mp4" ||
    normalized === "video/webm" ||
    normalized === "video/quicktime"
  ) {
    return "video";
  }

  return null;
}

export function canOpenSubmissionFile(mime: string, filename: string): boolean {
  return submissionPreviewKind(mime, filename) != null;
}
