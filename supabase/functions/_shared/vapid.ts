// VAPID keys for Activity Web Push. HN-018 — secrets stay in Edge Function env.
// Accepts either a JWK JSON object or the base64url pair from `web-push generate-vapid-keys`.

import {
  ApplicationServer,
  exportApplicationServerKey,
  importVapidKeys,
  type ExportedVapidKeys,
} from "jsr:@negrel/webpush@0.5.0";

export const VAPID_SUBJECT = "mailto:hi@coursewright.com";

export async function loadPushServer(): Promise<{
  server: ApplicationServer;
  publicKey: string;
} | null> {
  const publicRaw = Deno.env.get("VAPID_PUBLIC_KEY")?.trim();
  const privateRaw = Deno.env.get("VAPID_PRIVATE_KEY")?.trim();
  if (!publicRaw || !privateRaw) return null;

  const exported = await keysFromSecrets(publicRaw, privateRaw);
  if (!exported) return null;

  const vapidKeys = await importVapidKeys(exported, { extractable: true });
  const server = await ApplicationServer.new({
    contactInformation: VAPID_SUBJECT,
    vapidKeys,
  });
  const publicKey = await exportApplicationServerKey(vapidKeys);
  return { server, publicKey };
}

async function keysFromSecrets(
  publicRaw: string,
  privateRaw: string,
): Promise<ExportedVapidKeys | null> {
  if (publicRaw.startsWith("{") && privateRaw.startsWith("{")) {
    return {
      publicKey: JSON.parse(publicRaw) as JsonWebKey,
      privateKey: JSON.parse(privateRaw) as JsonWebKey,
    };
  }
  if (publicRaw.startsWith("{") || privateRaw.startsWith("{")) return null;
  return rawKeysToJwk(publicRaw, privateRaw);
}

function rawKeysToJwk(publicB64: string, privateB64: string): ExportedVapidKeys | null {
  const pub = base64UrlToBytes(publicB64);
  const priv = base64UrlToBytes(privateB64);
  if (pub.length !== 65 || pub[0] !== 4 || priv.length !== 32) return null;
  const x = bytesToBase64Url(pub.slice(1, 33));
  const y = bytesToBase64Url(pub.slice(33, 65));
  const d = bytesToBase64Url(priv);
  return {
    publicKey: { kty: "EC", crv: "P-256", x, y, ext: true },
    privateKey: { kty: "EC", crv: "P-256", x, y, d, ext: true },
  };
}

function base64UrlToBytes(input: string): Uint8Array {
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
