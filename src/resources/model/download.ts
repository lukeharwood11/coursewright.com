export const RESOURCES_ZIP_FILENAME = "resources.zip";

export function safePathSegment(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || "file";
}

export function resourceZipEntryPath(
  used: Set<string>,
  title: string,
  filename: string,
): string {
  const folder = safePathSegment(title);
  const file = safePathSegment(filename);
  let path = `${folder}/${file}`;
  let n = 2;
  while (used.has(path)) {
    const dot = file.lastIndexOf(".");
    const next =
      dot > 0 ? `${file.slice(0, dot)}-${n}${file.slice(dot)}` : `${file}-${n}`;
    path = `${folder}/${next}`;
    n += 1;
  }
  used.add(path);
  return path;
}
