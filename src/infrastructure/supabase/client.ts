import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Browser Supabase client (anon key only).
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see `.env.testing`).
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

function createBrowserClient(): SupabaseClient<Database> | null {
  if (!url || !anonKey) {
    console.warn(
      "[supabase] Env missing. Use committed `.env.testing` or set VITE_SUPABASE_* in the environment.",
    );
    return null;
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      // PKCE avoids implicit-flow tokens in the URL hash (which leave a bare `/path#`
      // after Supabase clears them via `location.hash = ''`).
      flowType: "pkce",
    },
  });
}

export const supabase: SupabaseClient<Database> | null = createBrowserClient();
