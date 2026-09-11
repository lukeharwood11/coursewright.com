export function isPdfMime(mimeType: string): boolean {
  return mimeType.toLowerCase() === "application/pdf";
}

export function isImageMime(mimeType: string): boolean {
  const mime = mimeType.toLowerCase();
  return mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png";
}
