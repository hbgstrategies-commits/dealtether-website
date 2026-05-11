const MISTAKES = [
  ["Overpaying due to missed add-backs", "$50K – $300K"],
  ["Legal fees on a failed deal", "$8K – $20K"],
  ["CPA for quality of earnings", "$3K – $8K"],
  ["Acquisition advisor fees", "$5K – $15K"],
  ["6 months of your time wasted", "Incalculable"],
];

const FEATURES = [
  { bold: "Sourcing tool", rest: " — find targets by industry & location" },
  { bold: "Financial Normalizer", rest: " — AI maps P&Ls, surfaces real SDE" },
  { bold: "Deal Analyzer", rest: " — offer range, DSCR, IRR, 5-yr forecast" },
  { bold: "Pipeline dashboard", rest: " — track up to 3 active deals" },
  { bold: "DD Workspace", rest: " — 130+ tasks, issue flags, weekly reports" },
  { bold: "PDF exports", rest: " — download any analysis report" },
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="border-t border-[0.5px] border-border px-5 py-14 md:px-10 md:py-20"
      style={{ background: "var(--navy2)" }}
    >
      <div className="mx-auto max-w-[900px]">
        <p className="sec-label-teal mb-2 text-center">Pricing</p>
        <h2 className="mb-2 text-center text-[26px] font-bold text-warm md:text-[32px]" style={{ letterSpacing: "-0.6px" }}>
          What a mistake costs vs. what Tether costs
        </h2>
        <p className="mx-auto mb-10 max-w-[520px] text-center text-[14px] leading-relaxed text-muted md:text-[15px]">
          Overpaying $200K because you missed add-backs. $15K in legal fees on a deal that collapsed. Tether is $147/month. One mistake costs 100× that.
        </p>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Cost comparison */}
          <div className="rounded-xl border border-[0.5px] border-border bg-navy p-6">
            <div className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-danger">What mistakes cost</div>
            <div className="flex flex-col gap-1.5">
              {MISTAKES.map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-[0.5px] border-border py-1.5 text-[13px] text-muted last:border-b-0">
                  <span>{l}</span>
                  <span className="font-medium text-danger">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solo plan card */}
          <div className="relative flex flex-col rounded-xl p-6" style={{ border: "1.5px solid var(--teal)", background: "var(--navy)" }}>
            <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-lg bg-teal px-3.5 py-0.5 text-[11px] font-semibold text-navy">
              First month free
            </div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-teal">Solo</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[38px] font-bold text-warm" style={{ letterSpacing: "-1.5px" }}>$147</span>
              <span className="text-[13px] text-muted">/month</span>
            </div>
            <p className="mt-1 mb-4 text-[12px] leading-relaxed text-muted">
              Full acquisition system. Sourcing to close. First month free, cancel anytime.
            </p>
            <a
              href="/pricing"
              className="mb-5 block w-full rounded-lg bg-teal py-2.5 text-center text-[13px] font-semibold text-navy transition-colors hover:bg-teal-dim"
            >
              Start free — 1 month free
            </a>
            <ul className="flex flex-col gap-2">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted">
                  <span className="mt-px flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px] text-teal" style={{ background: "var(--teal-bg)" }}>✓</span>
                  <span><strong className="text-warm">{f.bold}</strong>{f.rest}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg px-3 py-2 text-center text-[11px] text-muted" style={{ background: "rgba(0,201,167,0.04)", border: "0.5px solid rgba(0,201,167,0.15)" }}>
              Need more capacity? <a href="mailto:hbgstrategies@gmail.com" className="text-teal underline-offset-2 hover:underline">Contact us</a> for team pricing.
            </div>
          </div>

        </div>

        <p className="mt-5 text-center text-[12px] text-muted">
          No credit card required to start · Cancel anytime · Billed monthly via Stripe
        </p>
      </div>
    </section>
  );
}
