const WHO = [
  {
    role: "First-time buyer",
    desc: "You've never done this before. Tether gives you a step-by-step system built by someone who has done it dozens of times — so you don't have to figure it out alone.",
    tag: "Solo · $147/mo",
    tagClass: "bg-teal-bg text-teal",
  },
  {
    role: "ETA / search fund",
    desc: "You're screening multiple targets simultaneously. The Deal Analyzer lets you quickly assess whether a deal is worth pursuing before you spend money on advisors.",
    tag: "Solo · $147/mo",
    tagClass: "bg-teal-bg text-teal",
  },
  {
    role: "Acquisition advisor",
    desc: "You're running 3–8 deals at once. The portfolio dashboard, automated reports, and role-based visibility give you control without micromanaging every party.",
    tag: "Advisor · $397/mo",
    tagClass: "text-[#85B7EB]",
    tagStyle: { background: "rgba(42,74,122,0.5)" },
  },
  {
    role: "Business broker",
    desc: "Your commission depends on the deal closing. Tether keeps buyers moving, informed, and accountable — which directly protects your fee.",
    tag: "Advisor · $397/mo",
    tagClass: "text-[#85B7EB]",
    tagStyle: { background: "rgba(42,74,122,0.5)" },
  },
  {
    role: "Roll-up operator",
    desc: "You're running parallel acquisitions as a strategy. Custom templates, unlimited deals, and white-label branding give you a system that scales with volume.",
    tag: "Enterprise",
    tagClass: "text-muted",
    tagStyle: { background: "rgba(255,255,255,0.06)" },
  },
  {
    role: "High-volume organization",
    desc: "PE-backed platforms, acquisition brands, and family offices running structured programs. Unlimited seats, white-label ready, dedicated onboarding.",
    tag: "Enterprise",
    tagClass: "text-muted",
    tagStyle: { background: "rgba(255,255,255,0.06)" },
  },
];

export function WhoItsFor() {
  return (
    <section id="who" className="mx-auto max-w-[1000px] px-10 py-20">
      <p className="sec-label-teal mb-2 text-center">Who it&apos;s for</p>
      <h2 className="mb-2 text-center text-[32px] font-bold text-warm" style={{ letterSpacing: "-0.6px" }}>
        Everyone in the deal. Not just the buyer.
      </h2>
      <p className="mx-auto mb-10 max-w-[500px] text-center text-[15px] leading-relaxed text-muted">
        Tether keeps every party on the same page — from the buyer who&apos;s terrified of missing something to the advisor managing five deals at once.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {WHO.map((w) => (
          <div
            key={w.role}
            className="rounded-xl border border-[0.5px] border-border p-5"
            style={{ background: "var(--navy2)" }}
          >
            <div className="mb-1 text-[13px] font-semibold text-warm">{w.role}</div>
            <div className="mb-3 text-[12px] leading-relaxed text-muted">{w.desc}</div>
            <span
              className={`inline-block rounded-full px-2 py-[2px] text-[11px] ${w.tagClass}`}
              style={w.tagStyle}
            >
              {w.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
