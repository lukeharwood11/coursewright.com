import { zipSync } from "fflate";
import { downloadFileBytes, fileSignedUrl, getFile } from "@/materials/databridge/files";
import {
  RESOURCES_ZIP_FILENAME,
  resourceZipEntryPath,
} from "@/resources/model/download";

export async function resourceFileDownloadUrl(fileId: number): Promise<string> {
  const file = await getFile(fileId);
  if (!file) throw new Error("That file isn’t available.");
  return fileSignedUrl(file.storageRef, { download: file.filename });
}

export async function buildResourceFilesZip(
  files: { title: string; fileId: number }[],
): Promise<{ filename: string; bytes: Uint8Array }> {
  const used = new Set<string>();
  const entries: Record<string, Uint8Array> = {};
  for (const item of files) {
    const file = await getFile(item.fileId);
    if (!file) throw new Error(`Couldn’t find “${item.title}”.`);
    const bytes = await downloadFileBytes(file.storageRef);
    entries[resourceZipEntryPath(used, item.title, file.filename)] = bytes;
  }
  if (Object.keys(entries).length === 0) {
    throw new Error("Nothing to download.");
  }
  return { filename: RESOURCES_ZIP_FILENAME, bytes: zipSync(entries) };
}
