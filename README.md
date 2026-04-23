# Tether — dealtether.com

Business-acquisition toolkit. Built with Next.js 15, Supabase, and Stripe.

## Tools

| Route | Tool | Access |
| --- | --- | --- |
| `/napkin` | Napkin Value — 6-factor valuation model with risk scoring and a trend chart | Free |
| `/qoe` | Quality of Earnings Mapper — P&L add-back flagging and adjusted SDE | Paid |
| `/dd-demo` | Deal Workspace — task/phase tracking with weekly report | Paid |
| `/dd-pm` | PM Deal Workspace — full property-management playbook (DD → 90-day transition) | Paid |

Everything paid is gated by an active Stripe subscription on the user's Supabase auth account.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3 (extended with the Tether palette in `tailwind.config.ts`)
- Supabase — auth (magic link via `@supabase/ssr`) + Postgres with RLS
- Stripe — Checkout for signup, Billing Portal for self-service, webhooks for subscription sync
- Chart.js for the Napkin Value trend chart

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values. Keys you need:

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`
- **Site:** `NEXT_PUBLIC_SITE_URL` (used for Stripe return URLs, Supabase email links)

### 3. Supabase

Create a project at [supabase.com](https://supabase.com), then run the migration:

```bash
# Option A — via Supabase CLI
supabase link --project-ref <your-ref>
supabase db push

# Option B — paste supabase/migrations/0001_initial.sql into the SQL editor
```

This creates `profiles`, `subscriptions`, and `customers` tables with RLS enabled.

In **Authentication → URL Configuration**, set:
- Site URL: `http://localhost:3000` (dev) / `https://dealtether.com` (prod)
- Redirect URLs: add `http://localhost:3000/auth/callback` and `https://dealtether.com/auth/callback`

### 4. Stripe

1. Create a **Product** in the Stripe dashboard (e.g. "Tether Pro").
2. Add a recurring **Price** and paste the price ID into `NEXT_PUBLIC_STRIPE_PRICE_ID`.
3. Create a webhook endpoint pointed at `${NEXT_PUBLIC_SITE_URL}/api/stripe/webhook`. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

For local dev, forward webhooks with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_...` value — use that as `STRIPE_WEBHOOK_SECRET` while developing.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo into Vercel — it auto-detects Next.js.
3. Copy all `.env.local` values into Vercel project environment variables. Update `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Update Supabase auth redirect URLs and the Stripe webhook URL to point at the production domain.

## Project structure

```
src/
  app/
    page.tsx              Landing page
    napkin/               Napkin Value (free)
    qoe/                  QoE Mapper (paid)
    dd-demo/              Deal Workspace (paid)
    dd-pm/                PM Deal Workspace (paid)
    login/, signup/       Auth flow (magic link)
    account/              Subscription + billing portal
    pricing/              Paid-tier upsell
    auth/callback/        Supabase magic-link handler
    api/stripe/           Checkout, portal, and webhook routes
  components/
    landing/              Hero, How it works, etc.
    napkin/               4-step tool + trend chart
    qoe/                  Add-back mapper
    dd-demo/, dd-pm/      Task workspaces
    nav.tsx, footer.tsx, paywall.tsx
  lib/
    supabase/             Client, server, admin, middleware helpers
    stripe/server.ts      Stripe SDK client
    auth.ts               getUser/requireUser helpers
    subscription.ts       hasActiveSubscription()
    valuation.ts          Pure math for Napkin Value
  middleware.ts           Refreshes Supabase session on each request
supabase/
  migrations/0001_initial.sql
legacy/                   Original HTML prototypes (reference only — not served)
```

## Notes

- `legacy/` holds the original HTML/CSS/JS prototypes. Next.js ignores them. Delete once the React port has fully replaced them.
- The Stripe webhook requires the raw body, so `/api/stripe/webhook` is excluded from the Supabase session middleware matcher (see `src/middleware.ts`).
- `vercel.json` only pins the framework to Next.js — everything else is handled by Next's default Vercel adapter.
