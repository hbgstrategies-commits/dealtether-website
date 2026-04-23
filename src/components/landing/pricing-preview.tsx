import Link from "next/link";
import { Check } from "lucide-react";

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="border-y border-[0.5px] border-border bg-navy-100 px-10 py-20"
    >
      <div className="mx-auto max-w-5xl">
        <p className="sec-label-teal mb-3">Pricing</p>
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tether-tight text-warm">
          What a mistake costs vs. what Tether costs
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-[15px] leading-relaxed text-muted">
          Overpaying $200K because you missed add-backs. $15K in legal fees on a
          deal that collapsed. The downside of getting this wrong dwarfs what
          Tether costs.
        </p>

        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[0.5px] border-danger/20 bg-navy p-6">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-danger">
              What mistakes cost
            </div>
            <ul className="flex flex-col gap-2">
              {[
                ["Overpaying due to missed add-backs", "$50K – $300K"],
                ["Legal fees on a failed deal", "$8K – $20K"],
                ["CPA for quality of earnings", "$3K – $8K"],
                ["Acquisition advisor fees", "$5K – $15K"],
                ["6 months of your time wasted", "Incalculable"],
              ].map(([l, v]) => (
                <li
                  key={l}
                  className="flex justify-between border-b border-[0.5px] border-border py-2 text-sm text-muted last:border-b-0"
                >
                  <span>{l}</span>
                  <span className="font-semibold text-warm">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-teal-bd bg-teal-bg p-6 text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal">
              Tether Pro
            </div>
            <div className="mb-1 text-5xl font-bold tracking-tether-tighter text-warm">
              $—
            </div>
            <div className="mb-4 text-xs text-muted">
              per month · pays for itself
            </div>
            <ul className="mb-5 flex flex-col gap-2 text-left text-sm text-warm">
              {[
                "Napkin Value — free + unlimited",
                "Quality of Earnings Mapper",
                "Full DD execution workspace",
                "Magic link team access",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="btn-primary w-full">
              See full pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
