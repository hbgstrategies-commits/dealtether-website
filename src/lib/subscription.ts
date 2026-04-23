import { createClient } from "@/lib/supabase/server";

/**
 * Returns true if the given user has an active or trialing subscription.
 * Used by paywalled pages to decide whether to render the tool or the
 * <Paywall> prompt.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();

  if (error) {
    // Don't fail-open on a database error — pretend they're not subscribed.
    // Better to show the paywall than to accidentally unlock a paid tool.
    console.error("[subscription] lookup failed:", error.message);
    return false;
  }
  return data !== null;
}
