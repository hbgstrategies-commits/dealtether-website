export function FinalCta() {
  return (
    <section className="border-t border-[0.5px] border-border px-5 py-14 text-center md:px-10 md:py-20" style={{ background: "var(--navy2)" }}>
      <h2 className="mb-3 text-[32px] font-bold leading-tight text-warm md:text-[40px]" style={{ letterSpacing: "-1px" }}>
        Stop guessing. Start <span className="text-teal">closing.</span>
      </h2>
      <p className="mx-auto mb-8 max-w-lg text-[15px] leading-relaxed text-muted md:text-[16px]">
        Try Tether free for 30 days. Card required at signup — you won&apos;t be charged until day 31.
        <br />
        One bad acquisition decision costs more than a year of Tether.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="/pricing"
          className="w-full rounded-[9px] bg-teal px-[30px] py-[13px] text-[15px] font-bold text-navy transition-all hover:-translate-y-px hover:bg-teal-dim sm:w-auto"
          style={{ letterSpacing: "-0.1px" }}
        >
          Start 30-day free trial
        </a>
        <a
          href="#how-it-works"
          className="w-full rounded-[9px] border border-[0.5px] border-border px-[28px] py-[13px] text-[15px] font-medium text-warm transition-colors hover:bg-navy-100 sm:w-auto"
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
