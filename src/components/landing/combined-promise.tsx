const BOXES = [
  {
    icon: "📍",
    title: "Find the right target",
    desc: "Sourcing tool finds real businesses by industry and radius — with owner info, ratings, and acquisition signals.",
  },
  {
    icon: "🔍",
    title: "Real earnings. Not what the seller claims.",
    desc: "QoE mapper surfaces every add-back and gives you the true SDE — the number your lender actually uses.",
  },
  {
    icon: "⚖️",
    title: "The right price. Structured the right way.",
    desc: "Market-benchmarked multiple, offer range, SBA model, DSCR check — before you sit down with a lender.",
  },
  {
    icon: "📊",
    title: "Compare your best opportunities",
    desc: "Pipeline dashboard lets you track and compare multiple deals side-by-side — IRR, DSCR, multiple, offer range.",
  },
  {
    icon: "🏁",
    title: "A deal that actually closes.",
    desc: "130+ task DD workspace keeps attorney, bank, advisor, and broker aligned from LOI to close.",
  },
];

export function CombinedPromise() {
  return (
    <section className="mx-auto max-w-[800px] px-5 py-14 text-center md:px-10 md:py-20">
      <p className="sec-label-teal mb-4">The complete system</p>
      <h2 className="mb-4 text-[30px] font-bold leading-tight text-warm md:text-[38px]" style={{ letterSpacing: "-1px" }}>
        Five stages. One system.
        <br />
        <span className="text-teal">From sourcing to close — nothing left out.</span>
      </h2>
      <p className="mx-auto mb-8 max-w-[640px] text-[16px] leading-relaxed text-muted md:text-[18px]">
        Most buyers piece this together from spreadsheets, cold calls, generic checklists, and expensive advisors. Tether gives you the complete acquisition system — find targets, analyze financials, value the deal, compare opportunities, and execute diligence — built by an operator who has closed $60M+.
      </p>

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BOXES.map((b) => (
          <div
            key={b.title}
            className="rounded-xl border border-[0.5px] border-border p-5 text-left"
            style={{ background: "var(--navy2)" }}
          >
            <div className="mb-2 text-[22px]">{b.icon}</div>
            <div className="mb-1.5 text-[14px] font-semibold text-warm">{b.title}</div>
            <div className="text-[12px] leading-relaxed text-muted">{b.desc}</div>
          </div>
        ))}
      </div>

      <a
        href="/pricing"
        className="inline-block w-full rounded-[9px] bg-teal px-[30px] py-[13px] text-[15px] font-bold text-navy transition-all hover:-translate-y-px hover:bg-teal-dim sm:w-auto"
        style={{ letterSpacing: "-0.1px" }}
      >
        Start 30-day free trial
      </a>
    </section>
  );
}
