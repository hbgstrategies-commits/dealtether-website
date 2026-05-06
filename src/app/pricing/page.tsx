import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { CheckoutButton } from "./checkout-button";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Pricing — Tether" };

const SOLO_FEATURES = [
  "Sourcing tool — find acquisition targets",
  "QoE mapper — normalize financials",
  "Deal Analyzer — value any business",
  "Pipeline dashboard — compare deals",
  "DD execution workspace — close the deal",
  { bold: "3 seats", rest: " · magic link team access" },
  "Automated weekly deal reports",
];

const ADVISOR_FEATURES = [
  "Everything in Solo",
  { bold: "5 active deals", rest: " simultaneously" },
  { bold: "5 seats", rest: " per deal workspace" },
  "Portfolio dashboard — all clients in one view",
  "White-labeled weekly reports",
  "Custom DD task templates",
  "Priority support",
];

const ENTERPRISE_FEATURES = [
  "Everything in Advisor",
  { bold: "Unlimited deals" },
  { bold: "Unlimited seats" },
  "White-label branding",
  "Multi-advisor team management",
  "Dedicated onboarding + SLA",
  "API access + custom integrations",
];

export default async function PricingPage() {
  const user = await getUser();
  const soloPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? "";
  const advisorPriceId = process.env.STRIPE_ADVISOR_PRICE_ID ?? "";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1000px] px-6 py-20">
        <div className="mb-12 text-center">
          <span className="eyebrow-pill">Pricing</span>
          <h1 className="mt-5 text-[40px] font-bold tracking-tether-tight text-warm">
            One subscription. Every tool.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            First month free on Solo and Advisor. No credit card required to start. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">

          {/* Solo */}
          <div className="relative flex flex-col rounded-2xl border border-[0.5px] border-border bg-navy-100 p-7">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-lg bg-teal px-3.5 py-0.5 text-[11px] font-semibold text-navy">
              1 month free
            </div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Solo</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[38px] font-bold tracking-tighter text-warm">$147</span>
              <span className="text-sm text-muted">/month</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              For buyers working their first or second acquisition. Full system from sourcing to close.
            </p>
            <div className="my-5">
              <CheckoutButton
                isAuthenticated={!!user}
                priceId={soloPriceId}
                label="Start free — 1 month free"
                variant="outline"
              />
            </div>
            <ul className="flex flex-col gap-2">
              {SOLO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px] text-teal" style={{ background: "var(--teal-bg)" }}>✓</span>
                  {typeof f === "string" ? f : <span><strong className="text-warm">{f.bold}</strong>{f.rest}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Advisor */}
          <div className="relative flex flex-col rounded-2xl p-7" style={{ border: "1.5px solid var(--teal)", background: "var(--navy)" }}>
            <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-lg bg-teal px-3.5 py-0.5 text-[11px] font-semibold text-navy">
              Most popular
            </div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Advisor</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[38px] font-bold tracking-tighter text-warm">$347</span>
              <span className="text-sm text-muted">/month</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              For advisors and brokers managing multiple client acquisitions at once.
            </p>
            <div className="my-5">
              <CheckoutButton
                isAuthenticated={!!user}
                priceId={advisorPriceId}
                label="Start free — 1 month free"
                variant="primary"
              />
            </div>
            <ul className="flex flex-col gap-2">
              {ADVISOR_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px] text-teal" style={{ background: "var(--teal-bg)" }}>✓</span>
                  {typeof f === "string" ? f : <span><strong className="text-warm">{f.bold}</strong>{(f as { bold: string; rest?: string }).rest ?? ""}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise */}
          <div className="relative flex flex-col rounded-2xl p-7" style={{ border: "0.5px solid rgba(148,130,200,0.3)", background: "var(--navy)" }}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Enterprise</div>
            <div className="mt-1 text-[28px] font-bold tracking-tight text-warm">Let&apos;s talk</div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              For high-volume organizations, acquisition brands, and institutional buyers running programs at scale.
            </p>
            <div className="my-5">
              <a
                href="mailto:hbgstrategies@gmail.com"
                className="block w-full rounded-lg py-3 text-center text-[13px] font-semibold transition-opacity hover:opacity-80"
                style={{ background: "rgba(148,130,200,0.12)", color: "#AFA9EC", border: "0.5px solid rgba(148,130,200,0.3)" }}
              >
                Contact us
              </a>
            </div>
            <ul className="flex flex-col gap-2">
              {ENTERPRISE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px]" style={{ background: "rgba(148,130,200,0.15)", color: "#AFA9EC" }}>✓</span>
                  {typeof f === "string" ? f : <strong className="text-warm">{f.bold}</strong>}
                </li>
              ))}
            </ul>
          </div>

        </div>

        <p className="mt-8 text-center text-xs text-muted">
          All plans billed by Stripe · Cancel anytime from your account · You keep access through the end of the billing period
        </p>
      </main>
      <Footer />
    </>
  );
}
