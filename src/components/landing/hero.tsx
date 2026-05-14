import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-[860px] px-6 pb-14 pt-16 text-center md:px-10 md:pb-16 md:pt-[5.5rem]">
      <div className="eyebrow-pill mb-6 md:mb-8">
        Built by an operator who has closed $60M+ in acquisitions
      </div>
      <h1 className="mb-5 text-[40px] font-bold leading-[1.08] tracking-tether-tighter text-warm md:mb-6 md:text-[54px]">
        Buy a Business
        <br />
        Without <em className="not-italic text-teal">Guessing</em>
      </h1>
      <p className="mx-auto mb-4 max-w-[600px] text-[17px] font-normal leading-relaxed text-muted md:text-[20px]">
        Know the numbers. Structure the deal. Close with confidence.
      </p>
      <p className="mb-8 text-[14px] italic text-muted/70 md:mb-10 md:text-[15px]">
        Most buyers overpay, miss critical risks, or watch the deal collapse before close.
        <br className="hidden sm:block" />
        Tether is the acquisition system that prevents all three.
      </p>
      <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="/pricing"
          className="w-full rounded-[9px] bg-teal px-[30px] py-[13px] text-[15px] font-bold text-navy transition-all hover:-translate-y-px hover:bg-teal-dim sm:w-auto"
          style={{ letterSpacing: "-0.1px" }}
        >
          Start 30-day free trial
        </a>
        <Link
          href="#how-it-works"
          className="w-full rounded-[9px] border border-[0.5px] border-border px-[28px] py-[13px] text-[15px] font-medium text-warm transition-colors hover:bg-navy-100 sm:w-auto"
        >
          See how it works
        </Link>
      </div>
      <p className="text-xs text-muted">
        Free for 30 days &nbsp;·&nbsp; then $147/mo &nbsp;·&nbsp; Card required at signup &nbsp;·&nbsp; Cancel anytime
      </p>
    </section>
  );
}
