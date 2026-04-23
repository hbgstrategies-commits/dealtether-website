const FAILURES = [
  {
    num: "01",
    headline: "They get fooled by the financials",
    desc: (
      <>
        Sellers run personal expenses through the business.{" "}
        <strong className="text-warm">
          Family on payroll. Personal vehicles. Vacations as travel.
        </strong>{" "}
        Without a proper quality of earnings analysis, buyers take the P&amp;L
        at face value — and massively overpay for a business that doesn&apos;t
        earn what it claims.
      </>
    ),
  },
  {
    num: "02",
    headline: "They don't know what to offer or how to structure it",
    desc: (
      <>
        Most buyers guess at valuation. They anchor to the asking price
        instead of the real market multiple.{" "}
        <strong className="text-warm">
          They structure deals the seller wants, not deals that work for them.
        </strong>{" "}
        A bad offer or a bad structure can cost you hundreds of thousands
        before you even close.
      </>
    ),
  },
  {
    num: "03",
    headline: "The deal falls apart on the way to close",
    desc: (
      <>
        Due diligence is where acquisitions die. Buyers get overwhelmed, miss
        critical items, let deadlines slip.{" "}
        <strong className="text-warm">
          Attorneys, brokers, and advisors operate in silos.
        </strong>{" "}
        Things fall through the cracks. The seller gets nervous. The deal
        collapses — and the buyer loses their legal fees, their time, and
        their momentum.
      </>
    ),
  },
];

export function WhyBuyersFail() {
  return (
    <section className="mx-auto max-w-5xl px-10 py-20">
      <p className="sec-label mb-3">The hard truth</p>
      <h2 className="mb-3 text-center text-[36px] font-bold tracking-tether-tight text-warm">
        Why most buyers lose money
      </h2>
      <p className="mx-auto mb-14 max-w-lg text-center text-[17px] leading-relaxed text-muted">
        Business acquisitions fail in three predictable ways. If you&apos;re
        going into a deal without a system for each one, you&apos;re exposed.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {FAILURES.map((f) => (
          <div
            key={f.num}
            className="relative overflow-hidden rounded-2xl border border-[0.5px] border-danger/20 bg-navy-100 p-7"
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-danger" />
            <div className="mb-3 text-[40px] font-bold leading-none tracking-tether-tighter text-danger/15">
              {f.num}
            </div>
            <div className="mb-3 text-lg font-bold leading-tight tracking-tether-tight text-warm">
              {f.headline}
            </div>
            <p className="text-[13px] leading-relaxed text-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-xl font-bold text-warm">
          Tether is built to <span className="text-teal">prevent all three.</span>
        </p>
        <p className="mt-1 text-[15px] text-muted">
          One platform. Three tools. The complete acquisition system.
        </p>
      </div>
    </section>
  );
}
