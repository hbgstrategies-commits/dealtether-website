import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook receiver. Updates the `subscriptions` table so our
 * `hasActiveSubscription()` lookup stays in sync with Stripe.
 *
 * IMPORTANT: this route is EXCLUDED from the Supabase middleware matcher
 * so we don't mutate the raw body before signature verification.
 *
 * Stripe CLI setup (local dev):
 *   stripe login
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 *   → paste the `whsec_…` into .env.local as STRIPE_WEBHOOK_SECRET
 */
export const runtime = "nodejs";

const relevantEvents = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "missing_signature_or_secret" },
      { status: 400 }
    );
  }

  // Stripe signature verification requires the raw body as text.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid_signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // On first checkout, pull the subscription fresh and upsert.
        if (session.subscription && session.customer) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await upsertSubscription(admin, sub, session.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(admin, sub);
        break;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "webhook_handler_failed";
    console.error("[stripe:webhook]", event.type, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Upsert a Stripe.Subscription into our subscriptions table.
 * If userId isn't provided, look it up via metadata or the customers table.
 */
async function upsertSubscription(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
  userIdHint?: string | null
) {
  let userId =
    userIdHint ??
    (typeof sub.metadata?.supabase_user_id === "string"
      ? sub.metadata.supabase_user_id
      : null);

  if (!userId) {
    const { data } = await admin
      .from("customers")
      .select("user_id")
      .eq("stripe_customer_id", sub.customer as string)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }

  if (!userId) {
    throw new Error(
      `Cannot resolve user_id for subscription ${sub.id} (customer ${sub.customer as string})`
    );
  }

  const priceId = sub.items.data[0]?.price?.id ?? null;

  await admin.from("subscriptions").upsert(
    {
      id: sub.id,
      user_id: userId,
      stripe_customer_id: sub.customer as string,
      status: sub.status,
      price_id: priceId,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}
