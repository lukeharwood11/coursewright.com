export function isAudioMime(mime: string): boolean {
  return mime.startsWith("audio/");
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

export function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function filePlaybackKind(
  mime: string,
): "audio" | "video" | "pdf" | "image" | "other" {
  if (isAudioMime(mime)) return "audio";
  if (isVideoMime(mime)) return "video";
  if (isPdfMime(mime)) return "pdf";
  if (isImageMime(mime)) return "image";
  return "other";
}
