import { requireSupabase } from "./client";

export async function fetchWebPushPublicKey(): Promise<string | null> {
  const db = requireSupabase();
  const { data, error } = await db.functions.invoke("web-push-public-key", {
    method: "POST",
    body: {},
  });
  if (error) return null;
  const publicKey = (data as { publicKey?: unknown } | null)?.publicKey;
  return typeof publicKey === "string" && publicKey.length > 0 ? publicKey : null;
}

export async function savePushSubscription(args: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("claim_push_subscription", {
    p_endpoint: args.endpoint,
    p_p256dh: args.p256dh,
    p_auth: args.auth,
  });
  if (error) throw new Error(error.message);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
