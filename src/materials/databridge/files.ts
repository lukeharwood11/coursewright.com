import {
  downloadOrgFileBytes,
  orgFileObjectPath,
  signedOrgFileUrl,
  uploadOrgFileObject,
} from "@/infrastructure/supabase/storage";
import { requireSupabase } from "./client";
import { safeFilename } from "@/materials/model/kind";

export type FileRecord = {
  id: number;
  organizationId: number;
  filename: string;
  storageRef: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
};

export const fileQueryKeys = {
  detail: (id: number) => ["files", "detail", id] as const,
  versions: (id: number) => ["files", "versions", id] as const,
};

function toFile(row: {
  id: number;
  organization_id: number;
  filename: string;
  storage_ref: string;
  mime_type: string;
  size_bytes: number;
  current_version: number;
}): FileRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    filename: row.filename,
    storageRef: row.storage_ref,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    currentVersion: row.current_version,
  };
}

export async function getFile(id: number): Promise<FileRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("files")
    .select(
      "id, organization_id, filename, storage_ref, mime_type, size_bytes, current_version",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toFile(data);
}

export async function uploadNewFile(args: {
  organizationId: number;
  uploadedBy: string;
  file: File;
}): Promise<FileRecord> {
  const filename = safeFilename(args.file.name);
  const mimeType = args.file.type || "application/octet-stream";
  const db = requireSupabase();

  const { data: inserted, error: insertError } = await db
    .from("files")
    .insert({
      organization_id: args.organizationId,
      filename,
      mime_type: mimeType,
      size_bytes: args.file.size,
      storage_ref: `${args.organizationId}/0/1/${filename}`,
      uploaded_by: args.uploadedBy,
    })
    .select(
      "id, organization_id, filename, storage_ref, mime_type, size_bytes, current_version",
    )
    .maybeSingle();

  if (insertError) throw new Error(insertError.message);
  if (!inserted) throw new Error("The file row was created but couldn’t be opened.");

  const storageRef = orgFileObjectPath(
    args.organizationId,
    inserted.id,
    1,
    filename,
  );
  await uploadOrgFileObject(storageRef, args.file);

  const { data: updated, error: updateError } = await db
    .from("files")
    .update({
      storage_ref: storageRef,
      filename,
      mime_type: mimeType,
      size_bytes: args.file.size,
    })
    .eq("id", inserted.id)
    .select(
      "id, organization_id, filename, storage_ref, mime_type, size_bytes, current_version",
    )
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (!updated) return toFile({ ...inserted, storage_ref: storageRef });
  return toFile(updated);
}

export async function replaceFile(args: {
  fileId: number;
  organizationId: number;
  file: File;
}): Promise<FileRecord> {
  const current = await getFile(args.fileId);
  if (!current) throw new Error("That file isn’t available.");

  const filename = safeFilename(args.file.name);
  const mimeType = args.file.type || "application/octet-stream";
  const nextVersion = current.currentVersion + 1;
  const storageRef = orgFileObjectPath(
    args.organizationId,
    args.fileId,
    nextVersion,
    filename,
  );
  await uploadOrgFileObject(storageRef, args.file);

  const db = requireSupabase();
  const { data, error } = await db
    .from("files")
    .update({
      storage_ref: storageRef,
      filename,
      mime_type: mimeType,
      size_bytes: args.file.size,
    })
    .eq("id", args.fileId)
    .select(
      "id, organization_id, filename, storage_ref, mime_type, size_bytes, current_version",
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("The file was uploaded but couldn’t be saved.");
  return toFile(data);
}

export async function revertFileToVersion(args: {
  fileId: number;
  storageRef: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("files")
    .update({
      storage_ref: args.storageRef,
      filename: args.filename,
      mime_type: args.mimeType,
      size_bytes: args.sizeBytes,
    })
    .eq("id", args.fileId);
  if (error) throw new Error(error.message);
}

export type FileVersionRecord = {
  version: number;
  storageRef: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  changedAt: string;
  changeType: string;
};

export async function listFileVersions(fileId: number): Promise<FileVersionRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("file_versions")
    .select(
      "version, storage_ref, filename, mime_type, size_bytes, changed_at, change_type",
    )
    .eq("file_id", fileId)
    .order("version", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    version: row.version,
    storageRef: row.storage_ref,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    changedAt: row.changed_at,
    changeType: row.change_type,
  }));
}

export async function fileSignedUrl(
  storageRef: string,
  options?: { download?: string | boolean },
): Promise<string> {
  return signedOrgFileUrl(storageRef, 3600, options);
}

export async function downloadFileBytes(storageRef: string): Promise<Uint8Array> {
  return downloadOrgFileBytes(storageRef);
}
