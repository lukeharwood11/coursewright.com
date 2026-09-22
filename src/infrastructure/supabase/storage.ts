import { supabase } from "@/infrastructure/supabase/client";

export const ORG_FILES_BUCKET = "org-files";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Accounts aren’t connected yet. Add Supabase URL and anon key to .env.testing.",
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
  onProgress?: (ratio: number) => void,
): Promise<void> {
  const db = requireSupabase();
  if (!onProgress) {
    const { error } = await db.storage.from(ORG_FILES_BUCKET).upload(objectPath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      "Accounts aren’t connected yet. Add Supabase URL and anon key to .env.testing.",
    );
  }
  const { data: sessionWrap } = await db.auth.getSession();
  const token = sessionWrap.session?.access_token;
  if (!token) throw new Error("Sign in again to upload that file.");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${url.replace(/\/$/, "")}/storage/v1/object/${ORG_FILES_BUCKET}/${objectPath}`,
    );
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || "That file didn’t upload."));
    };
    xhr.onerror = () => {
      reject(new Error("That file didn’t upload."));
    };
    xhr.send(file);
  });
}

export async function signedOrgFileUrl(
  objectPath: string,
  expiresInSeconds = 3600,
  options?: { download?: string | boolean },
): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db.storage
    .from(ORG_FILES_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds, {
      download: options?.download,
    });
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
