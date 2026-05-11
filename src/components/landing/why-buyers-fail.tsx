export function WhyBuyersFail() {
  return (
    <section className="mx-auto max-w-[960px] px-5 py-14 md:px-10 md:py-20">
      <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-danger">
        The hard truth
      </p>
      <h2 className="mb-3 text-center text-[28px] font-bold leading-tight tracking-tether-tight text-warm md:text-[36px]">
        Why most buyers lose money
      </h2>
      <p className="mx-auto mb-10 max-w-[540px] text-center text-[15px] leading-relaxed text-muted md:mb-14 md:text-[17px]">
        Business acquisitions fail in three predictable ways. If you&apos;re going into a deal without a system for each one, you&apos;re exposed.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <FailCard
          num="01"
          headline="They get fooled by the financials"
          desc={
            <>
              Sellers run personal expenses through the business.{" "}
              <strong className="text-warm">Family on payroll. Personal vehicles. Vacations as travel.</strong>{" "}
              Without a proper quality of earnings analysis, buyers take the P&amp;L at face value — and massively overpay for a business that doesn&apos;t earn what it claims.
            </>
          }
        />
        <FailCard
          num="02"
          headline="They don't know what to offer or how to structure it"
          desc={
            <>
              Most buyers guess at valuation. They anchor to the asking price instead of the real market multiple.{" "}
              <strong className="text-warm">They structure deals the seller wants, not deals that work for them.</strong>{" "}
              A bad offer or a bad structure can cost you hundreds of thousands before you even close.
            </>
          }
        />
        <FailCard
          num="03"
          headline="The deal falls apart on the way to close"
          desc={
            <>
              Due diligence is where acquisitions die. Buyers get overwhelmed, miss critical items, let deadlines slip.{" "}
              <strong className="text-warm">Attorneys, brokers, and advisors operate in silos.</strong>{" "}
              Things fall through the cracks. The seller gets nervous. The deal collapses — and the buyer loses their legal fees, their time, and their momentum.
            </>
          }
        />
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

function FailCard({
  num,
  headline,
  desc,
}: {
  num: string;
  headline: string;
  desc: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-7"
      style={{
        background: "var(--navy2)",
        border: "0.5px solid rgba(226,74,74,0.2)",
        borderRadius: "16px",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-danger" />
      <div
        className="mb-3 text-[36px] font-bold leading-none md:text-[40px]"
        style={{ color: "rgba(226,74,74,0.15)", letterSpacing: "-2px" }}
      >
        {num}
      </div>
      <div className="mb-3 text-lg font-bold leading-tight tracking-tether-tight text-warm">
        {headline}
      </div>
      <p className="text-[13px] leading-[1.7] text-muted">{desc}</p>
    </div>
  );
}
