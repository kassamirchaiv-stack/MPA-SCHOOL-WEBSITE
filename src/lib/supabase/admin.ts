import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, requireEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS — only call it from server code that has
 * already checked permissions. Never import it into client components.
 */
export function createSupabaseAdminClient() {
  return createClient(publicEnv.supabaseUrl, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
