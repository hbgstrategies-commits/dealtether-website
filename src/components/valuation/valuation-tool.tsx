"use client";

import { useEffect, useMemo, useState } from "react";
import { exportDealAnalyzerPDF } from "@/lib/pdf-export";
import { fmt, fmtM, fmtP } from "@/lib/valuation";
import {
  runNapkinModel,
  SEASONALITY_PROFILES,
  SUBJECTIVE_FACTORS,
  type Loan,
  type NapkinResult,
  type Num,
  type SeasonalityKey,
  type SubjectiveKey,
} from "@/lib/napkin-model";
import { STATE_TAX } from "@/lib/napkin-model-data";
import { TrendChart } from "@/components/napkin/trend-chart";

type Step = 1 | 2 | 3 | 4;
type Pair = { revenue: string; sde: string };

const STEPS = ["Financials", "Quality", "Valuation", "Deal & cash flow"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CARD = "rounded-xl border border-teal-bd bg-navy-100 p-4 md:p-5";
const TILE = "rounded-lg border border-teal-bd bg-navy p-3";
const INPUT =
  "w-full rounded-lg border border-teal-bd bg-navy px-3 py-2 text-sm text-warm outline-none placeholder:text-muted/50 focus:border-teal";
const TH = "border-b border-teal-bd px-2 py-2 text-right text-[11px] font-medium text-muted first:text-left";
const TD = "px-2 py-2 text-right text-[13px] text-warm first:text-left first:text-muted";

function num(s: string): Num {
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : null;
}

const withCommas = (s: string) => {
  const v = num(s);
  return v == null ? "" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const x2 = (v: number | null) => (v == null || !Number.isFinite(v) ? "—" : v.toFixed(2) + "x");

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_COLOR: Record<string, string> = {
  Comfortable: "text-teal",
  Acceptable: "text-teal",
  "Bank-only": "text-amber",
  "Fails bank": "text-danger",
};

const LEVEL_COLOR: Record<string, string> = { High: "text-teal", Medium: "text-amber", Low: "text-danger" };

export function ValuationTool({ today: todayProp }: { today?: string }) {
  const today = useMemo(() => (todayProp ? new Date(todayProp + "T12:00:00") : new Date()), [todayProp]);
  const lastYear = today.getFullYear() - 1;
  const yearLabels = [lastYear - 2, lastYear - 1, lastYear];
  const ytdYear = lastYear + 1;

  const [step, setStep] = useState<Step>(1);
  const [maxStep, setMaxStep] = useState<Step>(1);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [years, setYears] = useState<Pair[]>([
    { revenue: "", sde: "" },
    { revenue: "", sde: "" },
    { revenue: "", sde: "" },
  ]);
  const [ytd, setYtd] = useState<Pair>({ revenue: "", sde: "" });
  const [ytdDate, setYtdDate] = useState(() => isoDate(new Date(today.getFullYear(), today.getMonth(), 0)));
  const [ytdPeriod, setYtdPeriod] = useState<"auto" | "full" | "partial">("auto");
  const [seasonality, setSeasonality] = useState<SeasonalityKey>("even");
  const [customMonths, setCustomMonths] = useState<string[]>(() => Array(12).fill("8.33"));

  // Step 2
  const [scores, setScores] = useState<Record<SubjectiveKey, number>>(
    () => Object.fromEntries(SUBJECTIVE_FACTORS.map((f) => [f.key, 3])) as Record<SubjectiveKey, number>
  );
  const [usePmComps, setUsePmComps] = useState(true);
  const [aggressive, setAggressive] = useState(false);

  // Step 4
  const [offerPrice, setOfferPrice] = useState("");
  const [downPct, setDownPct] = useState("10");
  const [sbaRate, setSbaRate] = useState("9.5");
  const [sbaYears, setSbaYears] = useState("10");
  const [sellerNote, setSellerNote] = useState({ amount: "", rate: "6", years: "6" });
  const [forgivable, setForgivable] = useState({ amount: "", rate: "6", years: "5" });
  const [earnout, setEarnout] = useState("");
  const [growthOverrides, setGrowthOverrides] = useState<string[]>(["", "", "", "", ""]);
  const [capex, setCapex] = useState<string[]>(["", "", "", "", ""]);
  const [otherCosts, setOtherCosts] = useState<string[]>(["", "", "", "", ""]);

  // Pre-fill from the Quality of Earnings tool ("Take to Deal Analyzer").
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tether_qoe_handoff");
      if (!raw) return;
      localStorage.removeItem("tether_qoe_handoff");
      const handoff = JSON.parse(raw) as { years: { label: string; revenue: number; sde: number }[] };
      if (!Array.isArray(handoff.years) || handoff.years.length === 0) return;
      const recent = handoff.years.slice(-3);
      const offset = 3 - recent.length;
      setYears((prev) =>
        prev.map((p, i) => {
          const src = recent[i - offset];
          if (!src) return p;
          return {
            revenue: src.revenue > 0 ? src.revenue.toLocaleString("en-US") : "",
            sde: src.sde > 0 ? src.sde.toLocaleString("en-US") : "",
          };
        })
      );
    } catch {
      // ignore unreadable handoff data
    }
  }, []);

  const price = num(offerPrice) ?? num(askingPrice) ?? 0;
  const buyerCash = (price * (num(downPct) ?? 0)) / 100;
  const sellerNoteAmt = num(sellerNote.amount) ?? 0;
  const forgivableAmt = num(forgivable.amount) ?? 0;
  const earnoutAmt = num(earnout) ?? 0;
  const sbaAmount = Math.max(0, price - buyerCash - sellerNoteAmt - forgivableAmt - earnoutAmt);
  const overAllocated = price > 0 && buyerCash + sellerNoteAmt + forgivableAmt + earnoutAmt > price + 0.5;

  const ready = (num(years[2].revenue) ?? 0) > 0 && (num(years[2].sde) ?? 0) > 0;

  const result: NapkinResult | null = useMemo(() => {
    if (!ready) return null;
    const loan = (amount: number, rate: string, yrs: string): Loan => ({
      amount,
      rate: (num(rate) ?? 0) / 100,
      months: Math.round((num(yrs) ?? 0) * 12),
    });
    return runNapkinModel({
      today,
      years: years.map((y) => ({ revenue: num(y.revenue), sde: num(y.sde) })),
      ytd: { revenue: num(ytd.revenue), sde: num(ytd.sde) },
      ytdDate: ytdDate || isoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
      ytdPeriod,
      seasonality,
      customSeasonality: customMonths.map((m) => (num(m) ?? 0) / 100),
      askingPrice: num(askingPrice) ?? 0,
      state: stateCode,
      scores,
      growthOverrides: growthOverrides.map((g) => {
        const v = num(g);
        return v == null ? null : v / 100;
      }),
      capex: capex.map((c) => num(c) ?? 0),
      creativeExpense: otherCosts.map((c) => num(c) ?? 0),
      structure: {
        sba: loan(sbaAmount, sbaRate, sbaYears),
        sellerNote: loan(sellerNoteAmt, sellerNote.rate, sellerNote.years),
        buyerCash,
        forgivableNote: loan(forgivableAmt, forgivable.rate, forgivable.years),
        earnout: earnoutAmt,
      },
      usePmComps,
      aggressive,
    });
  }, [
    ready, today, years, ytd, ytdDate, ytdPeriod, seasonality, customMonths, askingPrice, stateCode, scores,
    growthOverrides, capex, otherCosts, sbaAmount, sbaRate, sbaYears, sellerNoteAmt, sellerNote.rate,
    sellerNote.years, buyerCash, forgivableAmt, forgivable.rate, forgivable.years, earnoutAmt, usePmComps, aggressive,
  ]);

  function go(next: Step) {
    setStep(next);
    setMaxStep((m) => (next > m ? next : m));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div data-testid="valuation-tool">
      <Stepper step={step} maxStep={maxStep} canAdvance={!!result} onChange={go} />

      {step === 1 && (
        <div className="space-y-4">
          <Section title="The business" sub="Name it, tell us where it is, and what the seller is asking.">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Business name">
                <input className={INPUT} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Acme Property Management" />
              </Field>
              <Field label="State (sets the income tax estimate)">
                <select aria-label="State" className={INPUT} value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
                  <option value="">Select a state…</option>
                  {STATE_TAX.map((t) => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Asking price">
                <Money label="Asking price" value={askingPrice} onChange={setAskingPrice} />
              </Field>
            </div>
          </Section>

          <Section
            title="Financial inputs"
            sub={`Enter gross revenue and adjusted earnings (SDE or EBITDA) from the target's financials. ${lastYear} is required; the more history, the more confident the result.`}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <th className={TH} />
                    {yearLabels.map((y) => (
                      <th key={y} className={TH + " !text-center"}>{y}</th>
                    ))}
                    <th className={TH + " !text-center !text-teal"}>{ytdYear} year-to-date</th>
                  </tr>
                </thead>
                <tbody>
                  {(["revenue", "sde"] as const).map((field) => (
                    <tr key={field}>
                      <td className="px-2 py-1.5 text-[13px] font-medium text-warm">
                        {field === "revenue" ? "Gross revenue" : "Adjusted SDE"}
                      </td>
                      {years.map((y, i) => (
                        <td key={i} className="px-1.5 py-1.5">
                          <Money
                            label={`${yearLabels[i]} ${field === "revenue" ? "revenue" : "SDE"}`}
                            value={y[field]}
                            onChange={(v) => setYears((prev) => prev.map((p, j) => (j === i ? { ...p, [field]: v } : p)))}
                          />
                        </td>
                      ))}
                      <td className="px-1.5 py-1.5">
                        <Money
                          label={`${ytdYear} YTD ${field === "revenue" ? "revenue" : "SDE"}`}
                          value={ytd[field]}
                          onChange={(v) => setYtd((p) => ({ ...p, [field]: v }))}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-1.5 text-[12px] text-muted">SDE margin</td>
                    {[...years, ytd].map((y, i) => {
                      const r = num(y.revenue);
                      const s = num(y.sde);
                      return (
                        <td key={i} className="px-2 py-1.5 text-center text-[12px] font-medium text-teal">
                          {r && s ? fmtP(s / r) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Field label="YTD through (last closed month)">
                <input aria-label="YTD through date" type="date" className={INPUT} value={ytdDate} onChange={(e) => setYtdDate(e.target.value)} />
              </Field>
              <Field label="YTD period">
                <select aria-label="YTD period" className={INPUT} value={ytdPeriod} onChange={(e) => setYtdPeriod(e.target.value as typeof ytdPeriod)}>
                  <option value="auto">Auto (from the date)</option>
                  <option value="full">Full year</option>
                  <option value="partial">Partial year</option>
                </select>
              </Field>
              <Field label="Seasonality — when is revenue earned?">
                <select aria-label="Seasonality" className={INPUT} value={seasonality} onChange={(e) => setSeasonality(e.target.value as SeasonalityKey)}>
                  {(Object.keys(SEASONALITY_PROFILES) as SeasonalityKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SEASONALITY_PROFILES[k].label} — {SEASONALITY_PROFILES[k].hint}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {seasonality === "custom" && (
              <div className="mt-3">
                <div className="mb-2 text-[12px] text-muted">
                  Share of annual revenue earned each month (%). Must total 100% — currently{" "}
                  <span className="text-warm">{customMonths.reduce((a, m) => a + (num(m) ?? 0), 0).toFixed(1)}%</span>.
                </div>
                <div className="grid grid-cols-4 gap-2 md:grid-cols-12">
                  {MONTHS.map((m, i) => (
                    <label key={m} className="text-center text-[10px] text-muted">
                      {m}
                      <input
                        className={INPUT + " mt-1 !px-1 text-center"}
                        inputMode="decimal"
                        value={customMonths[i]}
                        onChange={(e) => setCustomMonths((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {result ? <ForecastPanel r={result} /> : (
            <div className={CARD + " text-[13px] text-muted"}>
              Enter {lastYear} revenue and SDE to see the forecast.
            </div>
          )}

          <Nav next={result ? () => go(2) : undefined} nextLabel="Next: rate the business →" />
        </div>
      )}

      {step === 2 && result && (
        <div className="space-y-4">
          <Section
            title="Your read on the business"
            sub="Score each area from 1 (weak) to 5 (excellent). These are the judgment calls only you can make — 3 is an average business."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {SUBJECTIVE_FACTORS.map((f) => (
                <div key={f.key} className={TILE}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-warm">{f.label}</span>
                    <span className="text-[15px] font-semibold text-teal">{scores[f.key].toFixed(2)}</span>
                  </div>
                  <input
                    aria-label={f.label}
                    type="range"
                    min={1}
                    max={5}
                    step={0.25}
                    value={scores[f.key]}
                    onChange={(e) => setScores((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className="mt-2 w-full accent-[#00C9A7]"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>{f.low}</span>
                    <span className="text-right">{f.high}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="What the numbers say"
            sub="These adjustments are scored automatically from the financials you entered and added to your average."
          >
            <table className="w-full border-collapse">
              <tbody>
                {result.quality.objective.map((o) => (
                  <tr key={o.key} className="border-b border-teal-bd/50 last:border-0">
                    <td className="py-2 text-[13px] text-warm">{o.label}</td>
                    <td className="py-2 text-[12px] text-muted">{o.detail}</td>
                    <td className={`py-2 text-right text-[13px] font-medium ${o.score > 0 ? "text-teal" : o.score < 0 ? "text-danger" : "text-muted"}`}>
                      {o.score > 0 ? "+" : ""}{o.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Stat label="Your average score" value={result.quality.subjectiveAvg.toFixed(2)} />
              <Stat label="Automatic adjustments" value={(result.quality.objectiveTotal >= 0 ? "+" : "") + result.quality.objectiveTotal.toFixed(2)} />
              <Stat label="Quality score" value={result.quality.score.toFixed(2)} note={`${Math.round(result.quality.bandPosition * 100)}% of the way through the multiple range`} accent />
            </div>
          </Section>

          <div className={CARD}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 accent-[#00C9A7]" checked={usePmComps} onChange={(e) => setUsePmComps(e.target.checked)} />
              <span>
                <span className="block text-[13px] font-medium text-warm">Blend in property-management comps</span>
                <span className="block text-[12px] leading-relaxed text-muted">
                  Mixes actual sale multiples from recent property-management acquisitions into the multiple range. Turn this off if the target is in a different industry.
                </span>
              </span>
            </label>
          </div>

          <Nav back={() => go(1)} next={() => go(3)} nextLabel="See the valuation →" />
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-4">
          <ValuationStep r={result} askingPrice={num(askingPrice) ?? 0} aggressive={aggressive} setAggressive={setAggressive} />
          <Nav back={() => go(2)} next={() => go(4)} nextLabel="Next: structure the deal →" />
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-4">
          <Section
            title="Structure the deal"
            sub="Pick a price, then decide how it gets paid. The SBA loan covers whatever the other pieces don't."
          >
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                ["Cash offer", result.priceWindow.cashOffer],
                ["Fair market value", result.fairMarketValue],
                ["Concluded value", result.concludedValue],
                ["Creative ceiling", result.priceWindow.creativeCeiling],
                ...(num(askingPrice) ? [["Asking price", num(askingPrice) as number]] : []),
              ].map(([label, value]) => (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => setOfferPrice(Math.round(value as number).toLocaleString("en-US"))}
                  className="rounded-full border border-teal-bd bg-teal-bg px-3 py-1.5 text-[12px] text-teal transition-colors hover:bg-teal hover:text-navy"
                >
                  {label} · {fmt(value as number)}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Offer price">
                <Money label="Offer price" value={offerPrice} onChange={setOfferPrice} placeholder={askingPrice || "0"} />
              </Field>
              <Field label="Your cash down (%)">
                <input aria-label="Cash down percent" className={INPUT} inputMode="decimal" value={downPct} onChange={(e) => setDownPct(e.target.value)} />
              </Field>
              <Field label="SBA rate (%)">
                <input aria-label="SBA rate" className={INPUT} inputMode="decimal" value={sbaRate} onChange={(e) => setSbaRate(e.target.value)} />
              </Field>
              <Field label="SBA term (years)">
                <input aria-label="SBA term" className={INPUT} inputMode="decimal" value={sbaYears} onChange={(e) => setSbaYears(e.target.value)} />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <NoteCard title="Seller note" v={sellerNote} set={setSellerNote} />
              <NoteCard title="Forgivable seller note" v={forgivable} set={setForgivable} />
              <div className={TILE}>
                <div className="mb-2 text-[13px] font-medium text-warm">Earnout</div>
                <Money label="Earnout" value={earnout} onChange={setEarnout} />
                <div className="mt-2 text-[11px] leading-relaxed text-muted">Paid later from performance — counts toward the price but carries no loan payment.</div>
              </div>
            </div>
            {overAllocated && (
              <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                The cash, notes and earnout add up to more than the offer price.
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Purchase price" value={fmt(result.structure.purchasePrice)} />
              <Stat label="SBA loan" value={fmt(sbaAmount)} note={`${fmt(result.structure.payments.sba)}/mo`} />
              <Stat label="Your cash in" value={fmt(buyerCash)} />
              <Stat label="Debt payments per year" value={fmt(result.structure.annualDebtService)} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Your financing mix sets the return an investor would require, which feeds the cash-flow valuation — so the values on the previous step shift slightly as you change the structure.
            </p>
          </Section>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Year-1 DSCR"
              value={x2(result.structure.dscr)}
              note={result.structure.dscr == null ? "No debt" : "Earnings ÷ debt payments"}
              accent
            />
            <Stat
              label="5-year IRR"
              value={result.structure.irr == null ? "—" : fmtP(result.structure.irr)}
              note={result.structure.irrVerdict ? `${result.structure.irrVerdict} vs. ${fmtP(result.structure.requiredReturn)} required` : "Enter an offer price"}
              accent
            />
            <Stat label="Year-1 cash flow" value={fmt(result.cashFlow[0].annual)} note={`${fmt(result.cashFlow[0].monthly)}/mo after tax`} />
            <Stat label="Blended cost of debt" value={fmtP(result.structure.wacc)} note={`Exit at ${result.settings.exitMultiple.toFixed(1)}x in year 5`} />
          </div>

          <Section
            title="5-year cash flow"
            sub="Growth fades toward a long-term 3% and is scaled by forecast confidence. Type over a growth rate, or add planned spending, to test your own assumptions."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className={TH} />
                    {result.cashFlow.map((c) => (
                      <th key={c.year} className={TH}>Year {c.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Revenue" values={result.cashFlow.map((c) => fmt(c.revenue))} />
                  <tr>
                    <td className={TD}>Growth (%)</td>
                    {result.cashFlow.map((c, i) => (
                      <td key={i} className="px-1 py-1">
                        <input
                          aria-label={`Year ${c.year} growth`}
                          className={INPUT + " !py-1 text-right"}
                          inputMode="decimal"
                          placeholder={(result.growth.formula[i] * 100).toFixed(2)}
                          value={growthOverrides[i]}
                          onChange={(e) => setGrowthOverrides((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
                        />
                      </td>
                    ))}
                  </tr>
                  <Row label="SDE" values={result.cashFlow.map((c) => fmt(c.sde))} bold />
                  <Row label="Interest" values={result.cashFlow.map((c) => fmt(-c.interest))} />
                  <Row label="Principal" values={result.cashFlow.map((c) => fmt(-c.principal))} />
                  <EditRow label="Capital spending" values={capex} set={setCapex} />
                  <EditRow label="Other deal costs" values={otherCosts} set={setOtherCosts} />
                  <Row label={`Income tax (${fmtP(result.taxRate)})`} values={result.cashFlow.map((c) => fmt(-c.tax))} />
                  <Row label="Cash flow — annual" values={result.cashFlow.map((c) => fmt(c.annual))} bold accent />
                  <Row label="Cash flow — monthly" values={result.cashFlow.map((c) => fmt(c.monthly))} />
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Stress test" sub="What happens to loan coverage if revenue falls. Uses standard SBA terms on your purchase price.">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH}>Scenario</th>
                    <th className={TH}>SDE</th>
                    <th className={TH}>DSCR</th>
                    <th className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.stress.map((s) => (
                    <tr key={s.drop}>
                      <td className={TD}>{Math.round(s.drop * 100)}% revenue drop</td>
                      <td className={TD}>{fmt(s.sde)}</td>
                      <td className={TD}>{result.structure.purchasePrice > 0 ? x2(s.dscr) : "—"}</td>
                      <td className={`${TD} ${STATUS_COLOR[s.status]}`}>{result.structure.purchasePrice > 0 ? s.status : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Failure point" sub="How far year-1 revenue can fall before debt coverage breaks each threshold.">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH}>DSCR threshold</th>
                    <th className={TH}>Breakeven revenue</th>
                    <th className={TH}>Cushion</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakeven.rows.map((b) => (
                    <tr key={b.threshold}>
                      <td className={TD}>{b.threshold.toFixed(2)}x</td>
                      <td className={TD}>{fmt(b.revenue)}</td>
                      <td className={`${TD} ${b.cushion <= 0 ? "text-danger" : b.cushion < 0.1 ? "text-amber" : "text-teal"}`}>{fmtP(b.cushion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-[12px] text-warm">{result.breakeven.verdict}</div>
            </Section>
          </div>

          <SaveAndExport
            r={result}
            businessName={businessName}
            askingPrice={num(askingPrice) ?? 0}
            buyerCash={buyerCash}
            sba={{ amount: sbaAmount, rate: num(sbaRate) ?? 0, years: num(sbaYears) ?? 0 }}
            note={{ amount: sellerNoteAmt, rate: num(sellerNote.rate) ?? 0, years: num(sellerNote.years) ?? 0 }}
          />

          <Nav back={() => go(3)} />
          <div className="rounded-lg border border-muted/20 bg-muted/5 px-4 py-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Disclaimer</div>
            <p className="m-0 text-[11px] leading-relaxed text-muted">
              Tether&apos;s valuation estimates, offer ranges, DSCR calculations, and IRR projections are for informational purposes only and do not constitute financial, legal, investment, or tax advice. All figures are estimates based solely on the inputs you provide. Actual business value and investment outcomes may differ materially. SBA loan eligibility is subject to lender approval and underwriting. Consult a qualified M&amp;A advisor, CPA, and lender before executing any transaction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: forecast summary ─────────────────────────────────────────────────

function ForecastPanel({ r }: { r: NapkinResult }) {
  const f = r.forecast;
  const explain =
    r.mode === "Full-Year Actual"
      ? `Your ${r.ytdYear} figures are treated as a full year of actuals — no forecast needed.`
      : r.mode === "Trend Only"
        ? `No ${r.ytdYear} year-to-date entered, so the model uses a conservative forecast from ${r.fullYears}-year history.`
        : `${fmtP(r.pctEarned)} of the year's revenue is earned by this date. The forecast blends the seasonal run-rate with the historical trend.`;
  return (
    <Section title={`${r.ytdYear} full-year forecast`} sub={explain}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Revenue forecast" value={fmt(f.revenue.forecast)} note={`${fmt(f.revenue.low)} – ${fmt(f.revenue.high)}`} />
        <Stat label="SDE forecast" value={fmt(f.sde.forecast)} note={`${fmt(f.sde.low)} – ${fmt(f.sde.high)}`} />
        <Stat label="Growth vs. last year" value={fmtP(f.revenue.impliedGrowth, true)} note={`SDE ${fmtP(f.sde.impliedGrowth, true)}`} />
        <div className={TILE}>
          <div className="text-[11px] text-muted">Forecast confidence</div>
          <div className={`text-[18px] font-semibold ${LEVEL_COLOR[r.confidence]}`}>{r.confidence}</div>
          <div className="text-[11px] text-muted">{r.regime} trend</div>
        </div>
      </div>
      {r.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {r.warnings.map((w) => (
            <li key={w} className="rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-[12px] text-amber">⚠ {w}</li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ─── Step 3: valuation ────────────────────────────────────────────────────────

function ValuationStep({ r, askingPrice, aggressive, setAggressive }: {
  r: NapkinResult;
  askingPrice: number;
  aggressive: boolean;
  setAggressive: (v: boolean) => void;
}) {
  const w = r.priceWindow;
  const points = [w.cashOffer, w.creativeCeiling, ...(askingPrice > 0 ? [askingPrice] : [])];
  const lo = Math.min(...points) * 0.94;
  const hi = Math.max(...points) * 1.06;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const markers = [
    { n: 1, label: "Cash offer", value: w.cashOffer, color: "#5BA3E8", testId: "cash-offer", note: `Concluded value less ${fmtP(w.cashDiscount)} risk discount${aggressive ? " (aggressive)" : ""}` },
    { n: 2, label: "Fair market value", value: w.fairMarketValue, color: "#F5F2EC", testId: "fair-market-value", note: "Weighted SDE × multiple" },
    { n: 3, label: "Concluded value", value: w.concludedValue, color: "#00C9A7", testId: "concluded-value", note: "Blend of three methods" },
    { n: 4, label: "Creative ceiling", value: w.creativeCeiling, color: "#B79CFF", testId: "creative-ceiling", note: w.bindingLimit },
  ];
  const chartIdx = r.history.revenue.map((v, i) => (v != null && r.history.sde[i] != null ? i : -1)).filter((i) => i >= 0);

  return (
    <>
      <Section
        title="Price window"
        sub="From the lowest all-cash offer to the most you could justify when buyer and seller share risk through deal terms."
      >
        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-teal-bd bg-navy p-3">
          <input
            type="checkbox"
            role="switch"
            aria-label="Aggressive offer"
            className="peer sr-only"
            checked={aggressive}
            onChange={(e) => setAggressive(e.target.checked)}
          />
          <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full border border-teal-bd bg-navy-100 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-muted after:transition-all peer-checked:border-teal peer-checked:bg-teal peer-checked:after:left-[18px] peer-checked:after:bg-navy peer-focus-visible:ring-2 peer-focus-visible:ring-teal" />
          <span>
            <span className="block text-[13px] font-medium text-warm">Aggressive offer</span>
            <span className="block text-[12px] leading-relaxed text-muted">
              {aggressive
                ? `On — your cash offer is ${fmt(w.cashOffer - w.standardCashOffer)} higher. It uses the smallest discount (${fmtP(w.cashDiscount)}) instead of the ${fmtP(w.standardCashDiscount)} this deal's risk calls for, so you're taking on more of the risk to win.`
                : "Turn on to bid harder and win the deal. Raises your cash offer by shrinking the risk discount to its minimum."}
            </span>
          </span>
        </label>

        <div className="relative mb-9 mt-12 h-3 rounded-full bg-navy">
          <div className="absolute h-3 rounded-full bg-teal/25" style={{ left: pos(w.cashOffer), right: `calc(100% - ${pos(w.creativeCeiling)})` }} />
          {markers.map((m) => (
            <div key={m.n} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(m.value) }}>
              <Badge n={m.n} color={m.color} />
            </div>
          ))}
          {markers.map((m, i) => (
            <div
              key={m.n}
              className={`absolute top-5 whitespace-nowrap text-[10px] font-medium ${i === 0 ? "" : i === markers.length - 1 ? "-translate-x-full" : "hidden"}`}
              style={{ left: pos(m.value), color: m.color }}
            >
              {i === 0 ? "◂ Lowest: cash offer" : "Highest: creative ceiling ▸"}
            </div>
          ))}
          {askingPrice > 0 && (
            <div className="absolute -top-9 -translate-x-1/2 whitespace-nowrap text-center text-[11px] font-medium text-amber" style={{ left: pos(askingPrice) }}>
              Seller&apos;s asking price {fmt(askingPrice)}
              <div className="mx-auto h-9 w-0.5 bg-amber" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {markers.map((m) => (
            <div key={m.n} className={TILE} data-testid={m.testId} style={{ borderColor: m.color }}>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <Badge n={m.n} color={m.color} />
                {m.label}
              </div>
              <div className="mt-1 text-[18px] font-semibold" style={{ color: m.color }}>{fmt(m.value)}</div>
              <div className="text-[11px] leading-snug text-muted">{m.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[12px] text-muted">
          Value created by working together: <span className="font-medium text-teal">{fmt(w.valueCreated)}</span>
          {askingPrice > 0 && (
            <>
              {" · "}Asking price is{" "}
              <span className={askingPrice > w.creativeCeiling ? "font-medium text-danger" : askingPrice > w.concludedValue ? "font-medium text-amber" : "font-medium text-teal"}>
                {askingPrice > w.creativeCeiling
                  ? `${fmt(askingPrice - w.creativeCeiling)} above the creative ceiling`
                  : askingPrice > w.concludedValue
                    ? "above concluded value but inside the window — needs creative terms"
                    : "at or below concluded value"}
              </span>
            </>
          )}
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Recommended multiple" value={x2(r.multiple)} note={`Range ${x2(r.band.low)} – ${x2(r.band.high)}`} accent testId="multiple" />
        <Stat label="Weighted SDE" value={fmt(r.weightedSde)} note={`Simple average ${fmt(r.avgSde)}`} testId="weighted-sde" />
        <Stat label="Asking multiple" value={askingPrice > 0 ? x2(r.askingMultiple) : "—"} note={askingPrice > 0 ? `${r.askingMultiple > r.multiple ? "Above" : "Below"} recommended` : "No asking price entered"} />
        <Stat label="Trend" value={r.regime} note={`Revenue ${fmtP(r.revGrowthFullYears, true)}/yr · SDE ${fmtP(r.sdeGrowthFullYears, true)}/yr`} />
      </div>

      <Section title="How the earnings were weighted" sub={`${r.trendFlag}. Recent years count more; the split depends on whether the business is growing, flat or declining.`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                <th className={TH} />
                {r.labels.map((l, i) => (r.history.sde[i] != null || i < 3 ? <th key={l} className={TH}>{l}</th> : null))}
              </tr>
            </thead>
            <tbody>
              <Row label="Revenue" values={r.history.revenue.filter((_, i) => r.history.sde[i] != null || i < 3).map((v) => (v == null ? "—" : fmt(v)))} />
              <Row label="SDE" values={r.history.sde.filter((v, i) => v != null || i < 3).map((v) => (v == null ? "—" : fmt(v)))} />
              <Row label="SDE margin" values={r.history.margins.filter((_, i) => r.history.sde[i] != null || i < 3).map((v) => (v == null ? "—" : fmtP(v)))} />
              <Row label="Weight" values={r.history.weights.filter((_, i) => r.history.sde[i] != null || i < 3).map((v) => `${Math.round(v * 100)}%`)} bold accent />
            </tbody>
          </table>
        </div>
        {chartIdx.length >= 2 && (
          <div className="mt-4">
            <TrendChart
              years={chartIdx.map((i) => r.labels[i])}
              revenues={chartIdx.map((i) => r.history.revenue[i] as number)}
              sdes={chartIdx.map((i) => r.history.sde[i] as number)}
            />
          </div>
        )}
      </Section>

      <Section
        title="How the multiple was set"
        sub="Size of earnings sets the range; your quality score sets where in the range this business lands."
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Size-tier range" value={`${x2(r.tier.low)} – ${x2(r.tier.high)}`} note="From weighted SDE" />
          <Stat
            label="Comparable sales"
            value={r.comps.p25 == null ? "Not used" : `${x2(r.comps.p25)} – ${x2(r.comps.p75)}`}
            note={r.comps.p25 == null ? "No qualifying comps" : `${r.comps.used} sales · median ${x2(r.comps.median)}`}
          />
          <Stat label="Blended range" value={`${x2(r.band.low)} – ${x2(r.band.high)}`} note={`Comps weighted ${Math.round(r.comps.weight * 100)}%`} />
          <Stat label="Position in range" value={`${Math.round(r.quality.bandPosition * 100)}%`} note={`Quality score ${r.quality.score.toFixed(2)}`} />
        </div>
        <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-muted">
          {r.comps.enabled && <li>• {r.comps.verdict}{r.comps.used > 0 && !r.comps.usedSizeWindow ? " (too few similar-sized sales, so all recent comps were used)" : ""}</li>}
          <li>• {r.tierCheck.verdict}</li>
          <li className={r.tierCheck.stressTierDrops ? "text-amber" : ""}>• {r.tierCheck.downside}</li>
        </ul>
      </Section>

      <Section title="Three ways to value it" sub="The concluded value is a fixed-weight blend, so no single method drives the answer.">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH}>Method</th>
              <th className={TH}>Weight</th>
              <th className={TH}>Indicated value</th>
            </tr>
          </thead>
          <tbody>
            {r.methods.map((m) => (
              <tr key={m.label}>
                <td className={TD}>{m.label}</td>
                <td className={TD}>{Math.round(m.weight * 100)}%</td>
                <td className={TD}>{fmt(m.value)}</td>
              </tr>
            ))}
            <tr className="border-t border-teal-bd">
              <td className={TD + " !font-semibold !text-warm"}>Concluded value</td>
              <td className={TD}>100%</td>
              <td className={TD + " !font-semibold !text-teal"}>{fmt(r.concludedValue)}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section
        title="Can the cash flow carry the debt?"
        sub={`Assumes ${Math.round(r.settings.financedPct * 100)}% of the price is financed on SBA terms and ${Math.round(r.settings.sdeForDebtService * 100)}% of weighted SDE is available for loan payments. Target coverage for this deal: ${r.dscrPolicy.targetDscr.toFixed(2)}x.`}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH}>Item</th>
              <th className={TH}>Price</th>
              <th className={TH}>DSCR</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {r.ceilings
              .filter((c) => c.price > 0)
              .map((c) => (
                <tr key={c.label}>
                  <td className={TD}>{c.label}</td>
                  <td className={TD}>{fmt(c.price)}</td>
                  <td className={TD}>{x2(c.dscr)}</td>
                  <td className={`${TD} ${STATUS_COLOR[c.status]}`}>{c.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className={`mt-3 text-[12px] ${r.concludedValue > r.sbaMaxFinanceable ? "text-danger" : "text-muted"}`}>
          Most an SBA buyer can finance at {r.dscrPolicy.targetDscr.toFixed(2)}x: <span className="font-medium text-warm">{fmt(r.sbaMaxFinanceable)}</span> — {r.financingTest}.
        </div>
      </Section>

      <Section title="What if you're off?" sub="Concluded value if the multiple or the earnings turn out different from the estimate.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className={TH}>SDE ↓ / Multiple →</th>
                {r.sensitivity.multiples.map((m) => (
                  <th key={m} className={TH}>{x2(m)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.sensitivity.rows.map((row) => (
                <tr key={row.adj}>
                  <td className={TD}>{row.adj === 0 ? "As entered" : fmtP(row.adj, true)}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className={`${TD} ${row.adj === 0 && i === 2 ? "!font-semibold !text-teal" : ""}`}>{fmtM(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// ─── Save / export ────────────────────────────────────────────────────────────

function SaveAndExport(props: {
  r: NapkinResult;
  businessName: string;
  askingPrice: number;
  buyerCash: number;
  sba: { amount: number; rate: number; years: number };
  note: { amount: number; rate: number; years: number };
}) {
  const { r } = props;
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save() {
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: props.businessName.trim() || "Unnamed Deal",
          stage: "Valuation",
          sde: r.weightedSde,
          multiple: r.multiple,
          asking_price: props.askingPrice > 0 ? props.askingPrice : null,
          offer_low: Math.round(r.priceWindow.cashOffer),
          offer_high: Math.round(r.priceWindow.creativeCeiling),
          dscr: r.structure.dscr != null ? parseFloat(r.structure.dscr.toFixed(2)) : null,
          irr: r.structure.irr != null ? parseFloat((r.structure.irr * 100).toFixed(1)) : null,
          notes: "",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save. Make sure you're signed in.");
      }
      setStatus("saved");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-teal-bd bg-teal-bg p-4 md:p-5">
      <div className="text-[14px] font-semibold text-warm">Save to Pipeline</div>
      <div className="mb-3 mt-1 text-[12px] leading-relaxed text-muted">
        Saves the business name, SDE, multiple, offer range, DSCR, and IRR so you can track and compare this deal in your pipeline.
      </div>
      {status === "error" && <div className="mb-2 text-[13px] text-danger">{error}</div>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={status === "saving" || status === "saved"}
          onClick={save}
          className="rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-navy transition-colors hover:bg-teal-dim disabled:opacity-70"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "✓ Saved to pipeline" : "Save to pipeline →"}
        </button>
        <button
          type="button"
          onClick={() =>
            exportDealAnalyzerPDF({
              businessName: props.businessName,
              avgSDE: r.weightedSde,
              activeMult: r.multiple,
              askPrice: props.askingPrice,
              offerPrice: r.structure.purchasePrice,
              offerLow: Math.round(r.priceWindow.cashOffer),
              offerHigh: Math.round(r.priceWindow.creativeCeiling),
              dscr: r.structure.dscr ?? 0,
              irr: r.structure.irr ?? 0,
              eq: props.buyerCash,
              sbaAmount: props.sba.amount,
              sbaRate: props.sba.rate,
              sbaTerm: props.sba.years,
              snAmount: props.note.amount,
              snRate: props.note.rate,
              snTerm: props.note.years,
              yearInputs: r.labels
                .map((label, i) => ({ label, revenue: r.history.revenue[i] ?? 0, sde: r.history.sde[i] ?? 0 }))
                .filter((y) => y.revenue > 0 || y.sde > 0),
            })
          }
          className="rounded-lg border border-teal-bd px-5 py-2.5 text-[13px] font-medium text-teal transition-colors hover:bg-teal-bg"
        >
          Download PDF report
        </button>
      </div>
    </div>
  );
}

// ─── Shared pieces ────────────────────────────────────────────────────────────

function Stepper({ step, maxStep, canAdvance, onChange }: { step: Step; maxStep: Step; canAdvance: boolean; onChange: (s: Step) => void }) {
  return (
    <div className="mb-6 flex items-center">
      {STEPS.map((label, i) => {
        const idx = (i + 1) as Step;
        const active = idx === step;
        const done = idx < step;
        const clickable = idx === 1 || (canAdvance && idx <= maxStep);
        return (
          <div key={label} className={`flex items-center ${idx < STEPS.length ? "flex-1" : ""}`}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onChange(idx)}
              className={`flex items-center gap-2 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[11px] font-medium ${
                  active ? "border-teal bg-teal text-navy" : done ? "border-teal bg-teal/15 text-teal" : "border-teal-bd bg-navy-100 text-muted"
                }`}
              >
                {idx}
              </span>
              <span className={`hidden whitespace-nowrap text-[11px] sm:inline ${active ? "text-teal" : "text-muted"}`}>{label}</span>
            </button>
            {idx < STEPS.length && <div className="mx-2 h-px flex-1 bg-teal-bd" />}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="text-[16px] font-semibold text-warm">{title}</h2>
      {sub && <p className="mb-4 mt-1 text-[12px] leading-relaxed text-muted">{sub}</p>}
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] text-muted">{label}</span>
      {children}
    </div>
  );
}

function Money({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
      <input
        aria-label={label}
        className={INPUT + " !pl-6 text-right"}
        inputMode="decimal"
        placeholder={placeholder ?? "—"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(withCommas(e.target.value))}
      />
    </div>
  );
}

function Stat({ label, value, note, accent, testId }: { label: string; value: string; note?: string; accent?: boolean; testId?: string }) {
  return (
    <div className={TILE} data-testid={testId}>
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-[18px] font-semibold ${accent ? "text-teal" : "text-warm"}`}>{value}</div>
      {note && <div className="text-[11px] leading-snug text-muted">{note}</div>}
    </div>
  );
}

function Badge({ n, color }: { n: number; color: string }) {
  return (
    <span
      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-navy text-[11px] font-bold text-navy"
      style={{ background: color }}
    >
      {n}
    </span>
  );
}

function Row({ label, values, bold, accent }: { label: string; values: string[]; bold?: boolean; accent?: boolean }) {
  return (
    <tr className={bold ? "border-t border-teal-bd/60" : ""}>
      <td className={TD + (bold ? " !font-medium !text-warm" : "")}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`${TD} ${bold ? "font-semibold" : ""} ${accent ? "!text-teal" : ""}`}>{v}</td>
      ))}
    </tr>
  );
}

function EditRow({ label, values, set }: { label: string; values: string[]; set: React.Dispatch<React.SetStateAction<string[]>> }) {
  return (
    <tr>
      <td className={TD}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-1 py-1">
          <input
            aria-label={`Year ${i + 1} ${label.toLowerCase()}`}
            className={INPUT + " !py-1 text-right"}
            inputMode="decimal"
            placeholder="0"
            value={v}
            onChange={(e) => set((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
            onBlur={(e) => set((p) => p.map((x, j) => (j === i ? withCommas(e.target.value) : x)))}
          />
        </td>
      ))}
    </tr>
  );
}

function NoteCard({ title, v, set }: {
  title: string;
  v: { amount: string; rate: string; years: string };
  set: (v: { amount: string; rate: string; years: string }) => void;
}) {
  return (
    <div className={TILE}>
      <div className="mb-2 text-[13px] font-medium text-warm">{title}</div>
      <Money label={`${title} amount`} value={v.amount} onChange={(amount) => set({ ...v, amount })} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-[11px] text-muted">
          Rate (%)
          <input aria-label={`${title} rate`} className={INPUT + " mt-1"} inputMode="decimal" value={v.rate} onChange={(e) => set({ ...v, rate: e.target.value })} />
        </label>
        <label className="text-[11px] text-muted">
          Term (years)
          <input aria-label={`${title} term`} className={INPUT + " mt-1"} inputMode="decimal" value={v.years} onChange={(e) => set({ ...v, years: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

function Nav({ back, next, nextLabel }: { back?: () => void; next?: () => void; nextLabel?: string }) {
  return (
    <div className="flex justify-between gap-3 pt-2">
      {back ? <button type="button" className="btn-secondary" onClick={back}>← Back</button> : <span />}
      {nextLabel && (
        <button type="button" className="btn-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!next} onClick={next}>
          {nextLabel}
        </button>
      )}
    </div>
  );
}
