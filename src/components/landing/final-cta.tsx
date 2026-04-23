import Link from "next/link";

export function FinalCta() {
  return (
    <section className="px-10 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tether-tight text-warm md:text-5xl">
          Stop guessing. Start{" "}
          <span className="text-teal">closing.</span>
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-muted">
          Start with the free Napkin Value tool. Upgrade when you&apos;re ready
          to take the deal seriously.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/napkin" className="btn-primary">
            Try Napkin Value — free
          </Link>
          <Link href="/pricing" className="btn-secondary">
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
