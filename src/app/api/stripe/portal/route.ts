import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/stripe/portal
 * Opens the Stripe billing portal for the current user so they can
 * manage or cancel their subscription. Returns { url }.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json(
      { error: "no_stripe_customer" },
      { status: 400 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${siteUrl}/account`,
  });

  return NextResponse.json({ url: session.url });
}
