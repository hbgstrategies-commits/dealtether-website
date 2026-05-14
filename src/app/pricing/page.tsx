import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { CheckoutButton } from "./checkout-button";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

export const metadata = { title: "Pricing — Tether" };

const FEATURES = [
  { bold: "Sourcing tool", rest: " — find acquisition targets by industry & location" },
  { bold: "Financial Normalizer", rest: " — AI maps P&Ls, finds add-backs, shows real SDE" },
  { bold: "Deal Analyzer", rest: " — offer range, DSCR, IRR, and 5-year forecast" },
  { bold: "Pipeline dashboard", rest: " — compare up to 3 active deals side by side" },
  { bold: "DD Workspace", rest: " — 130+ tasks, issue flags, weekly reports" },
  { bold: "PDF exports", rest: " — download analysis reports for any deal" },
  { bold: "1 active due diligence", rest: " workspace at a time" },
];

export default async function PricingPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  // Active subscribers go straight to their dashboard
  if (subscribed) redirect("/dashboard");

  const soloPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? "";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[640px] px-5 py-14 md:px-6 md:py-20">

        {/* Welcome banner for signed-in users who haven't subscribed yet */}
        {user && (
          <div className="mb-8 rounded-xl px-5 py-4 text-center" style={{ background: "rgba(0,201,167,0.07)", border: "0.5px solid rgba(0,201,167,0.2)" }}>
            <div className="text-[13px] font-semibold text-teal mb-0.5">You&apos;re signed in ✓</div>
            <div className="text-[12px] text-muted">Card required at signup — free for 30 days, then $147/mo.</div>
          </div>
        )}

        <div className="mb-10 text-center">
          <span className="eyebrow-pill">Pricing</span>
          <h1 className="mt-5 text-[40px] font-bold tracking-tether-tight text-warm">
            One plan. Every tool.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Free for 30 days, then $147/mo. Card required at signup — not charged until day 31. Cancel anytime.
          </p>
        </div>

        {/* Single plan card */}
        <div className="relative flex flex-col rounded-2xl p-8" style={{ border: "1.5px solid var(--teal)", background: "var(--navy)" }}>
          <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-lg bg-teal px-4 py-1 text-[11px] font-semibold text-navy">
            30-day free trial
          </div>

          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-teal">Solo</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[44px] font-bold tracking-tighter text-warm">$147</span>
            <span className="text-sm text-muted">/month after trial</span>
          </div>
          <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted">
            The full acquisition system for buyers working their first or second deal. Sourcing to close, all in one place.
          </p>

          <CheckoutButton
            isAuthenticated={!!user}
            priceId={soloPriceId}
            label="Start 30-day free trial"
            variant="primary"
          />

          <div className="my-6 border-t border-[0.5px] border-border" />

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] text-teal" style={{ background: "var(--teal-bg)" }}>✓</span>
                <span><strong className="text-warm">{f.bold}</strong>{f.rest}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Enterprise callout */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-4" style={{ background: "var(--navy2)", border: "0.5px solid var(--border)" }}>
          <div>
            <div className="text-[13px] font-medium text-warm">Need more capacity?</div>
            <div className="text-[12px] text-muted">Multiple deals, team access, or custom integrations.</div>
          </div>
          <a
            href="mailto:hbgstrategies@gmail.com"
            className="whitespace-nowrap rounded-lg px-4 py-2 text-[12px] font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(148,130,200,0.12)", color: "#AFA9EC", border: "0.5px solid rgba(148,130,200,0.3)" }}
          >
            Contact us
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Billed monthly via Stripe · Cancel anytime from your account · You keep access through the end of the billing period
        </p>
      </main>
      <Footer />
    </>
  );
}
