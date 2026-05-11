export function FounderCredibility() {
  return (
    <section className="border-t border-[0.5px] border-border px-5 py-14 md:px-10 md:py-20" style={{ background: "var(--navy2)" }}>
      <div className="mx-auto max-w-[1000px]">
        <p className="sec-label-teal mb-2 text-center">Built by someone who has done it</p>
        <h2 className="mb-2 text-center text-[26px] font-bold leading-tight text-warm md:text-[32px]" style={{ letterSpacing: "-0.6px" }}>
          Not software built by engineers.
          <br />
          A system built from real deals.
        </h2>
        <p className="mx-auto mb-10 max-w-[540px] text-center text-[14px] leading-relaxed text-muted md:text-[15px]">
          Tether was built by an operator who has personally closed over $60M in acquisitions and funded $20M+ in SBA loans through Live Oak Bank. Every tool, every task, every flag in the system came from a real deal — the mistakes, the near-misses, and the systems built to prevent them.
        </p>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { num: "$60M+", label: "In acquisitions closed", sub: "Personal track record across multiple industries and deal sizes" },
            { num: "$20M+", label: "In SBA loans funded", sub: "Via Live Oak Bank — the #1 SBA acquisition lender in the country" },
            { num: "100%", label: "Built from real deals", sub: "Every task, flag, and model in Tether came from an actual acquisition" },
          ].map((s) => (
            <div key={s.num} className="rounded-xl border border-[0.5px] border-border bg-navy p-6 text-center">
              <div className="mb-1 text-[36px] font-bold text-teal" style={{ letterSpacing: "-1px" }}>{s.num}</div>
              <div className="mb-1 text-[13px] font-medium text-warm">{s.label}</div>
              <div className="text-[12px] leading-relaxed text-muted">{s.sub}</div>
            </div>
          ))}
        </div>

        <div
          className="mx-auto max-w-[700px] rounded-xl p-5 md:p-6"
          style={{ background: "var(--navy)", border: "0.5px solid var(--teal-bd)", borderLeft: "3px solid var(--teal)" }}
        >
          <p className="mb-3 text-[13px] italic leading-[1.7] text-warm md:text-[14px]">
            &ldquo;My father spent a 40-year career as a transaction attorney. I grew up learning that in acquisitions, the downside isn&apos;t just losing money — it&apos;s losing everything. I&apos;ve seen people overpay, miss critical risks, lose deals, and in the worst cases, lose their homes. That risk-awareness is in my DNA. I built Tether after working on hundreds of deals, compounding everything I&apos;ve learned, with one goal:{" "}
            <strong className="not-italic text-teal">no one defaults.</strong>&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-teal"
              style={{ background: "var(--navy2)", border: "0.5px solid var(--teal-bd)" }}
            >
              HG
            </div>
            <div>
              <div className="text-[13px] font-semibold text-warm">Hunter Goodall</div>
              <div className="text-[11px] text-muted">
                Founder, Tether &nbsp;·&nbsp; $60M+ in acquisitions closed &nbsp;·&nbsp; dealtether.com
              </div>
            </div>
          </div>
        </div>

        <p className="mt-7 text-center text-[12px] text-muted">
          Tether is newly launched. We don&apos;t have customer reviews yet — and we won&apos;t fake them.
          <br />
          Start your free month and see for yourself.
        </p>
      </div>
    </section>
  );
}
