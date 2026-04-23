import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch the current user on the server. Returns null if not signed in.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require a signed-in user. Redirects to /login with a `next` param
 * so the user is sent back after signing in.
 */
export async function requireUser(nextPath = "/") {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
