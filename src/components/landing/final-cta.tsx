export function FinalCta() {
  return (
    <section className="border-t border-[0.5px] border-border px-10 py-20 text-center" style={{ background: "var(--navy2)" }}>
      <h2 className="mb-3 text-[40px] font-bold leading-tight text-warm" style={{ letterSpacing: "-1px" }}>
        Stop guessing. Start <span className="text-teal">closing.</span>
      </h2>
      <p className="mx-auto mb-8 max-w-lg text-[16px] leading-relaxed text-muted">
        Your first month is free. No credit card required to start.
        <br />
        One bad acquisition decision costs more than a year of Tether.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="/pricing"
          className="inline-block rounded-[9px] bg-teal px-[30px] py-[13px] text-[15px] font-bold text-navy transition-all hover:-translate-y-px hover:bg-teal-dim"
          style={{ letterSpacing: "-0.1px" }}
        >
          Start free — 1 month free
        </a>
        <a
          href="#how-it-works"
          className="inline-block rounded-[9px] border border-[0.5px] border-border px-[28px] py-[13px] text-[15px] font-medium text-warm transition-colors hover:bg-navy-100"
        >
          See how it works
        </a>
      </div>
      <p className="mt-4 text-[12px] text-muted">
        Questions? Email{" "}
        <a href="mailto:hbgstrategies@gmail.com" className="text-teal no-underline hover:underline">
          hbgstrategies@gmail.com
        </a>
      </p>
    </section>
  );
}
