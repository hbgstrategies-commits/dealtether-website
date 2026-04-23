const TESTIMONIALS = [
  {
    initials: "MK",
    name: "Marcus K.",
    role: "First-time buyer · Property management",
    outcome: "Avoided overpaying by $243K",
    quote:
      "The financial normalizer found $81K in add-backs I never would have caught on my own. At a 3x multiple that changed my offer by $243K. The tool paid for itself before I even closed.",
  },
  {
    initials: "SL",
    name: "Sarah L.",
    role: "Acquisition advisor · 12 deals closed",
    outcome: "Uses on every deal",
    quote:
      "I run the deal analyzer on every target before I advise my clients to move forward. It gives me the multiple breakdown, risk flags, and financing model in minutes. Nothing else comes close.",
  },
  {
    initials: "RT",
    name: "Robert T.",
    role: "Business broker · SMB acquisitions",
    outcome: "Higher close rate",
    quote:
      "I've seen deals fall apart in DD because the buyer got overwhelmed and stopped moving. Since I started recommending Tether to my buyers, my close rate has gone up noticeably. It keeps everyone accountable.",
  },
];

export function Testimonials() {
  return (
    <section className="px-10 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="sec-label-teal mb-3">What buyers say</p>
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tether-tight text-warm">
          The deals that closed. The mistakes that didn&apos;t happen.
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-4 rounded-2xl border border-[0.5px] border-border bg-navy-100 p-6"
            >
              <div className="text-amber">★★★★★</div>
              <p className="text-sm leading-relaxed text-warm">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-[0.5px] border-border pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-bg text-xs font-bold text-teal">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-warm">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                  <div className="text-xs font-semibold text-teal">
                    {t.outcome}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
