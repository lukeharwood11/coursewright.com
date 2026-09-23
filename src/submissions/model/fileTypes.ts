export const SUBMISSION_FILE_TYPES = [
  "pdf",
  "image",
  "document",
  "audio",
  "video",
] as const;

export type SubmissionFileType = (typeof SUBMISSION_FILE_TYPES)[number];

export const MAX_FILES_PER_TURN_IN = 20;

const LABELS: Record<SubmissionFileType, string> = {
  pdf: "PDF",
  image: "Photos",
  document: "Documents",
  audio: "Audio",
  video: "Video",
};

const SENTENCE: Record<SubmissionFileType, string> = {
  pdf: "a PDF",
  image: "a photo",
  document: "a document",
  audio: "an audio file",
  video: "a video",
};

const EXTENSIONS: Record<SubmissionFileType, readonly string[]> = {
  pdf: ["pdf"],
  image: ["jpg", "jpeg", "png", "heic", "heif", "webp", "gif"],
  document: ["doc", "docx", "txt", "rtf", "odt", "pages"],
  audio: ["mp3", "m4a", "wav", "aac", "ogg", "oga", "flac", "webm"],
  video: ["mp4", "mov", "webm", "m4v", "mkv", "avi"],
};

const MIMES: Record<SubmissionFileType, readonly string[]> = {
  pdf: ["application/pdf"],
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
  ],
  document: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/rtf",
    "text/rtf",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.apple.pages",
  ],
  audio: [],
  video: [],
};

export function parseSubmissionFileType(value: string): SubmissionFileType | null {
  return SUBMISSION_FILE_TYPES.includes(value as SubmissionFileType)
    ? (value as SubmissionFileType)
    : null;
}

export function parseSubmissionFileTypes(values: readonly string[]): SubmissionFileType[] {
  const seen = new Set<SubmissionFileType>();
  for (const value of values) {
    const parsed = parseSubmissionFileType(value);
    if (parsed) seen.add(parsed);
  }
  return SUBMISSION_FILE_TYPES.filter((kind) => seen.has(kind));
}

export function submissionFileTypeLabel(kind: SubmissionFileType): string {
  return LABELS[kind];
}

export function fileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) return "";
  return trimmed.slice(dot + 1);
}

export function fileMatchesSubmissionType(
  kind: SubmissionFileType,
  filename: string,
  mime: string,
): boolean {
  const ext = fileExtension(filename);
  const normalized = mime.trim().toLowerCase();
  if (ext && EXTENSIONS[kind].includes(ext)) return true;
  if (normalized && MIMES[kind].includes(normalized)) return true;
  if (kind === "audio" && normalized.startsWith("audio/")) return true;
  if (kind === "video" && normalized.startsWith("video/")) return true;
  return false;
}

export function fileAllowedForSubmission(
  allowed: readonly SubmissionFileType[],
  filename: string,
  mime: string,
): boolean {
  return allowed.some((kind) => fileMatchesSubmissionType(kind, filename, mime));
}

export function describeAllowedFiles(allowed: readonly SubmissionFileType[]): string {
  const phrases = allowed.map((kind) => SENTENCE[kind]);
  if (phrases.length === 0) return "a file the teacher allowed";
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} or ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, or ${phrases[phrases.length - 1]}`;
}

export function turnInTypeMessage(allowed: readonly SubmissionFileType[]): string {
  return `Submit ${describeAllowedFiles(allowed)}.`;
}

export function acceptAttribute(allowed: readonly SubmissionFileType[]): string {
  const tokens = new Set<string>();
  for (const kind of allowed) {
    for (const ext of EXTENSIONS[kind]) tokens.add(`.${ext}`);
    for (const mime of MIMES[kind]) tokens.add(mime);
    if (kind === "audio") tokens.add("audio/*");
    if (kind === "video") tokens.add("video/*");
  }
  return [...tokens].join(",");
}
