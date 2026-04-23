"use client";

import { useMemo, useState } from "react";
import {
  runAnalysis,
  SCORE_FACTORS,
  RISK_FACTORS,
  fmt,
  fmtM,
  type AnalysisInput,
} from "@/lib/valuation";
import { TrendChart } from "./trend-chart";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;

type YearState = { revenue: string; sde: string };

export function NapkinTool() {
  const [step, setStep] = useState<Step>(1);
  const [use4Years, setUse4Years] = useState(false);
  const [useYtd, setUseYtd] = useState(false);
  const [ytdMonths, setYtdMonths] = useState("6");

  const [years, setYears] = useState<YearState[]>([
    { revenue: "", sde: "" },
    { revenue: "", sde: "" },
    { revenue: "", sde: "" },
    { revenue: "", sde: "" },
  ]);
  const [ytd, setYtd] = useState<YearState>({ revenue: "", sde: "" });

  const [askPrice, setAskPrice] = useState("");
  const [cfGoal, setCfGoal] = useState("");

  // Score + risk sliders
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(SCORE_FACTORS.map((f) => [f.key, 3]))
  );
  const [risks, setRisks] = useState<Record<string, number>>(() =>
    Object.fromEntries(RISK_FACTORS.map((f) => [f.key, 0]))
  );

  const parse = (s: string) => parseFloat(s) || 0;

  function updateYear(idx: number, field: "revenue" | "sde", value: string) {
    setYears((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const analysisInput: AnalysisInput = useMemo(() => {
    const yearCount = use4Years ? 4 : 3;
    const ys = years.slice(0, yearCount).map((y) => ({
      revenue: parse(y.revenue),
      sde: parse(y.sde),
    }));
    return {
      years: ys,
      ytd: useYtd
        ? { revenue: parse(ytd.revenue), sde: parse(ytd.sde) }
        : undefined,
      ytdMonths: parse(ytdMonths) || 6,
      askPrice: parse(askPrice),
      cfGoal: parse(cfGoal),
      scores,
      risks,
    };
  }, [years, ytd, use4Years, useYtd, ytdMonths, askPrice, cfGoal, scores, risks]);

  const analysis = useMemo(() => {
    // Only run if we have at least 3 years of SDE > 0
    const minYears = use4Years ? 4 : 3;
    const hasData =
      analysisInput.years.length >= minYears &&
      analysisInput.years.slice(0, minYears).every((y) => y.sde > 0);
    if (!hasData) return null;
    return runAnalysis(analysisInput);
  }, [analysisInput, use4Years]);

  return (
    <div className="rounded-2xl border border-[0.5px] border-border bg-navy-100 p-6 md:p-10">
      <Stepper step={step} onChange={setStep} />

      {step === 1 && (
        <Step1
          use4Years={use4Years}
          setUse4Years={setUse4Years}
          useYtd={useYtd}
          setUseYtd={setUseYtd}
          ytdMonths={ytdMonths}
          setYtdMonths={setYtdMonths}
          years={years}
          updateYear={updateYear}
          ytd={ytd}
          setYtd={setYtd}
          askPrice={askPrice}
          setAskPrice={setAskPrice}
          cfGoal={cfGoal}
          setCfGoal={setCfGoal}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2
          scores={scores}
          setScores={setScores}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          risks={risks}
          setRisks={setRisks}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          canRun={!!analysis}
        />
      )}
      {step === 4 && analysis && (
        <Step4Results analysis={analysis} onBack={() => setStep(3)} />
      )}
    </div>
  );
}

// --- Stepper ----------------------------------------------------------------
function Stepper({
  step,
  onChange,
}: {
  step: Step;
  onChange: (s: Step) => void;
}) {
  const labels = ["Financials", "Score", "Risks", "Results"];
  return (
    <div className="mb-10 flex items-center gap-2">
      {labels.map((l, i) => {
        const idx = (i + 1) as Step;
        const active = idx === step;
        const done = idx < step;
        return (
          <button
            key={l}
            onClick={() => (done ? onChange(idx) : null)}
            className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-teal-bg text-teal"
                : done
                  ? "text-teal hover:bg-navy-200"
                  : "text-muted"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                active
                  ? "bg-teal text-navy"
                  : done
                    ? "bg-teal-bg text-teal"
                    : "bg-navy-200 text-muted"
              }`}
            >
              {idx}
            </span>
            <span className="hidden sm:inline">{l}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Step 1: financial inputs ----------------------------------------------
function Step1(props: {
  use4Years: boolean;
  setUse4Years: (v: boolean) => void;
  useYtd: boolean;
  setUseYtd: (v: boolean) => void;
  ytdMonths: string;
  setYtdMonths: (v: string) => void;
  years: YearState[];
  updateYear: (i: number, f: "revenue" | "sde", v: string) => void;
  ytd: YearState;
  setYtd: (y: YearState) => void;
  askPrice: string;
  setAskPrice: (v: string) => void;
  cfGoal: string;
  setCfGoal: (v: string) => void;
  onNext: () => void;
}) {
  const yearCount = props.use4Years ? 4 : 3;
  const canProceed = props.years
    .slice(0, yearCount)
    .every((y) => parseFloat(y.sde) > 0);

  return (
    <div>
      <SectionHeader
        title="Step 1: Historical financials"
        description="Enter 3–4 years of revenue and SDE. Add YTD for the current year if available."
      />

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.use4Years}
            onChange={(e) => props.setUse4Years(e.target.checked)}
            className="accent-teal"
          />
          Include 4th historical year
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.useYtd}
            onChange={(e) => props.setUseYtd(e.target.checked)}
            className="accent-teal"
          />
          Include current year YTD
        </label>
        {props.useYtd && (
          <label className="flex items-center gap-2">
            YTD months
            <input
              type="number"
              min={1}
              max={12}
              value={props.ytdMonths}
              onChange={(e) => props.setYtdMonths(e.target.value)}
              className="w-14 rounded border border-border bg-navy px-2 py-1 text-warm"
            />
          </label>
        )}
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border border-[0.5px] border-border">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 bg-navy/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <span>Period</span>
          <span>Revenue</span>
          <span>SDE</span>
        </div>
        {Array.from({ length: yearCount }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 border-t border-[0.5px] border-border px-4 py-3"
          >
            <span className="w-14 text-sm font-semibold text-warm">Yr {i + 1}</span>
            <DollarInput
              value={props.years[i].revenue}
              onChange={(v) => props.updateYear(i, "revenue", v)}
            />
            <DollarInput
              value={props.years[i].sde}
              onChange={(v) => props.updateYear(i, "sde", v)}
            />
          </div>
        ))}
        {props.useYtd && (
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 border-t border-[0.5px] border-teal-bd bg-teal-bg/50 px-4 py-3">
            <span className="w-14 text-sm font-semibold text-teal">YTD</span>
            <DollarInput
              value={props.ytd.revenue}
              onChange={(v) => props.setYtd({ ...props.ytd, revenue: v })}
            />
            <DollarInput
              value={props.ytd.sde}
              onChange={(v) => props.setYtd({ ...props.ytd, sde: v })}
            />
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <LabeledInput
          label="Asking price (optional)"
          value={props.askPrice}
          onChange={props.setAskPrice}
          placeholder="e.g. 1500000"
        />
        <LabeledInput
          label="Monthly cash flow goal (optional)"
          value={props.cfGoal}
          onChange={props.setCfGoal}
          placeholder="e.g. 10000"
        />
      </div>

      <div className="flex justify-end">
        <button
          disabled={!canProceed}
          onClick={props.onNext}
          className="btn-primary disabled:opacity-50"
        >
          Continue to scoring →
        </button>
      </div>
    </div>
  );
}

// --- Step 2: qualitative scoring --------------------------------------------
function Step2({
  scores,
  setScores,
  onBack,
  onNext,
}: {
  scores: Record<string, number>;
  setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <SectionHeader
        title="Step 2: Napkin scoring"
        description="Score the business on six qualitative factors. 1 is worst, 5 is best. These nudge the market multiple up or down."
      />
      <div className="mb-8 flex flex-col gap-6">
        {SCORE_FACTORS.map((f) => (
          <SliderRow
            key={f.key}
            label={f.label}
            description={f.desc}
            value={scores[f.key]}
            min={1}
            max={5}
            step={0.25}
            lowLabel={f.low}
            highLabel={f.high}
            onChange={(v) => setScores((prev) => ({ ...prev, [f.key]: v }))}
            valueColor={
              scores[f.key] >= 4
                ? "text-teal"
                : scores[f.key] >= 3
                  ? "text-warm"
                  : "text-amber"
            }
          />
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Continue to risks →" />
    </div>
  );
}

// --- Step 3: risk factors ---------------------------------------------------
function Step3({
  risks,
  setRisks,
  onBack,
  onNext,
  canRun,
}: {
  risks: Record<string, number>;
  setRisks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onBack: () => void;
  onNext: () => void;
  canRun: boolean;
}) {
  return (
    <div>
      <SectionHeader
        title="Step 3: Risk factors"
        description="Each risk you flag applies a penalty to the multiple. 0 = not present, 5 = critical."
      />
      <div className="mb-8 flex flex-col gap-6">
        {RISK_FACTORS.map((f) => (
          <SliderRow
            key={f.key}
            label={f.label}
            description={f.desc}
            value={risks[f.key]}
            min={0}
            max={5}
            step={0.25}
            lowLabel="Not present"
            highLabel="Critical"
            onChange={(v) => setRisks((prev) => ({ ...prev, [f.key]: v }))}
            valueColor={
              risks[f.key] === 0
                ? "text-teal"
                : risks[f.key] <= 1.5
                  ? "text-teal"
                  : risks[f.key] <= 3
                    ? "text-amber"
                    : "text-danger"
            }
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button
          disabled={!canRun}
          onClick={onNext}
          className="btn-primary disabled:opacity-50"
        >
          Run analysis →
        </button>
      </div>
    </div>
  );
}

// --- Step 4: results --------------------------------------------------------
function Step4Results({
  analysis,
  onBack,
}: {
  analysis: NonNullable<ReturnType<typeof runAnalysis>>;
  onBack: () => void;
}) {
  const a = analysis;
  return (
    <div>
      <SectionHeader
        title="Step 4: Results"
        description="Your napkin valuation, recommended offer range, and risk-adjusted multiple."
      />

      <div className="mb-6 rounded-2xl border border-teal-bd bg-teal-bg p-6 text-center">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal">
          Recommended offer range
        </div>
        <div className="text-4xl font-bold tracking-tether-tighter text-warm md:text-5xl">
          {fmtM(a.cashOffer)} – {fmtM(a.creativeOffer)}
        </div>
        <div className="mt-2 text-sm text-muted">
          {a.recMult.toFixed(2)}x weighted SDE of {fmtM(a.avgSDE)} · {a.dataNote}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Weighted avg SDE" value={fmtM(a.avgSDE)} color="text-teal" note={a.dataNote} />
        <Metric label="Fair value" value={fmtM(a.fairValue)} color="text-warm" note={`${a.recMult.toFixed(2)}x SDE`} />
        <Metric label="Max SBA price" value={fmtM(a.maxSBAPrice)} color="text-warm" note="1.25x DSCR floor" />
        <Metric label="Year 1 proj. SDE" value={fmtM(a.yr1SDE)} color="text-teal" note="+4% growth" />
      </div>

      <div className="mb-6 rounded-2xl border border-[0.5px] border-border bg-navy p-6">
        <div className="mb-3 text-sm font-semibold text-warm">
          How the multiple was calculated
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MultBreakdown
            label="Benchmark (SDE band)"
            value={`${a.bench.toFixed(2)}x`}
            color="text-warm"
            note="Market comp for this SDE level"
          />
          <MultBreakdown
            label="Qualitative adjustment"
            value={`${a.qualitativeMod >= 0 ? "+" : ""}${a.qualitativeMod.toFixed(2)}x`}
            color={a.qualitativeMod >= 0 ? "text-teal" : "text-danger"}
            note="Score-weighted"
          />
          <MultBreakdown
            label="Risk penalty"
            value={`–${a.riskPenalty.toFixed(2)}x`}
            color="text-danger"
            note={`${a.flaggedRisks.length} risk flag${a.flaggedRisks.length === 1 ? "" : "s"}`}
          />
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-[0.5px] border-border pt-4">
          <div>
            <div className="text-xs text-muted">Recommended multiple</div>
            <div className="text-3xl font-bold text-teal">{a.recMult.toFixed(2)}x</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Applied to SDE of {fmtM(a.avgSDE)}</div>
            <div className="text-lg font-semibold text-warm">
              {fmtM(a.fairValue)} fair value
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[0.5px] border-border bg-navy p-6">
        <div className="mb-1 text-sm font-semibold text-warm">Financial trend</div>
        <div className="mb-4 text-xs text-muted">Historical revenue and SDE</div>
        <TrendChart
          years={a.histLabels}
          revenues={a.histRevenues}
          sdes={a.histSdes}
        />
      </div>

      {a.flaggedRisks.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[0.5px] border-danger/30 bg-danger/5 p-6">
          <div className="mb-3 text-sm font-semibold text-warm">
            ⚑ Risk flags ({a.flaggedRisks.length})
          </div>
          <ul className="flex flex-col gap-2">
            {a.flaggedRisks.map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between rounded-lg border border-[0.5px] border-border bg-navy p-3 text-sm text-warm"
              >
                <span>{r.label}</span>
                <span
                  className="rounded-full px-3 py-0.5 text-xs font-semibold"
                  style={{ background: r.severity.bg, color: r.severity.color }}
                >
                  {r.severity.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-teal-bd bg-teal-bg p-6">
        <div className="mb-2 text-sm font-semibold text-teal">
          Ready to build your full deal structure?
        </div>
        <p className="mb-4 text-sm text-muted">
          Tether Pro gives you the financing stack — SBA loan, seller note,
          DSCR, WACC, IRR, and a 5-year cash flow forecast — plus the QoE
          Mapper to catch add-backs and the Deal Workspace to run diligence.
        </p>
        <Link href="/pricing" className="btn-primary">
          See Tether Pro
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Edit inputs
        </button>
        <div className="text-xs text-muted">
          Results are illustrative, not investment advice.
        </div>
      </div>
    </div>
  );
}

// --- Reusable atoms ---------------------------------------------------------

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold tracking-tether-tight text-warm">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next →",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="btn-secondary">
        ← Back
      </button>
      <button onClick={onNext} className="btn-primary">
        {nextLabel}
      </button>
    </div>
  );
}

function DollarInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const display = value ? fmt(parseFloat(value) || 0) : "";
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="$0"
        className="w-full rounded-lg border border-border bg-navy px-3 py-2 text-sm text-warm outline-none focus:border-teal"
      />
      {value && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          {display}
        </span>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-navy px-4 py-3 text-sm text-warm outline-none focus:border-teal"
      />
    </label>
  );
}

function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  lowLabel,
  highLabel,
  onChange,
  valueColor,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  lowLabel: string;
  highLabel: string;
  onChange: (v: number) => void;
  valueColor: string;
}) {
  return (
    <div className="rounded-xl border border-[0.5px] border-border bg-navy p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-warm">{label}</span>
        <span className={`text-sm font-semibold ${valueColor}`}>
          {value.toFixed(2)}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-teal"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
  note,
}: {
  label: string;
  value: string;
  color: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-[0.5px] border-border bg-navy p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{note}</div>
    </div>
  );
}

function MultBreakdown({
  label,
  value,
  color,
  note,
}: {
  label: string;
  value: string;
  color: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-[0.5px] border-border bg-navy-100 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{note}</div>
    </div>
  );
}
