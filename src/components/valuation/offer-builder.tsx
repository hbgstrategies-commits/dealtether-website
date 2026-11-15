"use client";

import { useMemo, useState } from "react";
import { fmt } from "@/lib/valuation";
import type { NapkinResult } from "@/lib/napkin-model";
import {
  BUYER_ALTERNATIVES,
  BUYER_CONCERNS,
  SELLER_ALTERNATIVES,
  SELLER_INTERESTS,
  STAGES,
  buildCriteria,
  buildMessages,
  buildPackages,
  buildPlan,
  buildQuestions,
  contextFromValuation,
  matchStructures,
  suggestedConcerns,
  type BuyerConcern,
  type SellerInterest,
} from "@/lib/offer-builder";

const CARD = "rounded-xl border border-teal-bd bg-navy-100 p-4 md:p-5";
const TILE = "rounded-lg border border-teal-bd bg-navy p-3";
const TH = "border-b border-teal-bd px-2 py-2 text-right text-[11px] font-medium text-muted first:text-left";
const TD = "px-2 py-2 text-right text-[13px] text-warm first:text-left first:text-muted";

const PURPOSE_COLOR: Record<string, string> = {
  "Reduce risk": "border-amber/40 bg-amber/10 text-amber",
  "Free up cash": "border-[#5BA3E8]/40 bg-[#5BA3E8]/10 text-[#5BA3E8]",
  "Increase alignment": "border-teal-bd bg-teal-bg text-teal",
};

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function OfferBuilder(props: {
  r: NapkinResult;
  businessName: string;
  askingPrice: number;
  sbaRate: number;
  sbaMonths: number;
  scores: { clientConcentration: number; team: number };
}) {
  const { r, askingPrice } = props;
  const suggested = useMemo(() => suggestedConcerns(r, askingPrice, props.scores), [r, askingPrice, props.scores]);

  const [myAlternatives, setMyAlternatives] = useState<string[]>([]);
  const [theirAlternatives, setTheirAlternatives] = useState<string[]>([]);
  const [interests, setInterests] = useState<SellerInterest[]>([]);
  const [concerns, setConcerns] = useState<BuyerConcern[]>(suggested);
  const [myInterests, setMyInterests] = useState("");
  const [stage, setStage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const ctx = useMemo(
    () => contextFromValuation(r, askingPrice, props.sbaRate, props.sbaMonths),
    [r, askingPrice, props.sbaRate, props.sbaMonths]
  );
  const matches = useMemo(() => matchStructures(interests, concerns, ctx), [interests, concerns, ctx]);
  const packages = useMemo(() => buildPackages(ctx, matches), [ctx, matches]);
  const plan = buildPlan(ctx);
  const criteria = buildCriteria(r, askingPrice);
  const questions = buildQuestions(interests, askingPrice);
  const messages = buildMessages(ctx);
  const fits = matches.filter((m) => m.score > 0);
  const shown = showAll ? matches : fits.slice(0, 5);
  const nothingTicked = interests.length === 0 && concerns.length === 0;

  function print() {
    document.body.classList.add("print-offer-plan");
    window.print();
    document.body.classList.remove("print-offer-plan");
  }

  return (
    <div className="space-y-4" data-testid="offer-builder">
      <Section
        n={1}
        title="Prepare before you talk numbers"
        sub="A few minutes here changes the whole conversation. Tick what applies — your best guess is fine, and you can update it after you've talked with the seller."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CheckGroup
            title="If this deal falls through, I would…"
            hint={
              myAlternatives.length >= 2
                ? "You have real alternatives — you can afford to walk away."
                : "The more real alternatives you have, the less pressure you'll feel to overpay."
            }
            options={BUYER_ALTERNATIVES.map((a) => ({ key: a, label: a }))}
            selected={myAlternatives}
            onToggle={(k) => setMyAlternatives((p) => toggle(p, k))}
          />
          <CheckGroup
            title="If this deal falls through, the seller would probably…"
            hint="A seller with few alternatives values certainty; one with many will hold out on price."
            options={SELLER_ALTERNATIVES.map((a) => ({ key: a, label: a }))}
            selected={theirAlternatives}
            onToggle={(k) => setTheirAlternatives((p) => toggle(p, k))}
          />
          <CheckGroup
            title="What the seller cares about"
            hint="Price is rarely the only thing. Ask why they want what they say they want."
            options={SELLER_INTERESTS}
            selected={interests}
            onToggle={(k) => setInterests((p) => toggle(p, k as SellerInterest))}
          />
          <CheckGroup
            title="What worries you about this deal"
            hint="Items marked “from your valuation” were flagged by the numbers you entered."
            options={BUYER_CONCERNS.map((c) => ({ ...c, badge: suggested.includes(c.key) ? "from your valuation" : undefined }))}
            selected={concerns}
            onToggle={(k) => setConcerns((p) => toggle(p, k as BuyerConcern))}
          />
        </div>
        <label className="mt-4 block text-[12px] text-muted">
          What matters most to you in this deal? (for your own notes — it prints on your plan)
          <textarea
            className="mt-1.5 w-full rounded-lg border border-teal-bd bg-navy px-3 py-2 text-sm text-warm outline-none focus:border-teal"
            rows={2}
            value={myInterests}
            onChange={(e) => setMyInterests(e.target.value)}
            placeholder="e.g. Keep the team, cash flow of at least $10k/month, seller available for 6 months"
          />
        </label>
      </Section>

      <Section
        n={2}
        title="Structures that fit this deal"
        sub="Matched to what you ticked above. Creative terms do three jobs: reduce your risk, free up cash, and keep the seller pulling in the same direction."
      >
        {nothingTicked ? (
          <div className="rounded-lg border border-teal-bd bg-navy p-3 text-[13px] text-muted">
            Tick at least one seller interest or concern above to see which structures fit.
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((m) => (
              <div key={m.key} className={TILE} data-testid={`structure-${m.key}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-warm">{m.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${PURPOSE_COLOR[m.purpose]}`}>{m.purpose}</span>
                </div>
                <div className="mt-1 text-[12px] leading-relaxed text-muted">{m.what}</div>
                <div className="mt-2 rounded-md border-l-2 border-teal bg-teal-bg px-2.5 py-1.5 text-[12px] text-warm">{m.example}</div>
                {m.why.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.why.map((w) => (
                      <span key={w} className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] text-muted">{w}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="mt-3 text-[12px] text-teal underline-offset-2 hover:underline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show only the best fits" : `Show all ${matches.length} structures`}
        </button>
      </Section>

      <Section
        n={3}
        title="Three offers to put side by side"
        sub="Same business, three ways to pay for it. Presenting options keeps the conversation on trade-offs instead of a tug-of-war over one number. Each assumes 10% down and the rest on your SBA terms."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr>
                <th className={TH} />
                {packages.map((p) => (
                  <th key={p.key} className={TH + " !text-[13px] !text-warm"}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <PRow label="Total price" values={packages.map((p) => fmt(p.headlinePrice))} bold testId="pkg-price" />
              <PRow label="Seller gets at closing" values={packages.map((p) => fmt(p.sellerCashAtClose))} />
              <PRow label="Seller note" values={packages.map((p) => (p.sellerNote ? fmt(p.sellerNote) : "—"))} />
              <PRow label="Tied to performance" values={packages.map((p) => (p.contingent ? `${fmt(p.contingent)} · ${p.contingentLabel}` : "—"))} />
              <PRow label="Your cash in" values={packages.map((p) => fmt(p.buyerCash))} />
              <PRow label="Loan payments per year" values={packages.map((p) => fmt(p.annualDebtService))} />
              <tr className="border-t border-teal-bd/60">
                <td className={TD + " !font-medium !text-warm"}>Year-1 DSCR</td>
                {packages.map((p) => (
                  <td key={p.key} className={`${TD} font-semibold ${p.dscr >= r.settings.yourMinDscr ? "!text-teal" : p.dscr >= r.settings.bankMinDscr ? "!text-amber" : "!text-danger"}`}>
                    {p.dscr.toFixed(2)}x
                  </td>
                ))}
              </tr>
              <PRow label="Year-1 cash after loans" values={packages.map((p) => fmt(p.cashAfterDebt))} />
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {packages.map((p) => (
            <div key={p.key} className={TILE}>
              <div className="text-[13px] font-medium text-warm">{p.name}</div>
              <div className="mt-0.5 text-[11px] text-muted">{p.pitch}</div>
              <ul className="mt-2 space-y-1 text-[12px] text-warm">
                {p.terms.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <div id="offer-plan" className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-warm">
              <span className="mr-2 text-teal">4</span>Your negotiation plan{props.businessName.trim() ? ` — ${props.businessName.trim()}` : ""}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">One page to have in front of you. Process first, numbers last, and the whole package agreed together.</p>
          </div>
          <button type="button" onClick={print} className="no-print rounded-lg border border-teal-bd px-4 py-2 text-[13px] font-medium text-teal transition-colors hover:bg-teal-bg">
            Print plan
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Open the conversation at" value={`${fmt(plan.openingLow)} – ${fmt(plan.openingHigh)}`} note="Cash offer up to concluded value" testId="plan-opening" />
          <Stat label="Top of range, if earned" value={fmt(plan.stretch)} note="Only with performance-based terms" />
          <Stat label="Walk-away number" value={fmt(plan.walkAway)} note="Above this, your alternatives are better" accent testId="plan-walkaway" />
          <Stat label="Seller's asking price" value={askingPrice > 0 ? fmt(askingPrice) : "—"} note={plan.gapToAsk > 0 ? `${fmt(plan.gapToAsk)} above walk-away` : askingPrice > 0 ? "Inside your window" : "Not entered"} />
        </div>
        {plan.gapNote && <p className="mt-3 text-[12px] leading-relaxed text-warm">{plan.gapNote}</p>}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <PlanList title="Ask before you talk numbers" hint="Listen more than you talk. Repeat back what you heard before responding." items={questions} />
          <PlanList title="Why your number is fair" hint="Point to outside standards — the bank, the comps, the earnings — not your opinion." items={criteria} />
          <PlanList title="How to say it" hint="Aim praise at the seller and bad news at the business or the bank. Be firm and warm at the same time." items={messages} />
          <div>
            <h3 className="text-[13px] font-semibold text-warm">Keep in your back pocket</h3>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-warm">
              <li>• <span className="text-muted">Your alternatives:</span> {myAlternatives.length ? myAlternatives.join("; ") : "none ticked yet — build at least one before you sit down"}</li>
              <li>• <span className="text-muted">Their likely alternatives:</span> {theirAlternatives.length ? theirAlternatives.join("; ") : "unknown — ask what they'd do without a deal"}</li>
              <li>• <span className="text-muted">What matters to you:</span> {myInterests.trim() || "not written down yet"}</li>
              <li>• <span className="text-muted">Don&apos;t agree to price alone.</span> If you settle the number first, you have nothing left to trade when terms come up.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-warm">What to commit to, and when</h3>
            <label className="no-print text-[12px] text-muted">
              Where are you now?{" "}
              <select aria-label="Deal stage" className="ml-1 rounded-md border border-teal-bd bg-navy px-2 py-1 text-[12px] text-warm" value={stage} onChange={(e) => setStage(Number(e.target.value))}>
                {STAGES.map((s, i) => (
                  <option key={s.stage} value={i}>{s.stage}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Stage</th>
                  <th className={TH + " !text-left"}>Agree on the process</th>
                  <th className={TH + " !text-left"}>Agree on the deal</th>
                </tr>
              </thead>
              <tbody>
                {STAGES.map((s, i) => (
                  <tr key={s.stage} className={i === stage ? "bg-teal-bg" : ""}>
                    <td className={`px-2 py-2 text-[13px] ${i === stage ? "font-semibold text-teal" : "text-muted"}`}>{i + 1}. {s.stage}{i === stage ? " ← you are here" : ""}</td>
                    <td className="px-2 py-2 text-[12px] text-warm">{s.process}</td>
                    <td className="px-2 py-2 text-[12px] text-warm">{s.substance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="text-[16px] font-semibold text-warm">
        <span className="mr-2 text-teal">{n}</span>
        {title}
      </h2>
      <p className="mb-4 mt-1 text-[12px] leading-relaxed text-muted">{sub}</p>
      {children}
    </section>
  );
}

function CheckGroup({ title, hint, options, selected, onToggle }: {
  title: string;
  hint: string;
  options: readonly { key: string; label: string; badge?: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <fieldset className={TILE}>
      <legend className="sr-only">{title}</legend>
      <div className="text-[13px] font-medium text-warm">{title}</div>
      <div className="mb-2 mt-0.5 text-[11px] leading-snug text-muted">{hint}</div>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.key} className="flex cursor-pointer items-start gap-2 text-[13px] text-warm">
            <input type="checkbox" className="mt-0.5 accent-[#00C9A7]" checked={selected.includes(o.key)} onChange={() => onToggle(o.key)} />
            <span>
              {o.label}
              {o.badge && <span className="ml-2 rounded-full border border-amber/40 bg-amber/10 px-1.5 py-px text-[10px] text-amber">{o.badge}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PRow({ label, values, bold, testId }: { label: string; values: string[]; bold?: boolean; testId?: string }) {
  return (
    <tr data-testid={testId}>
      <td className={TD + (bold ? " !font-medium !text-warm" : "")}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`${TD} ${bold ? "font-semibold" : ""}`}>{v}</td>
      ))}
    </tr>
  );
}

function Stat({ label, value, note, accent, testId }: { label: string; value: string; note: string; accent?: boolean; testId?: string }) {
  return (
    <div className={TILE} data-testid={testId}>
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-[17px] font-semibold ${accent ? "text-teal" : "text-warm"}`}>{value}</div>
      <div className="text-[11px] leading-snug text-muted">{note}</div>
    </div>
  );
}

function PlanList({ title, hint, items }: { title: string; hint: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-warm">{title}</h3>
      <div className="mt-0.5 text-[11px] leading-snug text-muted">{hint}</div>
      <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-warm">
        {items.map((q) => (
          <li key={q}>• {q}</li>
        ))}
      </ul>
    </div>
  );
}
