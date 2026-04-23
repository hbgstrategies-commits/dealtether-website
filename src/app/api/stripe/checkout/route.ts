export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/stripe/checkout
 * Body: { priceId?: string, next?: string }
 *
 * Creates (or reuses) a Stripe customer for the signed-in user, then
 * opens a Stripe Checkout session and returns the URL. The client
 * redirects to that URL.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const priceId: string =
    body.priceId ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? "";
  const next: string = body.next ?? "/qoe";

  if (!priceId) {
    return NextResponse.json(
      { error: "missing_price_id" },
      { status: 400 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Look up or create the Stripe customer. Stored in a separate table
  // so we don't hit Stripe on every checkout click.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("customers")
      .insert({ user_id: user.id, stripe_customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}${next}?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
