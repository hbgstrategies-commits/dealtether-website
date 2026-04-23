import Stripe from "stripe";

/**
 * Server-only Stripe client. NEVER import from a Client Component.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // Pin an API version so Stripe changes don't silently break us.
  apiVersion: "2024-12-18.acacia",
  typescript: true,
  appInfo: {
    name: "Tether",
    version: "0.1.0",
  },
});
