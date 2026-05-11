"use client";

import { useEffect, useMemo, useState } from "react";
import { exportDealAnalyzerPDF } from "@/lib/pdf-export";
import {
  runAnalysis,
  SCORE_FACTORS,
  RISK_FACTORS,
  fmt,
  fmtM,
  fmtP,
  cagrFn,
  yoyFn,
  gC,
  dscrColor,
  calcWACC,
  calcIRR,
  buildSG,
  pmtFn,
  offerRange,

  type AnalysisInput,
  type Analysis,
} from "@/lib/valuation";
import { TrendChart } from "./trend-chart";

type Step = 1 | 2 | 3;
type YearState = { revenue: string; sde: string };
type AddSource = { id: string; name: string; amount: number; rate: number; isEquity: boolean };

const REASONS = [
  "Have market comps at higher multiple",
  "Strong growth trajectory",
  "Proprietary systems or IP",
  "Seller motivated — accepting discount",
  "Industry headwinds justify lower",
  "Higher risk than model captures",
  "Strategic synergies for me",
  "Conservative — first acquisition",
];

// Guided questions for each score factor (Yes = positive / good)
const SCORE_QUESTIONS: Record<string, string[]> = {
  clientConc: [
    "No single customer drives more than 20% of revenue",
    "The top 5 customers combined are less than 50% of revenue",
    "The business has 20 or more active paying customers",
  ],
  industry: [
    "This industry has seen growing demand over the past 3 years",
    "Comparable businesses in this sector typically sell for 3x+ SDE",
    "No major technology or regulatory disruption is expected near-term",
  ],
  market: [
    "Quality businesses like this are relatively hard to find — low supply",
    "There are multiple buyers actively competing for deals in this space",
  ],
  team: [
    "The business has documented SOPs a new owner could follow",
    "A capable team exists that can run operations without the current owner",
    "The business has operated normally during owner vacations or absences",
  ],
  history: [
    "The business has been operating profitably for 5 or more years",
    "Revenue has been stable or growing in most years",
    "The business has a recognized brand or loyal, repeat customer base",
  ],
  opportunity: [
    "There are clear, untapped revenue streams a new owner could activate",
    "The current owner hasn't invested in marketing or digital channels",
    "There are visible operational inefficiencies that could be improved",
  ],
};

// Guided questions for each risk factor (Yes = risk is present)
const RISK_QUESTIONS: Record<string, string[]> = {
  decline: [
    "Revenue was lower in the most recent year versus the prior year",
    "Revenue has declined in 2 or more of the last 3 years",
  ],
  keyman: [
    "The owner personally holds most key customer relationships",
    "Critical licenses, skills, or knowledge reside with the owner",
    "The business would struggle significantly if the owner left on day one",
  ],
  custConc: [
    "A single customer accounts for 25% or more of total revenue",
    "Losing the top 2 customers would cut revenue by more than 40%",
  ],
  legal: [
    "There are pending lawsuits, claims, or regulatory investigations",
    "The business has had compliance violations in the past 3 years",
  ],
  empRet: [
    "Key employees have hinted they may leave after an ownership change",
    "The team is closely tied to the current owner personally",
    "There are no employment contracts or non-competes for key staff",
  ],
  econ: [
    "Revenue dropped significantly during the 2020 COVID downturn",
    "The business depends on discretionary or non-essential spending",
    "Revenue is highly seasonal or difficult to forecast",
  ],
  reg: [
    "Significant new regulations are expected or pending in this industry",
    "Key licenses or permits may be difficult to transfer to a new owner",
  ],
  dis: [
    "AI or automation could displace core services within the next 5 years",
    "A well-funded national or platform competitor has entered this market",
    "The business is heavily dependent on a single platform (Google, Amazon, etc.)",
  ],
};

const S: React.CSSProperties = {
  background: "var(--navy2)",
  border: "1px solid rgba(0,201,167,0.18)",
  borderRadius: 10,
  padding: "12px 14px",
};
const CELL_INPUT: React.CSSProperties = {
  background: "var(--navy2)",
  border: "1px solid rgba(0,201,167,0.18)",
  borderRadius: 7,
  color: "var(--warm)",
  padding: "7px 8px",
  fontSize: 13,
  width: "100%",
  minWidth: 82,
  outline: "none",
  textAlign: "right",
};
const MI: React.CSSProperties = {
  background: "var(--navy3)",
  border: "1px solid rgba(0,201,167,0.18)",
  borderRadius: 6,
  color: "var(--warm)",
  padding: "7px 10px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

function parse(s: string | number): number {
  return parseFloat(String(s)) || 0;
}

/** Convert yes/no guided answers to a score value.
 *  isRisk=false → score 1.5–5.0 (more Yes = better)
 *  isRisk=true  → risk 0–4.5  (more Yes = higher risk) */
function scoreFromAnswers(answers: (boolean | null)[], isRisk: boolean): number {
  const total = answers.length;
  const yesCount = answers.filter((a) => a === true).length;
  const ratio = total > 0 ? yesCount / total : 0;
  const raw = isRisk ? ratio * 4.5 : 1.5 + ratio * 3.5;
  return Math.round(raw * 4) / 4; // snap to 0.25 increments
}

// ─── Main component ──────────────────────────────────────────────────────────

export function NapkinTool() {
  const [step, setStep] = useState<Step>(1);
  const [businessName, setBusinessName] = useState("");
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

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(SCORE_FACTORS.map((f) => [f.key, 3]))
  );
  const [risks, setRisks] = useState<Record<string, number>>(() =>
    Object.fromEntries(RISK_FACTORS.map((f) => [f.key, 0]))
  );

  // Rating mode for step 1
  const [ratingMode, setRatingMode] = useState<"quick" | "guided">("quick");
  const [guidedScoreAnswers, setGuidedScoreAnswers] = useState<Record<string, (boolean | null)[]>>(() =>
    Object.fromEntries(SCORE_FACTORS.map((f) => [f.key, (SCORE_QUESTIONS[f.key] ?? []).map(() => null)]))
  );
  const [guidedRiskAnswers, setGuidedRiskAnswers] = useState<Record<string, (boolean | null)[]>>(() =>
    Object.fromEntries(RISK_FACTORS.map((f) => [f.key, (RISK_QUESTIONS[f.key] ?? []).map(() => null)]))
  );

  // Step 4 custom multiple
  const [custMode, setCustMode] = useState(false);
  const [custMult, setCustMult] = useState(3.0);
  const [selReasons, setSelReasons] = useState<Set<string>>(new Set());

  // Step 5 deal structure
  const [eqAmount, setEqAmount] = useState("");
  const [sbaAmount, setSbaAmount] = useState("");
  const [sbaRate, setSbaRate] = useState("9.5");
  const [sbaTerm, setSbaTerm] = useState("10");
  const [snAmount, setSnAmount] = useState("0");
  const [snRate, setSnRate] = useState("6.0");
  const [snTerm, setSnTerm] = useState("6");
  const [offerPrice, setOfferPrice] = useState(0);
  const [addSources, setAddSources] = useState<AddSource[]>([]);
  const [addSrcCtr, setAddSrcCtr] = useState(0);
  const [fcGR, setFcGR] = useState([4, 2, 2, 4, 3]);
  const [fcEx, setFcEx] = useState([0, 0, 0, 0, 0]);

  // Pre-fill year data from QoE handoff (if user clicked "Take to Deal Analyzer" from QoE)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tether_qoe_handoff");
      if (!raw) return;
      localStorage.removeItem("tether_qoe_handoff"); // consume once
      const handoff = JSON.parse(raw) as { years: { label: string; revenue: number; sde: number }[] };
      if (!Array.isArray(handoff.years) || handoff.years.length === 0) return;
      const count = Math.min(handoff.years.length, 4);
      setUse4Years(count === 4);
      setYears((prev) => {
        const next = [...prev];
        for (let i = 0; i < count; i++) {
          next[i] = {
            revenue: handoff.years[i].revenue > 0 ? String(handoff.years[i].revenue) : "",
            sde: handoff.years[i].sde > 0 ? String(handoff.years[i].sde) : "",
          };
        }
        return next;
      });
    } catch {
      // ignore bad localStorage data
    }
  }, []);

  function updateYear(idx: number, field: "revenue" | "sde", value: string) {
    setYears((prev) => {
      const n = [...prev];
      n[idx] = { ...n[idx], [field]: value };
      return n;
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
      ytd: useYtd ? { revenue: parse(ytd.revenue), sde: parse(ytd.sde) } : undefined,
      ytdMonths: parse(ytdMonths) || 6,
      askPrice: parse(askPrice),
      cfGoal: parse(cfGoal),
      scores,
      risks,
    };
  }, [years, ytd, use4Years, useYtd, ytdMonths, askPrice, cfGoal, scores, risks]);

  const analysis = useMemo(() => {
    const minYears = use4Years ? 4 : 3;
    const hasData =
      analysisInput.years.length >= minYears &&
      analysisInput.years.slice(0, minYears).every((y) => y.sde > 0);
    if (!hasData) return null;
    return runAnalysis(analysisInput);
  }, [analysisInput, use4Years]);

  function handleRunAnalysis() {
    if (!analysis) return;
    setCustMult(analysis.recMult);
    setCustMode(false);
    setSelReasons(new Set());
    const ap = parse(askPrice);
    const { fairValue: fv, creativeOffer: cr } = analysis;
    const oMax = Math.round(Math.max(cr, ap > 0 ? Math.min(ap, fv * 1.3) : cr) / 5000) * 5000;
    const oStart = Math.round(Math.min(fv, oMax) / 5000) * 5000;
    setOfferPrice(oStart || Math.round(fv / 5000) * 5000 || 500000);
    setStep(2);
  }

  const activeMult = custMode ? custMult : (analysis?.recMult ?? 3.0);

  const activeRange = useMemo(() => {
    if (!analysis) return { fmv: 0, cashOffer: 0, creativeOffer: 0 };
    return offerRange({ avgSDE: analysis.avgSDE, mult: activeMult, askPrice: parse(askPrice) });
  }, [analysis, activeMult, askPrice]);

  return (
    <div style={{ background: "var(--navy)", borderRadius: 16, padding: 24, maxWidth: 920, margin: "0 auto" }}>
      {/* Logo row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="7" stroke="#00C9A7" strokeWidth="2" />
          <circle cx="16" cy="16" r="2.5" fill="#00C9A7" />
          <line x1="16" y1="2" x2="16" y2="9" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="23" x2="16" y2="30" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 22, fontWeight: 500, color: "var(--warm)" }}>tether</span>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6, marginTop: 3 }}>/ napkin value</span>
      </div>

      {/* Business name */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 5 }}>Business name (optional)</label>
        <input
          type="text"
          placeholder="e.g. Apex Property Services"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          style={{ background: "var(--navy2)", border: "1px solid rgba(0,201,167,0.18)", borderRadius: 8, color: "var(--warm)", padding: "9px 12px", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <Stepper step={step} onChange={setStep} maxUnlocked={analysis ? 3 : step} />

      {step === 1 && (
        <Step1
          use4Years={use4Years} setUse4Years={setUse4Years}
          useYtd={useYtd} setUseYtd={setUseYtd}
          ytdMonths={ytdMonths} setYtdMonths={setYtdMonths}
          years={years} updateYear={updateYear}
          ytd={ytd} setYtd={setYtd}
          askPrice={askPrice} setAskPrice={setAskPrice}
          cfGoal={cfGoal} setCfGoal={setCfGoal}
          analysis={analysis}
          scores={scores} setScores={setScores}
          risks={risks} setRisks={setRisks}
          ratingMode={ratingMode} setRatingMode={setRatingMode}
          guidedScoreAnswers={guidedScoreAnswers} setGuidedScoreAnswers={setGuidedScoreAnswers}
          guidedRiskAnswers={guidedRiskAnswers} setGuidedRiskAnswers={setGuidedRiskAnswers}
          onRun={handleRunAnalysis}
        />
      )}
      {step === 2 && analysis && (
        <Step4Analysis
          analysis={analysis}
          scores={scores}
          askPrice={parse(askPrice)}
          cfGoal={parse(cfGoal)}
          custMode={custMode} setCustMode={setCustMode}
          custMult={custMult} setCustMult={setCustMult}
          activeMult={activeMult}
          activeRange={activeRange}
          selReasons={selReasons} setSelReasons={setSelReasons}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && analysis && (
        <Step5Structure
          analysis={analysis}
          activeMult={activeMult}
          activeRange={activeRange}
          scores={scores}
          askPrice={parse(askPrice)}
          cfGoal={parse(cfGoal)}
          businessName={businessName}
          yearInputs={(() => {
            const count = use4Years ? 4 : 3;
            const labels = ["Year 1", "Year 2", "Year 3", "Year 4"];
            return years.slice(0, count).map((y, i) => ({
              label: labels[i],
              revenue: parse(y.revenue),
              sde: parse(y.sde),
            }));
          })()}
          eqAmount={eqAmount} setEqAmount={setEqAmount}
          sbaAmount={sbaAmount} setSbaAmount={setSbaAmount}
          sbaRate={sbaRate} setSbaRate={setSbaRate}
          sbaTerm={sbaTerm} setSbaTerm={setSbaTerm}
          snAmount={snAmount} setSnAmount={setSnAmount}
          snRate={snRate} setSnRate={setSnRate}
          snTerm={snTerm} setSnTerm={setSnTerm}
          offerPrice={offerPrice} setOfferPrice={setOfferPrice}
          addSources={addSources} setAddSources={setAddSources}
          addSrcCtr={addSrcCtr} setAddSrcCtr={setAddSrcCtr}
          fcGR={fcGR} setFcGR={setFcGR}
          fcEx={fcEx} setFcEx={setFcEx}
          onBack={() => setStep(2)}
        />
      )}

      <p style={{ marginTop: 20, padding: "12px 14px", background: "rgba(154,165,180,0.08)", border: "1px solid rgba(154,165,180,0.15)", borderRadius: 8, fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>
        All projections are pre-tax estimates for evaluation purposes only. This tool does not constitute financial, legal, or investment advice. Consult a qualified advisor before making any acquisition decision.
      </p>
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ step, onChange, maxUnlocked }: { step: Step; onChange: (s: Step) => void; maxUnlocked: number }) {
  const labels = ["Financials", "Analysis", "Structure"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {labels.map((l, i) => {
        const idx = (i + 1) as Step;
        const active = idx === step;
        const done = idx < step;
        const clickable = done || idx <= maxUnlocked;
        return (
          <div key={l} style={{ display: "flex", alignItems: "center", flex: idx < 3 ? 1 : undefined }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 7, cursor: clickable ? "pointer" : "default" }}
              onClick={() => clickable && onChange(idx)}
            >
              <div style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500, flexShrink: 0,
                background: active ? "var(--teal)" : done ? "rgba(0,201,167,0.15)" : "var(--navy2)",
                color: active ? "#0A1628" : done ? "var(--teal)" : "var(--muted)",
                border: `1px solid ${active || done ? "var(--teal)" : "rgba(0,201,167,0.18)"}`,
              }}>
                {idx}
              </div>
              <span style={{ fontSize: 11, color: active ? "var(--teal)" : "var(--muted)", whiteSpace: "nowrap" }}>{l}</span>
            </div>
            {idx < 3 && <div style={{ flex: 1, height: 1, background: "rgba(0,201,167,0.18)", margin: "0 6px" }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Financials ───────────────────────────────────────────────────────

function Step1(props: {
  use4Years: boolean; setUse4Years: (v: boolean) => void;
  useYtd: boolean; setUseYtd: (v: boolean) => void;
  ytdMonths: string; setYtdMonths: (v: string) => void;
  years: YearState[]; updateYear: (i: number, f: "revenue" | "sde", v: string) => void;
  ytd: YearState; setYtd: (y: YearState) => void;
  askPrice: string; setAskPrice: (v: string) => void;
  cfGoal: string; setCfGoal: (v: string) => void;
  analysis: Analysis | null;
  scores: Record<string, number>; setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  risks: Record<string, number>; setRisks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  ratingMode: "quick" | "guided"; setRatingMode: (v: "quick" | "guided") => void;
  guidedScoreAnswers: Record<string, (boolean | null)[]>;
  setGuidedScoreAnswers: React.Dispatch<React.SetStateAction<Record<string, (boolean | null)[]>>>;
  guidedRiskAnswers: Record<string, (boolean | null)[]>;
  setGuidedRiskAnswers: React.Dispatch<React.SetStateAction<Record<string, (boolean | null)[]>>>;
  onRun: () => void;
}) {
  const yearCount = props.use4Years ? 4 : 3;
  const canProceed = props.years.slice(0, yearCount).every((y) => parse(y.sde) > 0);
  const cfGoalV = parse(props.cfGoal);
  const avgSDE = props.analysis?.avgSDE ?? 0;

  // Cash flow goal feedback
  const r = 0.095; const mr = r / 12; const m = 120;
  const ppd = ((mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1)) * 0.9 * 12;
  const maxP = avgSDE > 0 && cfGoalV > 0 ? (avgSDE - cfGoalV * 12) / ppd : 0;

  return (
    <div>
      <SecTitle title="Business financials" sub="Enter revenue and SDE for each year, oldest first. Toggle on Year 4 or YTD if available." />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <thead>
          <tr>
            <th style={{ width: 110, textAlign: "left", fontSize: 11, color: "var(--muted)", fontWeight: 500, padding: "6px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }} />
            {["Year 1", "Year 2", "Year 3"].map((l, i) => (
              <th key={i} style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, textAlign: "center", padding: "6px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span>{l}</span>
                  {i === 0 && <span style={{ fontSize: 9, color: "var(--amber)" }}>oldest</span>}
                </div>
              </th>
            ))}
            <th style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, textAlign: "center", padding: "6px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span>Year 4</span>
                <Toggle on={props.use4Years} onToggle={() => props.setUse4Years(!props.use4Years)} />
              </div>
            </th>
            <th style={{ fontSize: 11, color: "var(--teal)", fontWeight: 500, textAlign: "center", padding: "6px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span>YTD</span>
                <Toggle on={props.useYtd} onToggle={() => props.setUseYtd(!props.useYtd)} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {(["Revenue", "SDE"] as const).map((field) => (
            <tr key={field}>
              <td style={{ fontSize: 12, color: "var(--warm)", fontWeight: 500, padding: "6px 8px" }}>{field}</td>
              {[0, 1, 2].map((i) => (
                <td key={i} style={{ padding: "6px 8px" }}>
                  <input type="number" placeholder="—" style={CELL_INPUT}
                    value={field === "Revenue" ? props.years[i].revenue : props.years[i].sde}
                    onChange={(e) => props.updateYear(i, field === "Revenue" ? "revenue" : "sde", e.target.value)} />
                </td>
              ))}
              <td style={{ padding: "6px 8px", opacity: props.use4Years ? 1 : 0.22, pointerEvents: props.use4Years ? "auto" : "none" }}>
                <input type="number" placeholder="—" style={CELL_INPUT}
                  value={field === "Revenue" ? props.years[3].revenue : props.years[3].sde}
                  onChange={(e) => props.updateYear(3, field === "Revenue" ? "revenue" : "sde", e.target.value)} />
              </td>
              <td style={{ padding: "6px 8px", opacity: props.useYtd ? 1 : 0.22, pointerEvents: props.useYtd ? "auto" : "none" }}>
                <input type="number" placeholder="—" style={CELL_INPUT}
                  value={field === "Revenue" ? props.ytd.revenue : props.ytd.sde}
                  onChange={(e) => props.setYtd({ ...props.ytd, [field === "Revenue" ? "revenue" : "sde"]: e.target.value })} />
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ fontSize: 11, color: "var(--muted)", padding: "6px 8px 6px 14px" }}>SDE margin</td>
            {[0, 1, 2].map((i) => {
              const rv = parse(props.years[i].revenue); const sv = parse(props.years[i].sde);
              return <td key={i}><div style={{ fontSize: 12, fontWeight: 500, color: "var(--teal)", textAlign: "center", padding: "4px 8px" }}>{rv > 0 && sv > 0 ? (sv / rv * 100).toFixed(1) + "%" : "—"}</div></td>;
            })}
            {[props.years[3], props.ytd].map((y, i) => {
              const rv = parse(y.revenue); const sv = parse(y.sde);
              return <td key={i}><div style={{ fontSize: 12, fontWeight: 500, color: "var(--teal)", textAlign: "center", padding: "4px 8px" }}>{rv > 0 && sv > 0 ? (sv / rv * 100).toFixed(1) + "%" : "—"}</div></td>;
            })}
          </tr>
        </tbody>
      </table>

      {props.useYtd && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>Months completed (YTD)</label>
          <select value={props.ytdMonths} onChange={(e) => props.setYtdMonths(e.target.value)}
            style={{ background: "var(--navy2)", border: "1px solid rgba(0,201,167,0.18)", borderRadius: 8, color: "var(--warm)", padding: "9px 12px", fontSize: 14, width: "100%", maxWidth: 200, outline: "none" }}>
            {[1,2,3,4,5,6,7,8,9,10,11].map(n => <option key={n} value={n}>{n} month{n !== 1 ? "s" : ""}</option>)}
          </select>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>YTD will be annualized and weighted most heavily.</p>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <FieldInput label="Asking price" value={props.askPrice} onChange={props.setAskPrice} placeholder="e.g. 1600000" />
      </div>

      <div style={{ background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.22)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--teal)", marginBottom: 4 }}>What&rsquo;s your cash flow goal?</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>How much do you want to take home each month after debt service? All figures pre-tax.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldInput label="Target monthly cash flow (pre-tax)" value={props.cfGoal} onChange={props.setCfGoal} placeholder="e.g. 8000" />
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
            {cfGoalV > 0 && avgSDE > 0 && (
              maxP > 0
                ? <div style={{ fontSize: 12, color: "var(--teal)", lineHeight: 1.5 }}>Goal achievable up to<br /><strong style={{ fontSize: 15 }}>{fmtM(maxP)}</strong><br />at 9.5% SBA</div>
                : <div style={{ fontSize: 12, color: "var(--danger)", lineHeight: 1.5 }}>Goal may not be achievable<br />at current SDE level.</div>
            )}
          </div>
        </div>
      </div>

      {avgSDE > 0 && (
        <div style={{ background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.18)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Weighted avg SDE: </span>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--teal)" }}>{fmt(avgSDE)}</span>
        </div>
      )}

      {/* Rating mode toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>Qualitative & risk scoring</div>
        <div style={{ display: "flex", background: "var(--navy2)", borderRadius: 8, padding: 3, gap: 3, border: "1px solid rgba(0,201,167,0.18)" }}>
          {(["quick", "guided"] as const).map((mode) => (
            <button key={mode} onClick={() => props.setRatingMode(mode)}
              style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                background: props.ratingMode === mode ? "var(--teal)" : "transparent",
                color: props.ratingMode === mode ? "#0A1628" : "var(--muted)", transition: "all 0.2s" }}>
              {mode === "quick" ? "Quick rate" : "Guided questions"}
            </button>
          ))}
        </div>
      </div>

      {/* Qualitative + Risk panels side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* Left: Qualitative scores */}
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            {props.ratingMode === "quick" ? "Score 1–5 — shapes the valuation multiple." : "Answer each question — score is calculated automatically."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SCORE_FACTORS.map((f) =>
              props.ratingMode === "quick" ? (
                <QuickRateItem key={f.key} label={f.label} desc={f.desc} value={props.scores[f.key]} isRisk={false}
                  onChange={(v) => props.setScores((p) => ({ ...p, [f.key]: v }))} />
              ) : (
                <GuidedItem key={f.key} label={f.label} desc={f.desc} value={props.scores[f.key]}
                  questions={SCORE_QUESTIONS[f.key] ?? []}
                  answers={props.guidedScoreAnswers[f.key] ?? []}
                  isRisk={false}
                  onAnswer={(qIdx, val) => {
                    const next = { ...props.guidedScoreAnswers, [f.key]: [...(props.guidedScoreAnswers[f.key] ?? [])] };
                    next[f.key][qIdx] = val;
                    props.setGuidedScoreAnswers(next);
                    props.setScores((p) => ({ ...p, [f.key]: scoreFromAnswers(next[f.key], false) }));
                  }} />
              )
            )}
          </div>
        </div>
        {/* Right: Risk factors */}
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            {props.ratingMode === "quick" ? "Rate 0–5 — higher scores reduce the multiple." : "Answer each question — risk level is calculated automatically."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RISK_FACTORS.map((f) =>
              props.ratingMode === "quick" ? (
                <QuickRateItem key={f.key} label={f.label} desc={f.desc} value={props.risks[f.key]} isRisk={true}
                  onChange={(v) => props.setRisks((p) => ({ ...p, [f.key]: v }))} />
              ) : (
                <GuidedItem key={f.key} label={f.label} desc={f.desc} value={props.risks[f.key]}
                  questions={RISK_QUESTIONS[f.key] ?? []}
                  answers={props.guidedRiskAnswers[f.key] ?? []}
                  isRisk={true}
                  onAnswer={(qIdx, val) => {
                    const next = { ...props.guidedRiskAnswers, [f.key]: [...(props.guidedRiskAnswers[f.key] ?? [])] };
                    next[f.key][qIdx] = val;
                    props.setGuidedRiskAnswers(next);
                    props.setRisks((p) => ({ ...p, [f.key]: scoreFromAnswers(next[f.key], true) }));
                  }} />
              )
            )}
          </div>
        </div>
      </div>

      <BtnRow>
        <button className="btn-primary" disabled={!canProceed} onClick={props.onRun} style={{ opacity: canProceed ? 1 : 0.5 }}>
          Run analysis →
        </button>
      </BtnRow>
      <Disc>Scores and risk ratings are subjective estimates only. Not financial or legal advice.</Disc>
    </div>
  );
}

// ─── Step 4: Analysis ────────────────────────────────────────────────────────

function Step4Analysis(props: {
  analysis: Analysis;
  scores: Record<string, number>;
  askPrice: number; cfGoal: number;
  custMode: boolean; setCustMode: (v: boolean) => void;
  custMult: number; setCustMult: (v: number) => void;
  activeMult: number;
  activeRange: { fmv: number; cashOffer: number; creativeOffer: number };
  selReasons: Set<string>; setSelReasons: (v: Set<string>) => void;
  onBack: () => void; onNext: () => void;
}) {
  const { analysis: a, scores, askPrice, cfGoal, custMode, setCustMode, custMult, setCustMult, activeMult, activeRange, selReasons, setSelReasons } = props;
  const { fmv, cashOffer, creativeOffer } = activeRange;
  const askMult = askPrice > 0 ? askPrice / a.avgSDE : 0;
  const diff = custMult - a.recMult;

  // Offer range bar
  const lo = Math.min(cashOffer, askPrice > 0 ? askPrice : cashOffer) * 0.9;
  const hi = Math.max(creativeOffer, askPrice > 0 ? askPrice : creativeOffer) * 1.05;
  const range = hi - lo || 1;
  const barLeft = ((cashOffer - lo) / range * 100).toFixed(1);
  const barWidth = Math.max(0, (creativeOffer - cashOffer) / range * 100).toFixed(1);
  const askLeft = askPrice > 0 ? Math.min(98, Math.max(1, (askPrice - lo) / range * 100)).toFixed(1) : null;

  // Growth metrics
  const hR = a.histRevenues; const hS = a.histSdes; const hY = a.histLabels;
  const rYoY = yoyFn(hR); const sYoY = yoyFn(hS);
  const rCAGR = cagrFn(hR[0], hR[hR.length - 1], hR.length - 1);
  const sCAGR = cagrFn(hS[0], hS[hS.length - 1], hS.length - 1);
  const mAR = Math.max(...rYoY.map(Math.abs), 0.01);
  const mAS = Math.max(...sYoY.map(Math.abs), 0.01);
  const mid = Math.ceil(rYoY.length / 2);
  const eA = rYoY.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
  const lArr = rYoY.slice(mid);
  const lA = lArr.length ? lArr.reduce((a, b) => a + b, 0) / lArr.length : eA;
  const delta = lA - eA;
  const mSig = delta > 0.01 ? "Growth is accelerating — recent periods outpace earlier ones." : delta < -0.02 ? "Growth is decelerating — be conservative with projections." : "Growth is relatively stable across the period.";
  const mBg = delta > 0.01 ? "rgba(0,201,167,0.08)" : delta < -0.02 ? "rgba(226,75,74,0.08)" : "rgba(154,165,180,0.08)";
  const mBor = delta > 0.01 ? "rgba(0,201,167,0.2)" : delta < -0.02 ? "rgba(226,75,74,0.2)" : "rgba(154,165,180,0.15)";
  const mCol = delta > 0.01 ? "var(--teal)" : delta < -0.02 ? "var(--danger)" : "var(--muted)";

  // Signal chips
  const sigs: { t: string; p: boolean | null }[] = [];
  if (rCAGR > 0.1) sigs.push({ t: `Strong revenue growth (${fmtP(rCAGR, true)} CAGR)`, p: true });
  else if (rCAGR > 0) sigs.push({ t: `Moderate revenue growth (${fmtP(rCAGR, true)} CAGR)`, p: true });
  else sigs.push({ t: `Revenue declining (${fmtP(rCAGR, true)} CAGR)`, p: false });
  if (sCAGR > rCAGR + 0.01) sigs.push({ t: "SDE growing faster than revenue — margins expanding", p: true });
  else if (sCAGR < rCAGR - 0.05) sigs.push({ t: "SDE lagging revenue — margins compressing", p: false });
  else sigs.push({ t: "SDE and revenue growing in line", p: null });
  if (rYoY.length && rYoY[rYoY.length - 1] < 0) sigs.push({ t: "Most recent year shows revenue decline", p: false });
  const avgMg = hS.reduce((a, b) => a + b, 0) / hR.reduce((a, b) => a + b, 0);
  if (avgMg > 0.35) sigs.push({ t: `Strong avg SDE margin (${(avgMg * 100).toFixed(0)}%)`, p: true });
  else if (avgMg < 0.20) sigs.push({ t: `Thin avg SDE margin (${(avgMg * 100).toFixed(0)}%)`, p: false });

  // Guardrails
  const glLow = Math.max(1.0, Math.round((a.recMult - 1.0) * 4) / 4);
  const glHigh = Math.min(15.0, Math.round((a.recMult + 1.5) * 4) / 4);

  return (
    <div>
      {/* Hero */}
      <div style={{ ...S, textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>Recommended offer range</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: "var(--teal)" }}>{fmtM(cashOffer)} – {fmtM(creativeOffer)}</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{activeMult.toFixed(2)}x weighted SDE of {fmtM(a.avgSDE)} · {a.dataNote}</div>
        {askPrice > 0 && <div style={{ marginTop: 5, fontSize: 12, color: askPrice > fmv * 1.08 ? "var(--amber)" : "var(--teal)" }}>
          {askPrice > fmv * 1.08 ? `Asking ${fmtM(askPrice)} (${askMult.toFixed(2)}x) — above fair value` : `Asking ${fmtM(askPrice)} (${askMult.toFixed(2)}x) — within range`}
        </div>}
        {cfGoal > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>Cash flow goal {fmt(cfGoal)}/mo · Max all-SBA price: <span style={{ color: "var(--teal)", fontWeight: 500 }}>{fmtM(a.maxSBAPrice)}</span></div>}
      </div>

      {/* Year 1 projections */}
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, color: "var(--warm)" }}>Year 1 projections <span style={{ display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(232,160,32,0.12)", color: "var(--amber)", border: "1px solid rgba(232,160,32,0.22)", marginLeft: 6, verticalAlign: "middle" }}>estimated · pre-tax</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <MiniCard label="Projected revenue" value={fmtM(a.yr1Rev)} color="var(--teal)" note="+4% growth on weighted avg" />
        <MiniCard label="Projected SDE" value={fmtM(a.yr1SDE)} color="var(--teal)" note="Consistent margin applied" />
      </div>

      {/* Custom multiple panel */}
      <div style={{ ...S, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--warm)" }}>Valuation multiple</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Model recommendation based on SDE benchmarks, qualitative scores, and risk. Switch to set your own.</div>
          </div>
          <div style={{ display: "flex", background: "var(--navy3)", borderRadius: 8, padding: 3, gap: 3 }}>
            {(["Model recommendation", "My multiple"] as const).map((lbl, i) => (
              <button key={lbl} onClick={() => { setCustMode(i === 1); if (i === 0) setCustMult(a.recMult); }}
                style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", background: custMode === (i === 1) ? "var(--teal)" : "transparent", color: custMode === (i === 1) ? "#0A1628" : "var(--muted)", transition: "all 0.2s" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {!custMode && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <MiniCard label="Benchmark (SDE band)" value={`${a.bench.toFixed(2)}x`} color="var(--warm)" note="Market comp for this SDE level" />
              <MiniCard label="Qualitative adjustment" value={`${a.qualitativeMod >= 0 ? "+" : ""}${a.qualitativeMod.toFixed(2)}x`} color={a.qualitativeMod >= 0 ? "var(--teal)" : "var(--danger)"} note={`Avg score ${(SCORE_FACTORS.reduce((s, f) => s + scores[f.key], 0) / SCORE_FACTORS.length).toFixed(2)} / 5.00`} />
              <MiniCard label="Risk penalty" value={`–${a.riskPenalty.toFixed(2)}x`} color="var(--danger)" note={`${a.flaggedRisks.length} risk flag${a.flaggedRisks.length !== 1 ? "s" : ""} present`} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 10, padding: "12px 16px" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Recommended multiple</div>
                <div style={{ fontSize: 28, fontWeight: 500, color: "var(--teal)" }}>{a.recMult.toFixed(2)}x</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Applied to SDE of {fmtM(a.avgSDE)}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: "var(--warm)" }}>{fmtM(fmv)} fair value</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Standard band: {a.bench >= 3.375 ? "3.0x – 3.75x" : a.bench >= 2.75 ? "2.5x – 3.0x" : "2.0x – 2.7x"}</div>
              </div>
            </div>
          </div>
        )}

        {custMode && (
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>Drag to set your own multiple — 1.00x to 15.00x in 0.25 increments.</div>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <div style={{ position: "absolute", top: 6, height: 4, left: `${((glLow - 1) / 14 * 100).toFixed(1)}%`, width: `${((glHigh - glLow) / 14 * 100).toFixed(1)}%`, background: "rgba(0,201,167,0.18)", borderRadius: 2, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <input type="range" min={1} max={15} step={0.25} value={custMult}
                    onChange={(e) => setCustMult(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--teal)" }} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 500, color: "var(--teal)", minWidth: 54, textAlign: "right" }}>{custMult.toFixed(2)}x</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>1.0x</span>
              <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 20, background: "rgba(0,201,167,0.1)", border: "1px solid rgba(0,201,167,0.25)", color: "var(--teal)" }}>Guardrail: {glLow.toFixed(2)}x – {glHigh.toFixed(2)}x for this deal</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>15.0x</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <MiniCard label="Model recommendation" value={`${a.recMult.toFixed(2)}x`} color="var(--muted)" note="" />
              <MiniCard label="Your multiple" value={`${custMult.toFixed(2)}x`} color="var(--teal)" note="" />
              <MiniCard label="Resulting fair value" value={fmtM(a.avgSDE * custMult)} color={custMult > a.recMult ? "var(--teal)" : custMult < a.recMult ? "var(--amber)" : "var(--warm)"} note="" />
            </div>
            {Math.abs(diff) >= 0.01 && (
              <div style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, marginTop: 10, lineHeight: 1.5, background: diff > 0 ? "rgba(0,201,167,0.08)" : "rgba(226,75,74,0.08)", border: `1px solid ${diff > 0 ? "rgba(0,201,167,0.2)" : "rgba(226,75,74,0.2)"}`, color: diff > 0 ? "var(--teal)" : "var(--danger)" }}>
                {diff > 0 ? `+${diff.toFixed(2)}x above model → fair value increases by ${fmtM(a.avgSDE * diff)} to ${fmtM(fmv)}` : `${diff.toFixed(2)}x below model → fair value decreases by ${fmtM(a.avgSDE * Math.abs(diff))} to ${fmtM(fmv)}`}
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, marginTop: 12 }}>Why are you adjusting?</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {REASONS.map((r) => (
                <button key={r} onClick={() => {
                  const n = new Set(selReasons);
                  if (n.has(r)) { n.delete(r); } else { n.add(r); }
                  setSelReasons(n);
                }} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: `1px solid ${selReasons.has(r) ? "var(--teal)" : "rgba(0,201,167,0.18)"}`, background: selReasons.has(r) ? "rgba(0,201,167,0.12)" : "transparent", color: selReasons.has(r) ? "var(--teal)" : "var(--muted)", cursor: "pointer", transition: "all 0.2s" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Offer range bar */}
      <div style={{ ...S, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Offer range relative to asking price</div>
        <div style={{ position: "relative", height: 8, background: "var(--navy3)", borderRadius: 4, margin: "8px 0 6px" }}>
          <div style={{ position: "absolute", height: "100%", borderRadius: 4, background: "var(--teal)", opacity: 0.7, top: 0, left: `${barLeft}%`, width: `${barWidth}%` }} />
          {askLeft && <div style={{ position: "absolute", width: 2, height: 16, background: "var(--amber)", top: -4, borderRadius: 1, left: `${askLeft}%` }} />}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
          <span>{fmtM(lo)}</span><span>{fmtM(hi)}</span>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
          {[["var(--teal)", "Offer range"], ["var(--amber)", "Asking price"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--muted)" }}>
              <div style={{ width: 10, height: 4, borderRadius: 2, background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* Financial trend chart */}
      <div style={{ ...S, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)", marginBottom: 4 }}>Financial trend</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Historical revenue and SDE with trend lines</div>
        <TrendChart years={a.histLabels} revenues={a.histRevenues} sdes={a.histSdes} />
      </div>

      {/* Growth metrics */}
      {hR.length >= 2 && (
        <div style={{ ...S, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>Growth metrics</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "1px solid rgba(245,242,236,0.2)", background: "rgba(245,242,236,0.08)", color: "var(--warm)" }}>Rev CAGR <strong>{fmtP(rCAGR, true)}</strong></span>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "1px solid rgba(0,201,167,0.18)", background: "rgba(0,201,167,0.08)", color: "var(--teal)" }}>SDE CAGR <strong>{fmtP(sCAGR, true)}</strong></span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 12 }}>
              <thead>
                <tr>{["Period", "Revenue", "Rev growth", "SDE", "SDE growth", "Margin"].map((h, i) => (
                  <th key={h} style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, textAlign: i === 0 ? "left" : "right", padding: "5px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--muted)" }}>{hY[0]}</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--warm)" }}>{fmt(hR[0])}</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 11, color: "var(--muted)" }}>Base year</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--teal)" }}>{fmt(hS[0])}</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 11, color: "var(--muted)" }}>Base year</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--muted)" }}>{(hS[0] / hR[0] * 100).toFixed(1)}%</td>
                </tr>
                {rYoY.map((rv, i) => {
                  const sv = sYoY[i];
                  const rW = (Math.abs(rv) / mAR * 45).toFixed(1);
                  const sW = (Math.abs(sv) / mAS * 45).toFixed(1);
                  const mg = (hS[i + 1] / hR[i + 1] * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--muted)" }}>{hY[i + 1]}</td>
                      <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--warm)" }}>{fmt(hR[i + 1])}</td>
                      <td style={{ padding: "5px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "var(--navy3)", borderRadius: 3, overflow: "hidden", position: "relative", minWidth: 60 }}>
                            <div style={{ position: "absolute", top: 0, height: "100%", width: `${rW}%`, left: rv >= 0 ? "50%" : `calc(50% - ${rW}%)`, background: gC(rv), borderRadius: 3 }} />
                            <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(154,165,180,0.3)" }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500, minWidth: 48, textAlign: "right", color: gC(rv) }}>{fmtP(rv, true)}</div>
                        </div>
                      </td>
                      <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--teal)" }}>{fmt(hS[i + 1])}</td>
                      <td style={{ padding: "5px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "var(--navy3)", borderRadius: 3, overflow: "hidden", position: "relative", minWidth: 60 }}>
                            <div style={{ position: "absolute", top: 0, height: "100%", width: `${sW}%`, left: sv >= 0 ? "50%" : `calc(50% - ${sW}%)`, background: gC(sv), borderRadius: 3 }} />
                            <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(154,165,180,0.3)" }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500, minWidth: 48, textAlign: "right", color: gC(sv) }}>{fmtP(sv, true)}</div>
                        </div>
                      </td>
                      <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--muted)" }}>{mg}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ background: "var(--navy)", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Revenue CAGR</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: gC(rCAGR) }}>{fmtP(rCAGR, true)}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{hY[0]} – {hY[hY.length - 1]} · {hY.length - 1}-yr compounded</div>
            </div>
            <div style={{ background: "var(--navy)", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>SDE CAGR</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: gC(sCAGR) }}>{fmtP(sCAGR, true)}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{hY[0]} – {hY[hY.length - 1]} · {hY.length - 1}-yr compounded</div>
            </div>
          </div>
          <div style={{ background: "var(--navy)", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(0,201,167,0.18)", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>Revenue growth momentum — earlier vs. recent periods</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[["Earlier avg growth", eA], ["Recent avg growth", lA]].map(([lbl, val]) => {
                const pct = Math.min(100, Math.max(0, ((val as number) + 0.4) / 0.8 * 100));
                return (
                  <div key={lbl as string}>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{lbl as string}</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: gC(val as number) }}>{fmtP(val as number, true)}</div>
                    <div style={{ height: 5, background: "var(--navy3)", borderRadius: 3, overflow: "hidden", marginTop: 5 }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct.toFixed(0)}%`, background: gC(val as number) }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, padding: "7px 10px", borderRadius: 6, background: mBg, border: `1px solid ${mBor}`, color: mCol }}>{mSig}</div>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {sigs.map((s, i) => (
              <div key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1px solid ${s.p === true ? "rgba(0,201,167,0.25)" : s.p === false ? "rgba(226,75,74,0.25)" : "rgba(154,165,180,0.2)"}`, background: s.p === true ? "rgba(0,201,167,0.08)" : s.p === false ? "rgba(226,75,74,0.08)" : "rgba(154,165,180,0.08)", color: s.p === true ? "var(--teal)" : s.p === false ? "var(--danger)" : "var(--muted)" }}>{s.t}</div>
            ))}
          </div>
        </div>
      )}

      {/* Napkin scores grid */}
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, color: "var(--warm)" }}>Napkin value scores</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {SCORE_FACTORS.map((f) => {
          const v = scores[f.key];
          return (
            <div key={f.key} style={{ background: "var(--navy2)", borderRadius: 8, padding: "9px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: v >= 4 ? "var(--teal)" : v >= 3 ? "var(--warm)" : "var(--amber)" }}>{v.toFixed(2)}</div>
              <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: i < Math.round(v) ? "var(--teal)" : "var(--navy3)" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk flags */}
      {a.flaggedRisks.length > 0 && (
        <div style={{ background: "rgba(226,75,74,0.08)", border: "1px solid rgba(226,75,74,0.22)", borderRadius: 10, padding: 13, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--danger)", marginBottom: 8 }}>Risk flags ({a.flaggedRisks.length})</div>
          {a.flaggedRisks.map((f) => (
            <div key={f.key} style={{ fontSize: 12, color: "var(--muted)", padding: "5px 0", borderBottom: "1px solid rgba(226,75,74,0.1)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", marginTop: 5, flexShrink: 0 }} />
              <span>{f.label}{f.score >= 4 ? " — critical" : " — addressable via structure"}</span>
              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, marginLeft: "auto", flexShrink: 0, background: f.severity.bg, color: f.severity.color }}>{f.severity.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--teal)", fontWeight: 500, marginBottom: 4 }}>Ready to structure this deal?</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>The multiple you select carries forward into the offer slider and 5-year forecast.</div>
      </div>

      <BtnRow>
        <GhostBtn onClick={props.onBack}>← Back</GhostBtn>
        <button className="btn-primary" onClick={props.onNext}>Structure this deal →</button>
      </BtnRow>
      <Disc>All valuations are pre-tax estimates for illustrative purposes only. A custom multiple does not represent a formal appraisal. Not financial or legal advice.</Disc>
    </div>
  );
}

// ─── Step 5: Structure ───────────────────────────────────────────────────────

function Step5Structure(props: {
  analysis: Analysis; activeMult: number;
  activeRange: { fmv: number; cashOffer: number; creativeOffer: number };
  scores: Record<string, number>; askPrice: number; cfGoal: number;
  businessName: string;
  yearInputs: { label: string; revenue: number; sde: number }[];
  eqAmount: string; setEqAmount: (v: string) => void;
  sbaAmount: string; setSbaAmount: (v: string) => void;
  sbaRate: string; setSbaRate: (v: string) => void;
  sbaTerm: string; setSbaTerm: (v: string) => void;
  snAmount: string; setSnAmount: (v: string) => void;
  snRate: string; setSnRate: (v: string) => void;
  snTerm: string; setSnTerm: (v: string) => void;
  offerPrice: number; setOfferPrice: (v: number) => void;
  addSources: AddSource[]; setAddSources: (v: AddSource[]) => void;
  addSrcCtr: number; setAddSrcCtr: (v: number) => void;
  fcGR: number[]; setFcGR: (v: number[]) => void;
  fcEx: number[]; setFcEx: (v: number[]) => void;
  onBack: () => void;
}) {
  const { analysis: a, activeRange, scores, askPrice, cfGoal, offerPrice, addSources } = props;
  const { fmv, cashOffer, creativeOffer } = activeRange;

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const eq = parse(props.eqAmount);
  const sbaA = parse(props.sbaAmount);
  const sbaR = parse(props.sbaRate);
  const sbaT = parse(props.sbaTerm);
  const snA = parse(props.snAmount);
  const snR = parse(props.snRate);
  const snT = parse(props.snTerm);

  const addTotal = addSources.reduce((s, x) => s + (x.amount || 0), 0);
  const tot = eq + sbaA + snA + addTotal;
  const gap = offerPrice - tot;

  const sbaDS = pmtFn(sbaA, sbaR / 100, sbaT * 12) * 12;
  const snDS = pmtFn(snA, snR / 100, snT * 12) * 12;
  const tDS = sbaDS + snDS;
  const pCF = a.avgSDE * 1.04 - tDS;
  const mCF = pCF / 12;
  const dscr = tDS > 0 ? a.avgSDE / tDS : 0;
  const d10 = tDS > 0 ? a.avgSDE * 0.9 / tDS : 0;
  const d30 = tDS > 0 ? a.avgSDE * 0.7 / tDS : 0;
  const wacc = calcWACC(eq, sbaA, sbaR, snA, snR, tot);
  const irr = calcIRR({ sde: a.avgSDE, exitMult: 3.8, years: 5, eq, sbaAmount: sbaA, sbaRate: sbaR, sbaTerm: sbaT, snAmount: snA, snRate: snR, snTerm: snT });

  const oMin = Math.round(Math.max(cashOffer * 0.85, fmv * 0.7) / 5000) * 5000;
  const oMax = Math.round(Math.max(creativeOffer, askPrice > 0 ? Math.min(askPrice, fmv * 1.3) : creativeOffer) / 5000) * 5000;
  const sMin = offerPrice * 0.1;

  // Margin score for buildSG
  const marginScore = a.avgRev > 0 ? (a.avgSDE / a.avgRev > 0.35 ? 4.5 : a.avgSDE / a.avgRev > 0.28 ? 3 : 2) : 2;

  const structGroups = buildSG({
    fv: fmv, co: cashOffer, cr: creativeOffer, avgSDE: a.avgSDE,
    flaggedRisks: a.flaggedRisks,
    oppScore: scores["opportunity"] ?? 3,
    teamScore: scores["team"] ?? 3,
    histScore: scores["history"] ?? 3,
    marginScore,
    askPrice,
  });

  // DSCR warning
  let dscrWarn: React.ReactNode = null;
  if (tDS > 0) {
    if (dscr < 1.25) dscrWarn = <DSCRWarn level="critical" dscr={dscr} />;
    else if (dscr < 1.3) dscrWarn = <DSCRWarn level="risk" dscr={dscr} />;
    else if (dscr < 1.5) dscrWarn = <DSCRWarn level="borderline" dscr={dscr} />;
  }

  return (
    <div>
      <SecTitle title="Structure this deal" sub="Set your offer, build your financing stack, and see your live pre-tax cash flow and 5-year forecast." />

      {/* Offer range summary */}
      <div style={{ background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Recommended offer range ({props.activeMult.toFixed(2)}x)</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: "var(--warm)", marginBottom: 3 }}>{fmtM(cashOffer)} – {fmtM(creativeOffer)}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Fair value: {fmtM(fmv)} at {props.activeMult.toFixed(2)}x{cfGoal > 0 ? ` · hits your ${fmt(cfGoal)}/mo goal at: ${fmtM(a.maxSBAPrice)}` : ""}</div>
        {askPrice > 0 && askPrice > creativeOffer && <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 5 }}>Asking {fmtM(askPrice)} is above the range — use creative structures to bridge the gap.</div>}
      </div>

      {/* Offer slider */}
      <div style={{ background: "var(--navy2)", borderRadius: 12, padding: 14, border: "1px solid rgba(0,201,167,0.18)", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>Your offer price</span>
          <span style={{ fontSize: 20, fontWeight: 500, color: "var(--teal)" }}>{fmtM(offerPrice)}</span>
        </div>
        <input type="range" min={oMin} max={oMax} step={5000} value={offerPrice}
          onChange={(e) => props.setOfferPrice(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--teal)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--muted)" }}>
          <span>{fmtM(oMin)}</span><span>{fmtM(oMax)}</span>
        </div>
      </div>

      {/* Purchase price breakdown */}
      <div style={{ background: "var(--navy2)", border: "1px solid rgba(0,201,167,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Purchase price breakdown</div>
        {[["Your cash at close", eq > 0 ? fmt(eq) : "—", "var(--warm)"], ["SBA loan", sbaA > 0 ? fmtM(sbaA) : "—", "var(--warm)"], ["Seller note", snA > 0 ? fmtM(snA) : "not included", "var(--warm)"]].map(([l, v, c]) => (
          <div key={l as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(0,201,167,0.1)" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{l}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: c as string }}>{v}</span>
          </div>
        ))}
        {addSources.filter(s => s.amount > 0).map(s => {
          const eqPct = offerPrice > 0 ? (s.amount / offerPrice * 100).toFixed(1) : "0";
          return (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(0,201,167,0.1)" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{s.name || "Additional source"}{s.isEquity ? <span style={{ fontSize: 10, color: "var(--amber)", marginLeft: 6 }}>{eqPct}% equity</span> : null}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--amber)" }}>{fmtM(s.amount)}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 9, marginTop: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--warm)" }}>Total</span>
          <span style={{ fontSize: 20, fontWeight: 500, color: "var(--teal)" }}>{tot > 0 ? fmtM(tot) : "—"}</span>
        </div>
        {tot > 100 && (
          <div style={{ marginTop: 8, fontSize: 11 }}>
            {gap > 500 ? <span style={{ color: "var(--danger)" }}>⚠ {fmtM(gap)} short of offer</span>
              : gap < -500 ? <span style={{ color: "var(--amber)" }}>{fmtM(Math.abs(gap))} over offer</span>
              : <span style={{ color: "var(--teal)" }}>✓ Fully covers the offer price</span>}
          </div>
        )}
      </div>

      {/* Stack explanation */}
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, background: "var(--navy2)", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(0,201,167,0.18)", marginBottom: 12 }}>
        <strong style={{ color: "var(--warm)" }}>Start with your cash</strong>, add the SBA loan to cover the bulk, then optionally negotiate a seller note.<br /><br />
        <strong style={{ color: "var(--warm)" }}>Cash at close</strong> — SBA requires at least 10% down. <strong style={{ color: "var(--warm)" }}>SBA loan</strong> — up to 90%, repaid over 10 years, ~9.5% currently. <strong style={{ color: "var(--warm)" }}>Seller note</strong> — seller finances part directly, usually at a lower rate.
      </div>

      {/* Cash at close */}
      <StackItem title="Your cash at close" value={eq > 0 ? fmt(eq) : "not set"} desc="Your equity stake. SBA requires minimum 10% of purchase price.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Cash available ($)</div>
            <input type="number" placeholder="e.g. 160000" style={MI} value={props.eqAmount} onChange={(e) => props.setEqAmount(e.target.value)} />
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>SBA min 10%: {fmt(sMin)}</div>
          </div>
        </div>
      </StackItem>

      {/* SBA loan */}
      <StackItem title="SBA loan" value={sbaA > 0 ? fmtM(sbaA) : "not set"} desc="Government-backed loan, lender pays seller, you repay over time.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["Loan amount ($)", props.sbaAmount, props.setSbaAmount, "e.g. 1250000", undefined],
            ["Interest rate (%)", props.sbaRate, props.setSbaRate, "", 0.1],
            ["Term (years)", props.sbaTerm, props.setSbaTerm, "", 1]].map(([lbl, val, set, ph, step]) => (
              <div key={lbl as string}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{lbl as string}</div>
                <input type="number" step={step as number | undefined} placeholder={ph as string} style={MI} value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} />
              </div>
            ))}
        </div>
      </StackItem>

      {/* Seller note */}
      <StackItem title="Seller note" value={snA > 0 ? fmtM(snA) : "not included"} desc="Optional. Seller loans you part of the price at a lower rate.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["Note amount ($)", props.snAmount, props.setSnAmount, "e.g. 150000", undefined],
            ["Interest rate (%)", props.snRate, props.setSnRate, "", 0.1],
            ["Term (years)", props.snTerm, props.setSnTerm, "", 1]].map(([lbl, val, set, ph, step]) => (
              <div key={lbl as string}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{lbl as string}</div>
                <input type="number" step={step as number | undefined} placeholder={ph as string} style={MI} value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} />
              </div>
            ))}
        </div>
      </StackItem>

      {/* Additional sources */}
      {addSources.map((src) => (
        <AddSourceCard key={src.id} src={src} offerPrice={offerPrice}
          onChange={(updated) => props.setAddSources(addSources.map(s => s.id === src.id ? updated : s))}
          onRemove={() => props.setAddSources(addSources.filter(s => s.id !== src.id))} />
      ))}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => {
          const id = `cs${props.addSrcCtr + 1}`;
          props.setAddSrcCtr(props.addSrcCtr + 1);
          props.setAddSources([...addSources, { id, name: "", amount: 0, rate: 0, isEquity: false }]);
        }} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 8, border: "1px dashed rgba(0,201,167,0.4)", background: "transparent", color: "var(--teal)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          + Add capital source <span style={{ fontSize: 10, color: "var(--muted)" }}>(investor, partner, HELOC, etc.)</span>
        </button>
      </div>

      {/* Gap / coverage */}
      {tot > 100 && gap > 500 && (
        <div style={{ background: "rgba(226,75,74,0.08)", border: "1px solid rgba(226,75,74,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 500, marginBottom: 3 }}>Funding gap</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--danger)" }}>{fmtM(gap)} short</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Increase SBA loan, add seller note, or bring more cash.</div>
        </div>
      )}
      {tot > 100 && gap <= 500 && (
        <div style={{ background: "rgba(0,201,167,0.08)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "var(--teal)", fontWeight: 500 }}>Stack covers the offer ✓</div>
          {gap < -500 && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{fmtM(Math.abs(gap))} surplus</div>}
        </div>
      )}

      {dscrWarn}

      {/* Live deal metrics */}
      <div style={{ background: "var(--navy2)", borderRadius: 12, border: "1px solid rgba(0,201,167,0.18)", padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)", marginBottom: 12 }}>Live deal metrics <span style={{ display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(232,160,32,0.12)", color: "var(--amber)", border: "1px solid rgba(232,160,32,0.22)", marginLeft: 6, verticalAlign: "middle" }}>pre-tax</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <LiveMetric label="Annual debt service" value={tDS > 0 ? fmtM(tDS) + "/yr" : "—"} color="var(--warm)" />
          <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>DSCR</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: tDS > 0 ? dscrColor(dscr) : "var(--muted)" }}>{tDS > 0 ? dscr.toFixed(2) + "x" : "—"}</div>
            {tDS > 0 && <div style={{ height: 5, background: "var(--navy3)", borderRadius: 3, overflow: "hidden", marginTop: 5 }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(100, dscr / 3 * 100).toFixed(0)}%`, background: dscrColor(dscr) }} />
            </div>}
            <div style={{ fontSize: 10, marginTop: 4, color: tDS > 0 ? dscrColor(dscr) : "var(--muted)" }}>{tDS > 0 ? (dscr >= 1.5 ? "Strong — lender ready" : dscr >= 1.3 ? "Acceptable — most lenders will approve" : dscr >= 1.25 ? "At SBA minimum — thin margin" : "Below SBA minimum — deal at risk") : "Enter financing to calculate"}</div>
          </div>
          <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>Monthly cash flow (pre-tax)</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: tDS > 0 ? (mCF > 0 ? "var(--teal)" : "var(--danger)") : "var(--muted)" }}>{tDS > 0 ? fmt(mCF) + "/mo" : "—"}</div>
            {cfGoal > 0 && tDS > 0 && <div style={{ marginTop: 4, fontSize: 10, color: mCF >= cfGoal ? "var(--teal)" : "var(--danger)" }}>{mCF >= cfGoal ? "Goal met ✓" : `Below ${fmt(cfGoal)} goal`}</div>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>WACC</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--warm)" }}>{tot > 0 ? (wacc * 100).toFixed(1) + "%" : "—"}</div>
            {tot > 0 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
              {[eq > 0 ? `eq ${(eq / tot * 100).toFixed(0)}%@20%` : null, sbaA > 0 ? `SBA ${(sbaA / tot * 100).toFixed(0)}%@${sbaR}%` : null, snA > 0 ? `note ${(snA / tot * 100).toFixed(0)}%@${snR}%` : null].filter(Boolean).join(" · ")}
            </div>}
          </div>
          <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>Est. 5-yr IRR (3.8x exit)</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: irr > 0 ? (irr > wacc ? "var(--teal)" : irr > 0.1 ? "var(--amber)" : "var(--danger)") : "var(--muted)" }}>{irr > 0 ? (irr * 100).toFixed(1) + "%" : "—"}</div>
            {irr > 0 && wacc > 0 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{irr > wacc ? `Exceeds WACC (${(wacc * 100).toFixed(1)}%) — value creating` : `Below WACC (${(wacc * 100).toFixed(1)}%)`}</div>}
          </div>
        </div>
        {/* Stress test */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,201,167,0.18)" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--warm)", marginBottom: 4 }}>Stress test</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 }}>DSCR measures how many times SDE covers loan payments. SBA requires 1.25x minimum — $1.25 earned per $1.00 owed. Lenders prefer 1.50x+.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>–10% revenue</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: tDS > 0 ? dscrColor(d10) : "var(--muted)" }}>{tDS > 0 ? d10.toFixed(2) + "x" : "—"}</div>
            </div>
            <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>–30% revenue</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: tDS > 0 ? dscrColor(d30) : "var(--muted)" }}>{tDS > 0 ? d30.toFixed(2) + "x" : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-year forecast */}
      <div style={{ background: "var(--navy2)", borderRadius: 12, border: "1px solid rgba(0,201,167,0.18)", padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--warm)", marginBottom: 4 }}>5-year cash flow forecast <span style={{ display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(232,160,32,0.12)", color: "var(--amber)", border: "1px solid rgba(232,160,32,0.22)", marginLeft: 6, verticalAlign: "middle" }}>pre-tax</span></div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>Growth rates and expenses are editable. Debt service updates from your capital stack.</div>
        <ForecastTable fcGR={props.fcGR} setFcGR={props.setFcGR} fcEx={props.fcEx} setFcEx={props.setFcEx} sbaA={sbaA} sbaR={sbaR} sbaT={sbaT} snA={snA} snR={snR} snT={snT} avgRev={a.avgRev} avgSDE={a.avgSDE} />
      </div>

      {/* Deal structures */}
      <div style={{ height: 1, background: "rgba(0,201,167,0.18)", margin: "14px 0" }} />
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2, color: "var(--warm)" }}>Recommended deal structures</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Tailored to this deal&rsquo;s valuation gap, risk profile, and opportunity score.</div>
      {structGroups.map((g) => (
        <div key={g.label}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8, marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            {g.label}
            <div style={{ flex: 1, height: 1, background: "rgba(0,201,167,0.18)" }} />
          </div>
          {g.tactics.map((t) => {
            const badgeBg = t.cls === "am" ? "rgba(232,160,32,0.12)" : t.cls === "bl" ? "rgba(55,138,221,0.12)" : "rgba(0,201,167,0.12)";
            const badgeColor = t.cls === "am" ? "var(--amber)" : t.cls === "bl" ? "#5BA3E8" : "var(--teal)";
            const badgeBorder = t.cls === "am" ? "rgba(232,160,32,0.22)" : t.cls === "bl" ? "rgba(55,138,221,0.22)" : "rgba(0,201,167,0.22)";
            return (
              <div key={t.name} style={{ background: "var(--navy2)", borderRadius: 10, padding: "13px 14px", border: "1px solid rgba(0,201,167,0.18)", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--teal)" }}>{t.name}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>{t.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 6 }}>{t.desc}</div>
                <div style={{ fontSize: 12, color: "var(--warm)", padding: "5px 10px", background: "rgba(0,201,167,0.06)", borderRadius: 6, borderLeft: "2px solid var(--teal)" }}>{t.eg}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, fontStyle: "italic" }}>Why here: {t.why}</div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Save to Pipeline */}
      <div style={{ background: "rgba(0,201,167,0.06)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--warm)", marginBottom: 4 }}>Save to Pipeline</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
          Saves the business name, SDE, multiple, offer range, DSCR, and IRR so you can track and compare this deal in your pipeline.
        </div>
        {saveStatus === "saved" && (
          <div style={{ fontSize: 13, color: "var(--teal)", fontWeight: 500, marginBottom: 10 }}>✓ Saved to your pipeline</div>
        )}
        {saveStatus === "error" && (
          <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>{saveError}</div>
        )}
        <button
          disabled={saveStatus === "saving" || saveStatus === "saved"}
          onClick={async () => {
            setSaveStatus("saving");
            setSaveError("");
            try {
              const res = await fetch("/api/deals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: props.businessName.trim() || "Unnamed Deal",
                  stage: "Valuation",
                  sde: a.avgSDE,
                  multiple: props.activeMult,
                  asking_price: askPrice > 0 ? askPrice : null,
                  offer_low: activeRange.cashOffer > 0 ? Math.round(activeRange.cashOffer) : null,
                  offer_high: activeRange.creativeOffer > 0 ? Math.round(activeRange.creativeOffer) : null,
                  dscr: tDS > 0 ? parseFloat(dscr.toFixed(2)) : null,
                  irr: irr > 0 ? parseFloat((irr * 100).toFixed(1)) : null,
                  notes: "",
                }),
              });
              if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Failed to save. Make sure you're signed in.");
              }
              setSaveStatus("saved");
            } catch (e: unknown) {
              setSaveError(e instanceof Error ? e.message : "Something went wrong");
              setSaveStatus("error");
            }
          }}
          style={{
            background: saveStatus === "saved" ? "rgba(0,201,167,0.15)" : "var(--teal)",
            color: saveStatus === "saved" ? "var(--teal)" : "#0A1628",
            border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: saveStatus === "saving" || saveStatus === "saved" ? "default" : "pointer", opacity: saveStatus === "saving" ? 0.7 : 1,
          }}
        >
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved to pipeline" : "Save to pipeline →"}
        </button>
      </div>

      {/* Download PDF */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={async () => {
            await exportDealAnalyzerPDF({
              businessName: props.businessName,
              avgSDE: a.avgSDE,
              activeMult: props.activeMult,
              askPrice: askPrice,
              offerPrice: offerPrice,
              offerLow: Math.round(activeRange.cashOffer),
              offerHigh: Math.round(activeRange.creativeOffer),
              dscr: tDS > 0 ? dscr : 0,
              irr: irr,
              eq,
              sbaAmount: sbaA,
              sbaRate: sbaR,
              sbaTerm: sbaT,
              snAmount: snA,
              snRate: snR,
              snTerm: snT,
              yearInputs: props.yearInputs,
            });
          }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid rgba(0,201,167,0.3)", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 500, color: "var(--teal)", cursor: "pointer" }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1v9M4 7l3.5 3.5L11 7M2 13h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Download PDF report
        </button>
      </div>

      <BtnRow>
        <GhostBtn onClick={props.onBack}>← Back to analysis</GhostBtn>
      </BtnRow>
      <Disc>All cash flow, DSCR, WACC, and IRR figures are pre-tax estimates for illustrative purposes only. Consult a qualified M&amp;A attorney, CPA, and lender before executing any acquisition. SBA loan eligibility subject to lender approval.</Disc>
    </div>
  );
}

// ─── Forecast table ───────────────────────────────────────────────────────────

function ForecastTable({ fcGR, setFcGR, fcEx, setFcEx, sbaA, sbaR, sbaT, snA, snR, snT, avgRev, avgSDE }: {
  fcGR: number[]; setFcGR: (v: number[]) => void;
  fcEx: number[]; setFcEx: (v: number[]) => void;
  sbaA: number; sbaR: number; sbaT: number;
  snA: number; snR: number; snT: number;
  avgRev: number; avgSDE: number;
}) {
  const smg = avgRev > 0 ? avgSDE / avgRev : 0.33;
  let sbaB = sbaA; let snB = snA;
  const rows: { rev: number; sde: number; int: number; prin: number; tot: number; cf: number }[] = [];
  let rev = avgRev;
  for (let y = 0; y < 5; y++) {
    rev = rev * (1 + fcGR[y] / 100);
    const sde = rev * smg;
    const sM = sbaT * 12; const nM = snT * 12;
    const sTP = pmtFn(sbaA, sbaR / 100, sM) * 12;
    const nTP = pmtFn(snA, snR / 100, nM) * 12;
    const sI = sbaB * (sbaR / 100); const sP = Math.min(sbaB, sTP - sI); sbaB = Math.max(0, sbaB - sP);
    const nI = snB * (snR / 100); const nP = Math.min(snB, nTP - nI); snB = Math.max(0, snB - nP);
    rows.push({ rev, sde, int: sI + nI, prin: sP + nP, tot: sTP + nTP, cf: sde - sTP - nTP - (fcEx[y] || 0) });
  }

  const CI: React.CSSProperties = { background: "var(--navy3)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 4, color: "var(--teal)", padding: "3px 6px", fontSize: 12, width: 68, outline: "none", textAlign: "right" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 150, textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 500, padding: "5px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>Item</th>
            {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map(h => (
              <th key={h} style={{ textAlign: "right", fontSize: 10, color: "var(--muted)", fontWeight: 500, padding: "5px 8px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <FTHead label="Revenue" />
          <tr>
            <td style={{ fontSize: 11, color: "var(--muted)", padding: "5px 8px" }}>Sales growth (%)</td>
            {fcGR.map((v, i) => (
              <td key={i} style={{ padding: "5px 8px", textAlign: "right" }}>
                <input type="number" style={CI} value={v} onChange={(e) => { const n = [...fcGR]; n[i] = parseFloat(e.target.value) || 0; setFcGR(n); }} />%
              </td>
            ))}
          </tr>
          <tr>
            <td style={{ fontSize: 11, color: "var(--muted)", padding: "5px 8px" }}>Revenue</td>
            {rows.map((r, i) => <td key={i} style={{ padding: "5px 8px", textAlign: "right", color: "var(--teal)", fontWeight: 500 }}>{fmt(r.rev)}</td>)}
          </tr>
          <tr>
            <td style={{ fontSize: 11, color: "var(--muted)", padding: "5px 8px" }}>SDE ({Math.round(smg * 100)}% margin)</td>
            {rows.map((r, i) => <td key={i} style={{ padding: "5px 8px", textAlign: "right", color: "var(--warm)" }}>{fmt(r.sde)}</td>)}
          </tr>
          <FTHead label="Debt service" />
          {[["Less: interest", rows.map(r => -r.int)], ["Less: principal", rows.map(r => -r.prin)], ["Total debt service", rows.map(r => -r.tot)]].map(([lbl, vals]) => (
            <tr key={lbl as string}>
              <td style={{ fontSize: 11, color: "var(--muted)", padding: "5px 8px" }}>{lbl as string}</td>
              {(vals as number[]).map((v, i) => <td key={i} style={{ padding: "5px 8px", textAlign: "right", color: "var(--danger)", borderBottom: lbl === "Total debt service" ? "1px solid rgba(0,201,167,0.18)" : undefined, fontWeight: lbl === "Total debt service" ? 500 : undefined }}>{fmt(v)}</td>)}
            </tr>
          ))}
          <FTHead label={<>Additional expenses <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>(editable)</span></>} />
          <tr>
            <td style={{ fontSize: 11, color: "var(--muted)", padding: "5px 8px" }}>Seller salary / other ($)</td>
            {fcEx.map((v, i) => (
              <td key={i} style={{ padding: "5px 8px", textAlign: "right" }}>
                <input type="number" style={CI} value={v} onChange={(e) => { const n = [...fcEx]; n[i] = parseFloat(e.target.value) || 0; setFcEx(n); }} />
              </td>
            ))}
          </tr>
          <FTHead label="Cash flow" />
          {[["Pre-tax cash flow (annual)", rows.map(r => r.cf)], ["Pre-tax cash flow (monthly)", rows.map(r => r.cf / 12)]].map(([lbl, vals]) => (
            <tr key={lbl as string}>
              <td style={{ fontSize: 11, color: "var(--muted)", padding: "5px 8px" }}>{lbl as string}</td>
              {(vals as number[]).map((v, i) => <td key={i} style={{ padding: "5px 8px", textAlign: "right", color: v >= 0 ? "var(--teal)" : "var(--danger)", fontWeight: 500 }}>{fmt(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FTHead({ label }: { label: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={6} style={{ color: "var(--warm)", fontWeight: 500, fontSize: 12, padding: "10px 8px 5px", borderBottom: "1px solid rgba(0,201,167,0.18)" }}>{label}</td>
    </tr>
  );
}

// ─── Additional capital source card ─────────────────────────────────────────

function AddSourceCard({ src, offerPrice, onChange, onRemove }: {
  src: AddSource; offerPrice: number;
  onChange: (s: AddSource) => void;
  onRemove: () => void;
}) {
  const eqPct = offerPrice > 0 && src.amount > 0 ? (src.amount / offerPrice * 100).toFixed(1) : "0";
  return (
    <div style={{ ...S, borderLeft: "3px solid var(--amber)", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--amber)" }}>Additional capital source</span>
        <button onClick={onRemove} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(226,75,74,0.3)", background: "rgba(226,75,74,0.07)", color: "var(--danger)", cursor: "pointer" }}>Remove</button>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Investor capital, partner equity, HELOC, family loan, or other source.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Source name</div>
          <input type="text" placeholder="e.g. Investor / HELOC" style={MI} value={src.name} onChange={(e) => onChange({ ...src, name: e.target.value })} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Amount ($)</div>
          <input type="number" placeholder="e.g. 200000" style={MI} value={src.amount || ""} onChange={(e) => onChange({ ...src, amount: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 8 }}>
        <input type="checkbox" checked={src.isEquity} onChange={(e) => onChange({ ...src, isEquity: e.target.checked })} />
        This capital represents an equity stake in the deal
      </label>
      {src.isEquity && src.amount > 0 && (
        <div style={{ background: "rgba(232,160,32,0.08)", border: "1px solid rgba(232,160,32,0.25)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--amber)", fontWeight: 500, marginBottom: 4 }}>Equity stake at this capital amount</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--amber)" }}>{eqPct}%</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Based on {fmtM(src.amount)} of {fmtM(offerPrice)} offer price.</div>
        </div>
      )}
      {!src.isEquity && src.amount > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Interest rate (%)</div>
          <input type="number" step={0.1} placeholder="e.g. 8.0" style={{ ...MI, maxWidth: 120 }} value={src.rate || ""} onChange={(e) => onChange({ ...src, rate: parseFloat(e.target.value) || 0 })} />
        </div>
      )}
    </div>
  );
}

// ─── DSCR warning ────────────────────────────────────────────────────────────

function DSCRWarn({ level, dscr }: { level: "critical" | "risk" | "borderline"; dscr: number }) {
  const configs = {
    critical: { bg: "rgba(226,75,74,0.1)", border: "rgba(226,75,74,0.5)", icon: "🚨", title: `DSCR ${dscr.toFixed(2)}x — Below SBA minimum`, color: "var(--danger)", msg: `Most lenders require a minimum 1.25x DSCR. At ${dscr.toFixed(2)}x, this deal will likely be declined. To improve: reduce the offer price, negotiate a seller note at a lower rate, increase the SBA term, or bring more cash to close.` },
    risk: { bg: "rgba(226,75,74,0.07)", border: "rgba(226,75,74,0.35)", icon: "⛔", title: `DSCR ${dscr.toFixed(2)}x — Lender Risk Zone`, color: "var(--danger)", msg: `SBA requires 1.25x minimum — you are above the floor but many lenders want 1.3x+. At ${dscr.toFixed(2)}x, expect scrutiny and potential denial from conservative lenders.` },
    borderline: { bg: "rgba(232,160,32,0.08)", border: "rgba(232,160,32,0.4)", icon: "⚠️", title: `DSCR ${dscr.toFixed(2)}x — Borderline`, color: "var(--amber)", msg: `Meets SBA minimum (1.25x) but below the 1.5x most lenders prefer. Banks like Live Oak prefer 1.5x+ — consider adjusting your stack to get there.` },
  };
  const c = configs[level];
  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <span style={{ fontSize: 16 }}>{c.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{c.title}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{c.msg}</div>
    </div>
  );
}

// ─── Reusable atoms ───────────────────────────────────────────────────────────

function SecTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: "var(--warm)" }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, color: "var(--muted)" }}>{label}</label>
      <input type="number" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ background: "var(--navy2)", border: "1px solid rgba(0,201,167,0.18)", borderRadius: 8, color: "var(--warm)", padding: "9px 12px", fontSize: 14, width: "100%", outline: "none" }} />
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, background: on ? "var(--teal)" : "var(--navy3)", border: `1px solid ${on ? "var(--teal)" : "rgba(0,201,167,0.18)"}`, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, display: "inline-block" }}>
      <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: on ? "#0A1628" : "var(--muted)", transition: "left 0.2s", pointerEvents: "none" }} />
    </div>
  );
}

function QuickRateItem({ label, desc, value, onChange, isRisk }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; isRisk: boolean;
}) {
  const opts = isRisk
    ? [{ l: "None", v: 0 }, { l: "Low", v: 1.5 }, { l: "Moderate", v: 3.0 }, { l: "High", v: 4.5 }]
    : [{ l: "Below avg", v: 1.5 }, { l: "Average", v: 3.0 }, { l: "Good", v: 3.75 }, { l: "Excellent", v: 5.0 }];
  const riskColors = ["var(--teal)", "var(--teal)", "var(--amber)", "var(--danger)"];
  const scoreColors = ["var(--amber)", "var(--warm)", "var(--teal)", "var(--teal)"];
  const colors = isRisk ? riskColors : scoreColors;
  const closest = opts.reduce((p, c) => Math.abs(c.v - value) < Math.abs(p.v - value) ? c : p);
  return (
    <div style={S}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{value.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{desc}</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {opts.map((o, i) => {
          const sel = closest.v === o.v;
          return (
            <button key={o.l} onClick={() => onChange(o.v)} style={{
              padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              border: `1px solid ${sel ? colors[i] : "rgba(0,201,167,0.15)"}`,
              background: sel ? `${colors[i]}22` : "transparent",
              color: sel ? colors[i] : "var(--muted)",
              fontWeight: sel ? 600 : 400, transition: "all 0.15s",
            }}>{o.l}</button>
          );
        })}
      </div>
    </div>
  );
}

function GuidedItem({ label, desc, value, questions, answers, onAnswer, isRisk }: {
  label: string; desc: string; value: number;
  questions: string[]; answers: (boolean | null)[];
  onAnswer: (i: number, v: boolean) => void; isRisk: boolean;
}) {
  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);
  const scoreColor = isRisk
    ? value <= 1.5 ? "var(--teal)" : value <= 3 ? "var(--amber)" : "var(--danger)"
    : value >= 4 ? "var(--teal)" : value >= 3 ? "var(--warm)" : "var(--amber)";
  return (
    <div style={S}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>{label}</span>
        <span style={{ fontSize: 11, color: allAnswered ? scoreColor : "var(--muted)", fontWeight: allAnswered ? 500 : 400 }}>
          {allAnswered ? value.toFixed(2) : "—"}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{desc}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {questions.map((q, i) => {
          const ans = answers[i] ?? null;
          const yesColor = isRisk ? "var(--amber)" : "var(--teal)";
          const noColor = isRisk ? "var(--teal)" : "var(--muted)";
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", flex: 1, lineHeight: 1.45, paddingTop: 2 }}>{q}</span>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => onAnswer(i, true)} style={{
                  padding: "2px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${ans === true ? yesColor : "rgba(0,201,167,0.15)"}`,
                  background: ans === true ? `${yesColor}22` : "transparent",
                  color: ans === true ? yesColor : "var(--muted)", fontWeight: ans === true ? 600 : 400,
                }}>Yes</button>
                <button onClick={() => onAnswer(i, false)} style={{
                  padding: "2px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${ans === false ? noColor : "rgba(0,201,167,0.15)"}`,
                  background: ans === false ? `${noColor}22` : "transparent",
                  color: ans === false ? noColor : "var(--muted)", fontWeight: ans === false ? 600 : 400,
                }}>No</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniCard({ label, value, color, note }: { label: string; value: string; color: string; note: string }) {
  return (
    <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, color }}>{value}</div>
      {note && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function LiveMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "var(--navy)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,201,167,0.18)" }}>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

function StackItem({ title, value, desc, children }: { title: string; value: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ ...S, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>{title}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--teal)" }}>{value}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>{desc}</div>
      {children}
    </div>
  );
}

function BtnRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>{children}</div>;
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button className="btn-secondary" onClick={onClick}>{children}</button>;
}

function Disc({ children }: { children: React.ReactNode }) {
  return <p style={{ marginTop: 12, fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>{children}</p>;
}
