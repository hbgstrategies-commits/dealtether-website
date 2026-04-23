import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-10 pb-16 pt-22 text-center">
      <div className="eyebrow-pill mb-8">
        Built by an operator who has closed $60M+ in acquisitions
      </div>
      <h1 className="mb-6 text-[54px] font-bold leading-[1.08] tracking-tether-tighter text-warm md:text-[60px]">
        Buy a Business
        <br />
        Without <em className="not-italic text-teal">Guessing</em>
      </h1>
      <p className="mx-auto mb-4 max-w-xl text-[20px] leading-relaxed text-muted">
        Know the numbers. Structure the deal. Close with confidence.
      </p>
      <p className="mb-10 text-[15px] italic text-muted/70">
        Most buyers overpay, miss critical risks, or watch the deal collapse
        before close.
        <br />
        Tether is the acquisition system that prevents all three.
      </p>
      <div className="mb-5 flex flex-wrap justify-center gap-3">
        <Link href="/napkin" className="btn-primary">
          Analyze a deal — free
        </Link>
        <Link href="#how-it-works" className="btn-secondary">
          See how it works
        </Link>
      </div>
      <p className="text-xs text-muted">
        Napkin Value free &nbsp;·&nbsp; Financial analysis from $10/use
        &nbsp;·&nbsp; Deal execution from $497 &nbsp;·&nbsp; Team invites free
      </p>
    </section>
  );
}
