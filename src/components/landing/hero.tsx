import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-[860px] px-10 pb-16 pt-[5.5rem] text-center">
      <div className="eyebrow-pill mb-8">
        Built by an operator who has closed $60M+ in acquisitions
      </div>
      <h1 className="mb-6 text-[54px] font-bold leading-[1.08] tracking-tether-tighter text-warm">
        Buy a Business
        <br />
        Without <em className="not-italic text-teal">Guessing</em>
      </h1>
      <p className="mx-auto mb-4 max-w-[600px] text-[20px] font-normal leading-relaxed text-muted">
        Know the numbers. Structure the deal. Close with confidence.
      </p>
      <p className="mb-10 text-[15px] italic text-muted/70">
        Most buyers overpay, miss critical risks, or watch the deal collapse before close.
        <br />
        Tether is the acquisition system that prevents all three.
      </p>
      <div className="mb-5 flex flex-wrap justify-center gap-3">
        <a
          href="https://buy.stripe.com/14AfZieqPfSp3aR1wxcIE04"
          className="inline-block rounded-[9px] bg-teal px-[30px] py-[13px] text-[15px] font-bold text-navy transition-all hover:-translate-y-px hover:bg-teal-dim"
          style={{ letterSpacing: "-0.1px" }}
        >
          Start free — 1 month free
        </a>
        <Link
          href="#how-it-works"
          className="inline-block rounded-[9px] border border-[0.5px] border-border px-[28px] py-[13px] text-[15px] font-medium text-warm transition-colors hover:bg-navy-100"
        >
          See how it works
        </Link>
      </div>
      <p className="text-xs text-muted">
        First month free &nbsp;·&nbsp; $147/mo after &nbsp;·&nbsp; Cancel anytime
      </p>
    </section>
  );
}
