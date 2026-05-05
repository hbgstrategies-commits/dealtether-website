const MISTAKES = [
  ["Overpaying due to missed add-backs", "$50K – $300K"],
  ["Legal fees on a failed deal", "$8K – $20K"],
  ["CPA for quality of earnings", "$3K – $8K"],
  ["Acquisition advisor fees", "$5K – $15K"],
  ["6 months of your time wasted", "Incalculable"],
];

const SOLO_FEATURES = [
  "Sourcing tool — find targets",
  "QoE mapper — normalize financials",
  "Deal Analyzer — value the business",
  "Pipeline dashboard — compare deals",
  "DD execution workspace — close it",
  { bold: "3 seats", rest: " · magic link team access" },
  "Automated weekly reports",
];

const ADVISOR_FEATURES = [
  { bold: "5 active deals", rest: " simultaneously" },
  { bold: "5 seats", rest: " per deal workspace" },
  "Portfolio dashboard — all clients in one view",
  "White-labeled weekly reports",
  "Custom DD task templates",
  "Priority support",
];

const ENTERPRISE_FEATURES = [
  { bold: "Unlimited deals" },
  { bold: "Unlimited seats" },
  "White-label branding",
  "Multi-advisor team management",
  "Dedicated onboarding + SLA",
  "API access + custom integrations",
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="border-t border-[0.5px] border-border px-10 py-20"
      style={{ background: "var(--navy2)" }}
    >
      <div className="mx-auto max-w-[1000px]">
        <p className="sec-label-teal mb-2 text-center">Pricing</p>
        <h2 className="mb-2 text-center text-[32px] font-bold text-warm" style={{ letterSpacing: "-0.6px" }}>
          What a mistake costs vs. what Tether costs
        </h2>
        <p className="mx-auto mb-8 max-w-[520px] text-center text-[15px] leading-relaxed text-muted">
          Overpaying $200K because you missed add-backs. $15K in legal fees on a deal that collapsed. The full Tether system costs $147/month. One mistake costs 100x that.
        </p>

        {/* Cost comparison */}
        <div className="mb-8 grid gap-8 overflow-hidden rounded-xl border border-[0.5px] border-border bg-navy p-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-danger">What mistakes cost</div>
            <div className="flex flex-col gap-1.5">
              {MISTAKES.map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-[0.5px] border-border py-1 text-[13px] text-muted last:border-b-0">
                  <span>{l}</span>
                  <span className="font-medium text-danger">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-teal">Tether — Solo plan</div>
            <div className="text-[48px] font-bold text-teal" style={{ letterSpacing: "-2px" }}>$147</div>
            <div className="text-[13px] text-muted">per month &nbsp;·&nbsp; first month free<br />Full system · sourcing to close</div>
          </div>
        </div>

        {/* Pricing grid */}
        <div className="grid gap-3 md:grid-cols-3">

          {/* Solo */}
          <div className="relative rounded-2xl border border-[0.5px] border-border bg-navy p-6">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-lg bg-teal px-3.5 py-0.5 text-[11px] font-semibold text-navy whitespace-nowrap">
              1 month free
            </div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Solo</div>
            <div className="text-[32px] font-bold text-warm" style={{ letterSpacing: "-1px" }}>$147</div>
            <div className="text-[12px] text-muted">per month · first month free · cancel anytime</div>
            <div className="my-3 text-[12px] leading-relaxed text-muted">
              For buyers working their first or second acquisition. Full system from sourcing to close.
            </div>
            <a
              href="https://buy.stripe.com/14AfZieqPfSp3aR1wxcIE04"
              className="mb-5 block w-full rounded-lg border border-[0.5px] border-border py-2.5 text-center text-[13px] font-semibold text-warm transition-colors hover:bg-navy-200"
            >
              Start free — 1 month free
            </a>
            <div className="mb-3 rounded-lg px-3 py-2 text-center text-[11px] font-semibold text-teal" style={{ background: "var(--teal-bg)" }}>
              Everything in the acquisition system
            </div>
            <ul className="flex flex-col gap-1.5">
              {SOLO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px] text-teal" style={{ background: "var(--teal-bg)" }}>✓</span>
                  {typeof f === "string" ? f : <span><strong className="text-warm">{f.bold}</strong>{f.rest}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Advisor */}
          <div className="relative rounded-2xl bg-navy p-6" style={{ border: "1.5px solid var(--teal)" }}>
            <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-lg bg-teal px-3.5 py-0.5 text-[11px] font-semibold text-navy whitespace-nowrap">
              Most popular
            </div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Advisor</div>
            <div className="text-[32px] font-bold text-warm" style={{ letterSpacing: "-1px" }}>$397</div>
            <div className="text-[12px] text-muted">per month · first month free · cancel anytime</div>
            <div className="my-3 text-[12px] leading-relaxed text-muted">
              For advisors and brokers managing multiple client acquisitions simultaneously.
            </div>
            <a
              href="https://buy.stripe.com/4gMeVe6Yn21zcLrcbbcIE03"
              className="mb-5 block w-full rounded-lg bg-teal py-2.5 text-center text-[13px] font-semibold text-navy transition-colors hover:bg-teal-dim"
            >
              Start free — 1 month free
            </a>
            <div className="mb-3 rounded-lg px-3 py-2 text-center text-[11px] font-semibold text-teal" style={{ background: "rgba(0,201,167,0.05)" }}>
              Everything in Solo, plus
            </div>
            <ul className="flex flex-col gap-1.5">
              {ADVISOR_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px] text-teal" style={{ background: "var(--teal-bg)" }}>✓</span>
                  {typeof f === "string" ? f : <span><strong className="text-warm">{f.bold}</strong>{(f as {bold: string; rest?: string}).rest ?? ""}</span>}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-md px-2 py-1 text-[11px] text-amber" style={{ background: "rgba(232,160,32,0.1)" }}>
              Unlimited active deals with Enterprise
            </div>
          </div>

          {/* Enterprise */}
          <div className="relative rounded-2xl bg-navy p-6" style={{ border: "0.5px solid rgba(148,130,200,0.3)" }}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Enterprise</div>
            <div className="mt-1 text-[22px] font-bold text-warm" style={{ letterSpacing: "-0.5px" }}>Let&apos;s talk</div>
            <div className="text-[12px] text-muted">custom pricing · white-label available</div>
            <div className="my-3 text-[12px] leading-relaxed text-muted">
              For high-volume organizations, acquisition brands, and institutional buyers running programs at scale.
            </div>
            <a
              href="mailto:hbgstrategies@gmail.com"
              className="mb-5 block w-full rounded-lg py-2.5 text-center text-[13px] font-semibold transition-colors hover:opacity-80"
              style={{ background: "rgba(148,130,200,0.12)", color: "#AFA9EC", border: "0.5px solid rgba(148,130,200,0.3)" }}
            >
              Contact us
            </a>
            <div className="mb-3 rounded-lg px-3 py-2 text-center text-[11px] font-semibold" style={{ background: "rgba(148,130,200,0.08)", color: "#AFA9EC" }}>
              Everything in Advisor, plus
            </div>
            <ul className="flex flex-col gap-1.5">
              {ENTERPRISE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px]" style={{ background: "rgba(148,130,200,0.15)", color: "#AFA9EC" }}>✓</span>
                  {typeof f === "string" ? f : <strong className="text-warm">{f.bold}</strong>}
                </li>
              ))}
            </ul>
          </div>

        </div>
        <p className="mt-5 text-center text-[12px] text-muted">
          First month free on Solo and Advisor. No credit card required to start. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
