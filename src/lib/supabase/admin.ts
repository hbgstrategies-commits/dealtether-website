import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES RLS.
 * ONLY use this in trusted server code — Stripe webhook handlers,
 * admin-only Route Handlers, etc. Never import from a Client Component.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. This key is required for server-side admin operations."
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
