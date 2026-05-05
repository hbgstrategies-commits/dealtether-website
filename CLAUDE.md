# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working with Hunter

Hunter is the owner of this project and is not a programmer. Follow these rules in every session:

- **Use plain language.** Avoid technical jargon. Say "push this live" not "create a PR", "save a checkpoint" not "commit", "undo the last change" not "revert the commit", etc.
- **Standard feature workflow:** make the code changes → write tests → verify tests pass → run `npm run build` and confirm it succeeds → start the local dev server. Don't narrate the technical steps — just do them and tell Hunter what URL to open and what to click to test the feature. Never commit or push unless the build passes cleanly.
- **Be aggressive with changes.** Git makes it trivial to undo anything, so move fast and don't hedge. If something needs to be undone, Hunter will ask.

## Commands

```bash
npm run dev        # start dev server on http://localhost:3000
npm run build      # production build (runs Next.js compiler + type check)
npm run typecheck  # tsc --noEmit only
npm run lint       # ESLint
```

Run all tests (Playwright):
```bash
npm test
```

For local Stripe webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# paste the printed whsec_… into .env.local as STRIPE_WEBHOOK_SECRET
```

## Architecture

**Tether** is a business-acquisition toolkit at dealtether.com. Four tools, one subscription gate.

### Auth & access control

Auth is Supabase magic-link via `@supabase/ssr`. The middleware (`src/middleware.ts`) refreshes the Supabase session cookie on every request — it intentionally skips `/api/stripe/webhook` (raw body must be untouched for signature verification).

Access to paid tools is checked server-side in each page component:
1. `requireUser()` (`src/lib/auth.ts`) — redirects unauthenticated users to `/login?next=<path>`
2. `hasActiveSubscription(userId)` (`src/lib/subscription.ts`) — queries the `subscriptions` table for `status IN ('active', 'trialing')`; fails closed (returns `false`) on DB error to avoid accidentally unlocking paid tools

If either check fails, the page renders `<Paywall>` instead of the tool.

### Stripe subscription flow

1. User clicks upgrade → `POST /api/stripe/checkout` → returns a Stripe Checkout URL
2. After payment → Stripe fires `checkout.session.completed` → `POST /api/stripe/webhook`
3. Webhook upserts into `subscriptions` table via the Supabase admin client (service role, bypasses RLS)
4. User manages billing via `POST /api/stripe/portal` → Stripe Billing Portal

The webhook also handles `customer.subscription.{created,updated,deleted}` to stay in sync with renewals and cancellations. User ID resolution order: `session.client_reference_id` → `sub.metadata.supabase_user_id` → `customers` table lookup by `stripe_customer_id`.

### Database schema (Supabase/Postgres)

Three tables, all RLS-enabled:
- `profiles` — one row per auth user, auto-created by trigger on signup
- `subscriptions` — Stripe subscription state; written only by the webhook via service role
- `customers` — maps `user_id` → `stripe_customer_id`; created lazily at first checkout

Schema is in `supabase/migrations/0001_initial.sql`. Apply via `supabase db push` or the Supabase SQL editor.

### Supabase client helpers (`src/lib/supabase/`)

- `client.ts` — browser client (`createBrowserClient`)
- `server.ts` — server component / route handler client (`createServerClient` with cookie store)
- `middleware.ts` — session refresh helper called by `src/middleware.ts`
- `admin.ts` — service role client used only in the Stripe webhook

### Tools & routes

| Route | Access | Component dir |
|---|---|---|
| `/napkin` | Free | `src/components/napkin/` |
| `/qoe` | Paid | `src/components/qoe/` |
| `/dd-demo` | Paid | `src/components/dd-demo/` |
| `/dd-pm` | Paid | `src/components/dd-pm/` |

`src/lib/valuation.ts` contains the pure math for the Napkin Value 6-factor model.

### Styling

Tailwind CSS 3 extended with a custom palette in `tailwind.config.ts` (colors: `teal`, `teal-bg`, `warm`, `muted`, `danger`; utility classes: `btn-primary`, `tracking-tether-tight`). Use these tokens rather than raw Tailwind colors.

### Misc

- `legacy/` — original HTML prototypes, not served by Next.js, kept for reference only
- `vercel.json` — only sets `framework: nextjs`; all build config comes from Next defaults
