import { supabase } from "@/infrastructure/supabase/client";

export const ORG_FILES_BUCKET = "org-files";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Accounts aren’t connected yet. Add Supabase URL and anon key to .env.local.",
    );
  }
  return supabase;
}

export function orgFileObjectPath(
  organizationId: number,
  fileId: number,
  version: number,
  filename: string,
): string {
  return `${organizationId}/${fileId}/${version}/${filename}`;
}

export async function uploadOrgFileObject(
  objectPath: string,
  file: File,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.storage.from(ORG_FILES_BUCKET).upload(objectPath, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
}

export async function signedOrgFileUrl(
  objectPath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db.storage
    .from(ORG_FILES_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Couldn’t open that file.");
  return data.signedUrl;
}

export async function downloadOrgFileBytes(objectPath: string): Promise<Uint8Array> {
  const db = requireSupabase();
  const { data, error } = await db.storage.from(ORG_FILES_BUCKET).download(objectPath);
  if (error) throw new Error(error.message);
  return new Uint8Array(await data.arrayBuffer());
}
