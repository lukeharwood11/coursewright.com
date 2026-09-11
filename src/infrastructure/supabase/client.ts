import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Browser Supabase client (anon key only).
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see `.env.development`).
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

function createBrowserClient(): SupabaseClient<Database> | null {
  if (!url || !anonKey) {
    console.warn(
      "[supabase] Env missing. Use committed `.env.development` or set VITE_SUPABASE_* in the environment.",
    );
    return null;
  }
  return createClient<Database>(url, anonKey);
}

export const supabase: SupabaseClient<Database> | null = createBrowserClient();
