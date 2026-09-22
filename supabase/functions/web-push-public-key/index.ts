import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, userFromRequest } from "../_shared/mod.ts";
import { loadPushServer } from "../_shared/vapid.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST" && request.method !== "GET") {
    return jsonResponse({ error: "Couldn’t load notifications." }, 405);
  }

  try {
    const user = await userFromRequest(request);
    if (!user) {
      return jsonResponse({ error: "Sign in to turn on notifications." }, 401);
    }

    const push = await loadPushServer();
    if (!push) {
      return jsonResponse({ error: "Notifications aren’t available yet." }, 503);
    }

    return jsonResponse({ publicKey: push.publicKey });
  } catch (error) {
    console.error("web-push-public-key failed", error instanceof Error ? error.message : "error");
    return jsonResponse({ error: "Notifications aren’t available yet." }, 503);
  }
});
