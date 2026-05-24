"use client";

import { useState, useMemo, useEffect } from "react";
import type { QoeHandoff } from "@/components/qoe/qoe-tool";
import { weightedAverage, benchM, fmt, fmtM, type YearInput } from "@/lib/valuation";

const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const NAVY3 = "#2A4A7A";
const TEAL = "#00C9A7";
const WARM = "#F5F2EC";
const MUTED = "#9AA5B4";
const BORDER = "#1E3A5F";
const AMBER = "#E8A020";
const TEAL_BG = "rgba(0,201,167,0.08)";
const TEAL_BD = "rgba(0,201,167,0.22)";

// ── Deal comps from Hunter's spreadsheet ──────────────────────────────────────
type Comp = { price: number; revenue: number; sde: number; multiple: number; city: string; state: string; year: number; info?: string };

const COMPS_6FIG: Comp[] = [
  { price: 990000, revenue: 1600000, sde: 375000, multiple: 2.64, city: "Denver", state: "CO", year: 2026 },
  { price: 900000, revenue: 1825000, sde: 346000, multiple: 2.60, city: "Kissimmee", state: "FL", year: 2025, info: "HOA + LT" },
  { price: 850000, revenue: 850000, sde: 300000, multiple: 2.83, city: "Austin", state: "TX", year: 2026 },
  { price: 825000, revenue: 600000, sde: 250000, multiple: 3.30, city: "Denver", state: "CO", year: 2026 },
  { price: 665000, revenue: 420000, sde: 276125, multiple: 2.41, city: "Mission Viejo", state: "CA", year: 2024 },
  { price: 620000, revenue: 620000, sde: 230000, multiple: 2.70, city: "San Francisco", state: "CA", year: 2026 },
  { price: 600000, revenue: 900000, sde: 250000, multiple: 2.40, city: "East Lyme", state: "CT", year: 2025 },
  { price: 600000, revenue: 600000, sde: 220000, multiple: 2.73, city: "Kissimmee", state: "FL", year: 2026, info: "STR focus" },
  { price: 525000, revenue: 384000, sde: 180000, multiple: 2.92, city: "Columbia", state: "SC", year: 2023 },
  { price: 520000, revenue: 500000, sde: 155000, multiple: 3.35, city: "Bentonville", state: "AR", year: 2025 },
  { price: 480000, revenue: 544136, sde: 253332, multiple: 1.89, city: "Bloomington", state: "IN", year: 2022 },
  { price: 410000, revenue: 400000, sde: 125000, multiple: 3.28, city: "Tampa", state: "FL", year: 2025 },
  { price: 400000, revenue: 425000, sde: 130000, multiple: 3.08, city: "Flagler", state: "FL", year: 2023, info: "LT + STR + Comm." },
  { price: 400000, revenue: 450000, sde: 157000, multiple: 2.55, city: "San Diego", state: "CA", year: 2023 },
  { price: 385000, revenue: 400000, sde: 161000, multiple: 2.39, city: "Detroit", state: "MI", year: 2026 },
  { price: 350000, revenue: 497700, sde: 120000, multiple: 2.92, city: "Franklin", state: "MA", year: 2022, info: "LT + HOA" },
  { price: 325000, revenue: 500000, sde: 125000, multiple: 2.60, city: "Tampa", state: "FL", year: 2026 },
  { price: 325000, revenue: 300000, sde: 266839, multiple: 1.22, city: "Cleveland", state: "OH", year: 2026 },
];

const COMPS_7FIG: Comp[] = [
  { price: 3500000, revenue: 5000000, sde: 900000, multiple: 3.89, city: "Glenwood", state: "CO", year: 2026, info: "LT + HOA + Comm." },
  { price: 2100000, revenue: 2700000, sde: 650000, multiple: 3.23, city: "Sarasota", state: "FL", year: 2025 },
  { price: 2000000, revenue: 3000000, sde: 600000, multiple: 3.33, city: "Seattle", state: "WA", year: 2026, info: "Commercial" },
  { price: 2000000, revenue: 1758098, sde: 519000, multiple: 3.85, city: "Boston", state: "MA", year: 2025 },
  { price: 1750000, revenue: 2118416, sde: 400000, multiple: 4.38, city: "Sarasota", state: "FL", year: 2025, info: "HOA heavy" },
  { price: 1750000, revenue: 1386000, sde: 506289, multiple: 3.46, city: "Denver", state: "CO", year: 2024 },
  { price: 1600000, revenue: 2200000, sde: 450000, multiple: 3.56, city: "Phoenix", state: "AZ", year: 2023, info: "HOA heavy" },
  { price: 1575000, revenue: 1848224, sde: 516324, multiple: 3.05, city: "Denver", state: "CO", year: 2023 },
  { price: 1550000, revenue: 1700000, sde: 500000, multiple: 3.10, city: "Gilbert", state: "AZ", year: 2026 },
  { price: 1450000, revenue: 1350000, sde: 450000, multiple: 3.22, city: "West Palm Beach", state: "FL", year: 2026 },
  { price: 1400000, revenue: 834718, sde: 457828, multiple: 3.06, city: "Scottsdale", state: "AZ", year: 2022 },
  { price: 1350000, revenue: 1150000, sde: 475000, multiple: 2.84, city: "Fresno", state: "CA", year: 2024 },
  { price: 1250000, revenue: 1300000, sde: 350000, multiple: 3.57, city: "Denver", state: "CO", year: 2026 },
  { price: 1200000, revenue: 1800000, sde: 600000, multiple: 2.00, city: "New York City", state: "NY", year: 2026, info: "Multi-family" },
  { price: 1150000, revenue: 1250000, sde: 500000, multiple: 2.30, city: "Gilbert", state: "AZ", year: 2025 },
  { price: 1125000, revenue: 1175000, sde: 385000, multiple: 2.92, city: "Indianapolis", state: "IN", year: 2026 },
  { price: 1100000, revenue: 1900000, sde: 300000, multiple: 3.67, city: "Columbus", state: "OH", year: 2025, info: "LT + HOA" },
  { price: 1100000, revenue: 1650000, sde: 350000, multiple: 3.14, city: "Hagersville", state: "MD", year: 2026 },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type YearData = { label: string; revenue: string; sde: string };

const EMPTY_YEAR: YearData = { label: "", revenue: "", sde: "" };

type EovInputs = {
  years: YearData[];
  ytdRevenue: string;
  ytdSde: string;
  ytdMonths: string;
  askPrice: string;
  ownerName: string;
  doors: string;
  hoaUnits: string;
  mgmtFee: string;
  // Qualitative 1-5
  qSystems: number;
  qTeam: number;
  qPortfolio: number;
  qGrowth: number;
  qBrand: number;
  // Risk 0-5
  rOwnerDep: number;
  rClientConc: number;
  rPortfolioQuality: number;
  rStaffRetention: number;
  rMarket: number;
  notes: string;
};

const DEFAULT_INPUTS: EovInputs = {
  years: [EMPTY_YEAR, EMPTY_YEAR, EMPTY_YEAR],
  ytdRevenue: "", ytdSde: "", ytdMonths: "6",
  askPrice: "", ownerName: "", doors: "", hoaUnits: "", mgmtFee: "10",
  qSystems: 3, qTeam: 3, qPortfolio: 3, qGrowth: 3, qBrand: 3,
  rOwnerDep: 0, rClientConc: 0, rPortfolioQuality: 0, rStaffRetention: 0, rMarket: 0,
  notes: "",
};

const n = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;

// ── Types ─────────────────────────────────────────────────────────────────────
type AiScore = { score: number; reason: string };
type AiScores = Record<string, AiScore>;

// ── Sub-components ────────────────────────────────────────────────────────────
function SliderRow({
  label, desc, value, onChange, max = 5, colorHigh = TEAL, colorLow = MUTED, aiScore,
}: {
  label: string; desc: string; value: number; onChange: (v: number) => void;
  max?: number; colorHigh?: string; colorLow?: string; aiScore?: AiScore;
}) {
  const col = value >= max * 0.7 ? colorHigh : value >= max * 0.4 ? AMBER : colorLow;
  const aiApplied = aiScore && value === aiScore.score;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: WARM }}>{label}</span>
          <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{desc}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: col, minWidth: 20, textAlign: "right" }}>{value}</span>
      </div>
      <input type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: col }} />
      {aiScore && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <span style={{ fontSize: 11, color: MUTED }}>
            AI suggests: <span style={{ color: aiApplied ? TEAL : AMBER, fontWeight: 600 }}>{aiScore.score}/{max}</span>
            <span style={{ color: MUTED }}> — {aiScore.reason}</span>
          </span>
          {!aiApplied && (
            <button onClick={() => onChange(aiScore.score)}
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${TEAL_BD}`, background: TEAL_BG, color: TEAL, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              Apply
            </button>
          )}
          {aiApplied && <span style={{ fontSize: 10, color: TEAL }}>✓ applied</span>}
        </div>
      )}
    </div>
  );
}

function NumInput({ label, value, onChange, placeholder = "", prefix = "" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: MUTED }}>{prefix}</span>}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: `9px 12px 9px ${prefix ? 22 : 12}px`, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 7, background: NAVY, color: WARM, outline: "none", boxSizing: "border-box" as const }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PMEov({
  businessName,
  questionnaire,
  initialInputs,
  qoeHandoff,
  onSave,
  saving,
}: {
  businessName: string;
  questionnaire: Record<string, string>;
  initialInputs: Partial<EovInputs> | null;
  qoeHandoff?: QoeHandoff | null;
  onSave: (inputs: EovInputs) => void;
  saving: boolean;
}) {
  // Build initial years: prefer qoeHandoff (just approved), then saved initialInputs, then defaults
  const buildInitialYears = (): YearData[] => {
    if (qoeHandoff?.years?.length) {
      return qoeHandoff.years.map((y) => ({ label: y.label, revenue: String(y.revenue), sde: String(y.sde) }));
    }
    if (initialInputs?.years?.some((y) => y.revenue || y.sde)) {
      return initialInputs.years;
    }
    return [EMPTY_YEAR, EMPTY_YEAR, EMPTY_YEAR];
  };

  const [inputs, setInputs] = useState<EovInputs>({
    ...DEFAULT_INPUTS,
    ...(initialInputs ?? {}),
    years: buildInitialYears(),
    doors: initialInputs?.doors ?? questionnaire?.doors ?? "",
    hoaUnits: initialInputs?.hoaUnits ?? questionnaire?.hoaUnits ?? "",
    mgmtFee: initialInputs?.mgmtFee ?? questionnaire?.mgmtFee ?? "10",
    ownerName: initialInputs?.ownerName ?? questionnaire?.ownerNames ?? "",
  });
  const [step, setStep] = useState<"financials" | "quality" | "report">("financials");
  const [aiScores, setAiScores] = useState<AiScores | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // When a fresh qoeHandoff arrives, auto-populate years and jump to quality step
  useEffect(() => {
    if (!qoeHandoff?.years?.length) return;
    setInputs((prev) => ({
      ...prev,
      years: qoeHandoff.years.map((y) => ({ label: y.label, revenue: String(y.revenue), sde: String(y.sde) })),
    }));
    setStep("quality");
  }, [qoeHandoff]);

  const set = (key: keyof EovInputs, val: unknown) =>
    setInputs((p) => ({ ...p, [key]: val }));

  const setYear = (i: number, key: keyof YearData, val: string) =>
    setInputs((p) => {
      const ys = [...p.years];
      ys[i] = { ...ys[i], [key]: val };
      return { ...p, years: ys };
    });

  const fetchAiScores = async () => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const years = inputs.years
        .filter((y) => y.revenue || y.sde)
        .map((y) => ({ label: y.label, revenue: n(y.revenue), sde: n(y.sde) }));
      const resp = await fetch("/api/pm/analyze-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaire, years, businessName }),
      });
      const data = await resp.json() as { scores?: AiScores; error?: string };
      if (data.error) throw new Error(data.error);
      if (data.scores) setAiScores(data.scores);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI analysis failed");
    }
    setLoadingAI(false);
  };

  // ── Compute valuation ──────────────────────────────────────────────────────
  const analysis = useMemo(() => {
    const ys: YearInput[] = inputs.years
      .filter((y) => y.revenue || y.sde)
      .map((y) => ({ revenue: n(y.revenue), sde: n(y.sde) }));
    if (ys.length === 0) return null;

    const hasYtd = !!(inputs.ytdRevenue || inputs.ytdSde);
    const ytd = hasYtd ? { revenue: n(inputs.ytdRevenue), sde: n(inputs.ytdSde) } : undefined;
    const ytdMonths = n(inputs.ytdMonths) || 6;
    const askPrice = n(inputs.askPrice);

    const { avgSDE, avgRev } = weightedAverage({ years: ys, ytd, ytdMonths });
    const bench = benchM(avgSDE);

    // PM-specific qualitative: remap to valuation.ts scores format
    const avgQ = (inputs.qSystems + inputs.qTeam + inputs.qPortfolio + inputs.qGrowth + inputs.qBrand) / 5;
    const qualMod = ((avgQ - 3) / 2) * 1.5;

    const riskPen =
      (inputs.rOwnerDep / 5) * 0.30 +
      (inputs.rClientConc / 5) * 0.25 +
      (inputs.rPortfolioQuality / 5) * 0.18 +
      (inputs.rStaffRetention / 5) * 0.18 +
      (inputs.rMarket / 5) * 0.14;

    const recMult = Math.max(1.0, bench + qualMod - riskPen);
    const fmv = avgSDE * recMult;

    // 5 valuation methods
    const fmvMethod = fmv;
    const pmCompMult = avgSDE < 100000 ? 2.1 : avgSDE < 300000 ? 2.65 : avgSDE < 600000 ? 3.1 : 3.35;
    const sdeMktMethod = avgSDE * pmCompMult;
    const revMult = avgSDE / Math.max(1, avgRev);
    const pmRevMult = revMult < 0.35 ? 0.35 : revMult > 0.55 ? 0.55 : revMult;
    const revenueMethod = avgRev * pmRevMult;
    const conservativeMethod = avgSDE * 2.0;
    const optimisticMethod = avgSDE * (avgSDE < 300000 ? 3.25 : 3.75);

    const methods = [
      { name: "Fair Market Value (Tether Model)", value: fmvMethod, mult: recMult, note: `${bench.toFixed(2)}x bench + qualitative ± risk` },
      { name: "PM Market SDE Multiple", value: sdeMktMethod, mult: pmCompMult, note: `Median multiple from ${avgSDE < 300000 ? "6-figure" : "7-figure"} PM comps` },
      { name: "Gross Revenue Multiple", value: revenueMethod, mult: pmRevMult, note: `${(pmRevMult * 100).toFixed(0)}% of gross revenue` },
      { name: "Conservative Range", value: conservativeMethod, mult: 2.0, note: "2.0× weighted avg SDE" },
      { name: "Optimistic Range", value: optimisticMethod, mult: avgSDE < 300000 ? 3.25 : 3.75, note: `${avgSDE < 300000 ? "3.25" : "3.75"}× weighted avg SDE` },
    ];

    // Recommended range
    const validVals = methods.map((m) => m.value).filter((v) => v > 0);
    const recLow = Math.min(...validVals);
    const recHigh = Math.max(...validVals);
    const recMid = (fmvMethod + sdeMktMethod) / 2;

    // Cash offer (SBA self-funded)
    const r = 0.095;
    const mr = r / 12;
    const m = 120;
    const ppd = ((mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1)) * 0.9 * 12;
    const cashOffer = Math.min(avgSDE / ppd, fmv);

    // Comps tier
    const comps = recMid >= 1000000 ? COMPS_7FIG : COMPS_6FIG;

    const yearData = ys.map((y, i) => ({ label: inputs.years.filter((yr) => yr.revenue || yr.sde)[i]?.label || `Year ${i + 1}`, revenue: y.revenue, sde: y.sde }));

    return { avgSDE, avgRev, bench, qualMod, riskPen, recMult, fmv, methods, recLow, recHigh, recMid, cashOffer, comps, yearData, askPrice };
  }, [inputs]);

  // ── Render input form ──────────────────────────────────────────────────────
  const renderFinancials = () => (
    <div>
      <div style={{ padding: "18px 22px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginBottom: 4 }}>Business Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px 16px" }}>
          <NumInput label="Total Doors" value={inputs.doors} onChange={(v) => set("doors", v)} placeholder="350" />
          <NumInput label="HOA Units" value={inputs.hoaUnits} onChange={(v) => set("hoaUnits", v)} placeholder="640" />
          <NumInput label="Mgmt Fee %" value={inputs.mgmtFee} onChange={(v) => set("mgmtFee", v)} placeholder="10" />
          <NumInput label="Ask Price" value={inputs.askPrice} onChange={(v) => set("askPrice", v)} prefix="$" placeholder="850,000" />
        </div>
      </div>

      <div style={{ padding: "18px 22px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginBottom: 14 }}>Historical Financials — enter oldest year first</div>

        {/* Year headers */}
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr", gap: "8px 12px", marginBottom: 8 }}>
          <div />
          {inputs.years.map((_, i) => (
            <div key={i}>
              <input type="text" value={inputs.years[i].label} onChange={(e) => setYear(i, "label", e.target.value)}
                placeholder={`Year ${i + 1} (e.g. 2022)`}
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: NAVY, color: TEAL, fontWeight: 700, outline: "none", boxSizing: "border-box" as const, textAlign: "center" as const }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr", gap: "8px 12px", marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".04em", paddingTop: 10 }}>Revenue</div>
          {inputs.years.map((y, i) => (
            <input key={i} type="text" value={y.revenue} onChange={(e) => setYear(i, "revenue", e.target.value)}
              placeholder="$0" style={{ padding: "8px 12px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 6, background: NAVY, color: WARM, outline: "none" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr", gap: "8px 12px" }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".04em", paddingTop: 10 }}>SDE / NOI</div>
          {inputs.years.map((y, i) => (
            <input key={i} type="text" value={y.sde} onChange={(e) => setYear(i, "sde", e.target.value)}
              placeholder="$0" style={{ padding: "8px 12px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 6, background: NAVY, color: WARM, outline: "none" }} />
          ))}
        </div>

        {/* Add/remove year */}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {inputs.years.length < 4 && (
            <button onClick={() => setInputs((p) => ({ ...p, years: [...p.years, { ...EMPTY_YEAR }] }))}
              style={{ fontSize: 11, color: TEAL, border: `1px solid rgba(0,201,167,0.3)`, background: TEAL_BG, borderRadius: 5, padding: "4px 12px", cursor: "pointer" }}>
              + Add year
            </button>
          )}
          {inputs.years.length > 1 && (
            <button onClick={() => setInputs((p) => ({ ...p, years: p.years.slice(0, -1) }))}
              style={{ fontSize: 11, color: MUTED, border: `1px solid ${BORDER}`, background: "none", borderRadius: 5, padding: "4px 12px", cursor: "pointer" }}>
              Remove last year
            </button>
          )}
        </div>
      </div>

      {/* YTD */}
      <div style={{ padding: "18px 22px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginBottom: 14 }}>YTD (Current Year) — optional</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 16px" }}>
          <NumInput label="YTD Revenue" value={inputs.ytdRevenue} onChange={(v) => set("ytdRevenue", v)} prefix="$" placeholder="420,000" />
          <NumInput label="YTD SDE / NOI" value={inputs.ytdSde} onChange={(v) => set("ytdSde", v)} prefix="$" placeholder="155,000" />
          <NumInput label="YTD Months" value={inputs.ytdMonths} onChange={(v) => set("ytdMonths", v)} placeholder="6" />
        </div>
      </div>

      <div style={{ padding: "18px 22px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginBottom: 8 }}>Owner Info & Notes</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          <NumInput label="Owner Name" value={inputs.ownerName} onChange={(v) => set("ownerName", v)} placeholder="John Smith" />
          <div />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase" as const, letterSpacing: ".05em", marginBottom: 5 }}>Notes for Report</label>
            <textarea value={inputs.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="Key observations, addbacks, or context for the EOV report…"
              rows={3}
              style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 7, background: NAVY, color: WARM, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" as const }} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuality = () => (
    <div>
      {/* Checkpoint 2: AI recommendation banner */}
      <div style={{ padding: "14px 18px", background: TEAL_BG, border: `1px solid ${TEAL_BD}`, borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: WARM, marginBottom: 2 }}>
            {aiScores ? "AI recommendations loaded" : "Get AI scoring recommendations"}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {aiScores
              ? "Slider suggestions are shown below each factor — apply or override as needed."
              : "Claude will analyze the questionnaire and financials to suggest starting positions for each factor."}
          </div>
          {aiError && <div style={{ fontSize: 12, color: AMBER, marginTop: 4 }}>{aiError}</div>}
        </div>
        <button
          onClick={fetchAiScores}
          disabled={loadingAI}
          style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: loadingAI ? "rgba(0,201,167,0.3)" : TEAL, color: NAVY, cursor: loadingAI ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
          {loadingAI ? "Analyzing…" : aiScores ? "Re-run AI" : "Get AI Recommendations"}
        </button>
      </div>

      {/* Qualitative */}
      <div style={{ padding: "20px 24px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginBottom: 6 }}>Qualitative Scoring</div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>Score 1 (poor) to 5 (excellent). These scores adjust the valuation multiple up or down.</p>
        <SliderRow label="Systems & Software" desc="PM software, automations, SOPs in place" value={inputs.qSystems} onChange={(v) => set("qSystems", v)} aiScore={aiScores?.qSystems} />
        <SliderRow label="Team Quality" desc="PMs, admin, maintenance coordination depth" value={inputs.qTeam} onChange={(v) => set("qTeam", v)} aiScore={aiScores?.qTeam} />
        <SliderRow label="Portfolio Mix & Quality" desc="Recurring revenue mix, HOA/LT stability" value={inputs.qPortfolio} onChange={(v) => set("qPortfolio", v)} aiScore={aiScores?.qPortfolio} />
        <SliderRow label="Growth Trajectory" desc="Revenue trending up, door count growing" value={inputs.qGrowth} onChange={(v) => set("qGrowth", v)} aiScore={aiScores?.qGrowth} />
        <SliderRow label="Reputation & Brand" desc="Reviews, referrals, local market position" value={inputs.qBrand} onChange={(v) => set("qBrand", v)} aiScore={aiScores?.qBrand} />
      </div>

      {/* Risk */}
      <div style={{ padding: "20px 24px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: WARM, marginBottom: 6 }}>Risk Factors</div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>Score 0 (no risk) to 5 (critical). Higher risk scores reduce the valuation multiple.</p>
        <SliderRow label="Owner Dependency" desc="Business can't operate without owner" value={inputs.rOwnerDep} onChange={(v) => set("rOwnerDep", v)} colorHigh="#E24B4A" colorLow={TEAL} max={5} aiScore={aiScores?.rOwnerDep} />
        <SliderRow label="Client Concentration" desc="Top 3 clients drive >30% of revenue" value={inputs.rClientConc} onChange={(v) => set("rClientConc", v)} colorHigh="#E24B4A" colorLow={TEAL} max={5} aiScore={aiScores?.rClientConc} />
        <SliderRow label="Portfolio Quality Risk" desc="High-turnover or problem properties" value={inputs.rPortfolioQuality} onChange={(v) => set("rPortfolioQuality", v)} colorHigh="#E24B4A" colorLow={TEAL} max={5} aiScore={aiScores?.rPortfolioQuality} />
        <SliderRow label="Staff Retention Risk" desc="Key staff likely to leave post-close" value={inputs.rStaffRetention} onChange={(v) => set("rStaffRetention", v)} colorHigh="#E24B4A" colorLow={TEAL} max={5} aiScore={aiScores?.rStaffRetention} />
        <SliderRow label="Market Risk" desc="Competitive pressure, regulatory changes" value={inputs.rMarket} onChange={(v) => set("rMarket", v)} colorHigh="#E24B4A" colorLow={TEAL} max={5} aiScore={aiScores?.rMarket} />
      </div>
    </div>
  );

  // ── Report view ───────────────────────────────────────────────────────────
  const renderReport = () => {
    if (!analysis) {
      return (
        <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>
          <div style={{ fontSize: 15, marginBottom: 8 }}>Enter financial data first</div>
          <button onClick={() => setStep("financials")} style={{ padding: "9px 20px", fontSize: 13, borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: TEAL, cursor: "pointer" }}>
            Go to Financials
          </button>
        </div>
      );
    }

    const { avgSDE, avgRev, bench, qualMod, riskPen, recMult, methods, recLow, recHigh, recMid, cashOffer, comps, yearData, askPrice } = analysis;
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const isSevenFig = recMid >= 1000000;

    const cellStyle: React.CSSProperties = { padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, fontSize: 12 };
    const thStyle: React.CSSProperties = { padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: MUTED, textAlign: "left" as const };

    return (
      <div id="eov-report" style={{ background: NAVY, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        {/* Print controls */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 10, justifyContent: "flex-end", background: NAVY2 }} className="no-print">
          <button onClick={() => { onSave(inputs); }} disabled={saving}
            style={{ padding: "7px 16px", fontSize: 12, fontWeight: 600, borderRadius: 7, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => window.print()}
            style={{ padding: "7px 18px", fontSize: 12, fontWeight: 600, borderRadius: 7, border: "none", background: TEAL, color: NAVY, cursor: "pointer" }}>
            Print / Save PDF ↓
          </button>
        </div>

        {/* Cover */}
        <div style={{ padding: "40px 40px 30px", borderBottom: `2px solid ${TEAL}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: TEAL, marginBottom: 8 }}>Tether · Expert Opinion of Value</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: WARM, lineHeight: 1.2, margin: 0, marginBottom: 6 }}>{businessName}</h1>
              <div style={{ fontSize: 14, color: MUTED }}>Property Management Acquisition Valuation</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: MUTED }}>
              <div style={{ fontWeight: 600, color: WARM, marginBottom: 2 }}>Prepared by Hunter Goodall</div>
              <div>Date: {today}</div>
              <div style={{ marginTop: 8, fontSize: 10, padding: "3px 10px", background: "rgba(232,160,32,0.1)", border: `1px solid rgba(232,160,32,0.3)`, borderRadius: 6, color: AMBER }}>CONFIDENTIAL</div>
            </div>
          </div>

          {/* Key metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Avg Weighted SDE", value: fmt(Math.round(avgSDE)), color: TEAL },
              { label: "Avg Weighted Revenue", value: fmt(Math.round(avgRev)), color: WARM },
              { label: "Recommended Multiple", value: `${recMult.toFixed(2)}×`, color: AMBER },
              { label: "Est. Value Range", value: `${fmtM(recLow)} – ${fmtM(recHigh)}`, color: TEAL },
            ].map((m) => (
              <div key={m.label} style={{ padding: "14px 16px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: WARM, marginBottom: 14 }}>Financial Overview</div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  <th style={thStyle}></th>
                  {yearData.map((y, i) => <th key={i} style={{ ...thStyle, color: TEAL, textAlign: "center" as const }}>{y.label || `Year ${i + 1}`}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: NAVY2 }}>
                  <td style={{ ...cellStyle, fontWeight: 500, color: WARM }}>Gross Revenue</td>
                  {yearData.map((y, i) => <td key={i} style={{ ...cellStyle, textAlign: "right" as const, color: MUTED }}>{fmt(y.revenue)}</td>)}
                </tr>
                <tr style={{ background: NAVY3 + "55" }}>
                  <td style={{ ...cellStyle, fontWeight: 600, color: TEAL }}>SDE / NOI</td>
                  {yearData.map((y, i) => <td key={i} style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 600, color: TEAL }}>{fmt(y.sde)}</td>)}
                </tr>
                <tr style={{ background: NAVY, borderTop: `2px solid ${TEAL}` }}>
                  <td style={{ ...cellStyle, fontWeight: 700, color: WARM }}>Weighted Avg SDE</td>
                  <td colSpan={yearData.length} style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 700, fontSize: 14, color: TEAL }}>{fmt(Math.round(avgSDE))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {inputs.notes && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: TEAL_BG, border: `1px solid ${TEAL_BD}`, borderLeft: `3px solid ${TEAL}`, borderRadius: "0 8px 8px 0", fontSize: 12, color: WARM }}>
              <strong style={{ color: TEAL }}>Notes:</strong> {inputs.notes}
            </div>
          )}
        </div>

        {/* Valuation Methods */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: WARM, marginBottom: 14 }}>Valuation Methods</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
            Multiple adjustment: {bench.toFixed(2)}x benchmark{qualMod >= 0 ? " +" : " "}{qualMod.toFixed(2)} qualitative{riskPen > 0 ? ` − ${riskPen.toFixed(2)} risk` : ""} = <strong style={{ color: TEAL }}>{recMult.toFixed(2)}× recommended</strong>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  <th style={thStyle}>Method</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>Multiple</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>Value</th>
                  <th style={{ ...thStyle, color: MUTED }}>Basis</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? NAVY2 : NAVY3 + "55", borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ ...cellStyle, fontWeight: 500, color: WARM }}>{m.name}</td>
                    <td style={{ ...cellStyle, textAlign: "right" as const, color: AMBER, fontWeight: 600 }}>{m.mult.toFixed(2)}×</td>
                    <td style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 700, color: TEAL }}>{fmt(Math.round(m.value))}</td>
                    <td style={{ ...cellStyle, color: MUTED, fontSize: 11 }}>{m.note}</td>
                  </tr>
                ))}
                <tr style={{ background: NAVY, borderTop: `2px solid ${TEAL}` }}>
                  <td style={{ ...cellStyle, fontWeight: 800, color: WARM, fontSize: 13 }}>Recommended Range</td>
                  <td style={{ ...cellStyle, textAlign: "right" as const }} />
                  <td style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 800, color: TEAL, fontSize: 14 }}>{fmtM(recMid * 0.9)} – {fmtM(recMid * 1.15)}</td>
                  <td style={{ ...cellStyle, color: MUTED, fontSize: 11 }}>Blended FMV + Market Multiple</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Offer Recommendations */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: WARM, marginBottom: 14 }}>Offer Recommendations</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Cash / SBA Offer", desc: "Maximum SBA self-funded price — debt service covered by SDE from day 1", value: cashOffer, color: TEAL, sub: `~${fmt(Math.round(cashOffer * 0.1))} down (10%)` },
              { label: "Fair Market Value", desc: "Recommended offer — all-in FMV based on weighted SDE and multiples", value: recMid, color: AMBER, sub: `${recMult.toFixed(2)}× weighted avg SDE` },
              { label: "Creative / Stretch", desc: "Maximum creative offer with seller note, earnout, or equity rollover", value: recMid * 1.15, color: MUTED, sub: "Seller note or earnout component" },
            ].map((offer) => (
              <div key={offer.label} style={{ padding: "16px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: offer.color, marginBottom: 6 }}>{offer.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: offer.color, marginBottom: 5 }}>{fmtM(Math.round(offer.value))}</div>
                <div style={{ fontSize: 11, color: AMBER, marginBottom: 6 }}>{offer.sub}</div>
                <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{offer.desc}</div>
              </div>
            ))}
          </div>
          {askPrice > 0 && (
            <div style={{ padding: "12px 16px", background: "rgba(232,160,32,0.06)", border: `1px solid rgba(232,160,32,0.2)`, borderRadius: 8, fontSize: 12, color: MUTED }}>
              <strong style={{ color: AMBER }}>Ask Price: {fmt(askPrice)}</strong>
              {" "}— {askPrice <= cashOffer ? "✓ Within SBA self-funded range. Strong position." : askPrice <= recMid * 1.1 ? "Within FMV range. Reasonable gap to close." : `${fmt(Math.round(askPrice - recMid))} above FMV. Negotiate or use creative structure.`}
            </div>
          )}
        </div>

        {/* Comparable Transactions */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: WARM }}>Comparable Transactions</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(232,160,32,0.1)", color: AMBER, border: `1px solid rgba(232,160,32,0.3)` }}>
              {isSevenFig ? "7-FIGURE" : "6-FIGURE"} PM DEALS
            </span>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  <th style={thStyle}>Location</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>Price</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>Revenue</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>SDE</th>
                  <th style={{ ...thStyle, textAlign: "right" as const }}>Multiple</th>
                  <th style={thStyle}>Year</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? NAVY2 : NAVY3 + "55", borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ ...cellStyle, color: WARM }}>{c.city}, {c.state}{c.info ? <span style={{ color: MUTED }}> · {c.info}</span> : null}</td>
                    <td style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 600, color: AMBER }}>{fmtM(c.price)}</td>
                    <td style={{ ...cellStyle, textAlign: "right" as const, color: MUTED }}>{fmtM(c.revenue)}</td>
                    <td style={{ ...cellStyle, textAlign: "right" as const, color: TEAL }}>{fmtM(c.sde)}</td>
                    <td style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 700, color: WARM }}>{c.multiple.toFixed(2)}×</td>
                    <td style={{ ...cellStyle, color: MUTED }}>{c.year}</td>
                  </tr>
                ))}
                <tr style={{ background: NAVY, borderTop: `2px solid ${BORDER}` }}>
                  <td style={{ ...cellStyle, color: MUTED, fontWeight: 600 }}>Median Multiple</td>
                  <td colSpan={3} />
                  <td style={{ ...cellStyle, textAlign: "right" as const, fontWeight: 800, color: TEAL, fontSize: 13 }}>
                    {[...comps].sort((a, b) => a.multiple - b.multiple)[Math.floor(comps.length / 2)]?.multiple.toFixed(2)}×
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
            Source: Proprietary PM acquisition database. Transactions 2022–2026. SDE = Seller&apos;s Discretionary Earnings / Net Operating Income.
          </div>
        </div>

        {/* Acquisition Process */}
        <div style={{ padding: "28px 40px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: WARM, marginBottom: 16 }}>Acquisition Process Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { step: "01", label: "LOI & NDA", desc: "Execute non-disclosure agreement and submit Letter of Intent with offer terms, contingencies, and due diligence timeline." },
              { step: "02", label: "Due Diligence", desc: "Review 3-4 years of financials, rent rolls, management agreements, software data, and conduct team interviews." },
              { step: "03", label: "QoE & Verification", desc: "Normalize financials, verify addbacks, confirm door count and revenue by contract type." },
              { step: "04", label: "Financing & Structure", desc: "SBA 7(a) loan application, seller note negotiation, and deal structure finalization." },
              { step: "05", label: "Contract & Close", desc: "Asset purchase agreement, transition planning, client notifications, software migration." },
              { step: "06", label: "Transition", desc: "30-90 day seller transition, staff introductions, client communications, and system handover." },
            ].map((s) => (
              <div key={s.step} style={{ padding: "14px 16px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, marginBottom: 5 }}>STEP {s.step}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: WARM, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: "12px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 10, color: MUTED, lineHeight: 1.7 }}>
            <strong>Disclaimer:</strong> This Expert Opinion of Value is prepared for informational purposes only and does not constitute a certified appraisal.
            Values are estimates based on available financial data and comparable market transactions. Actual transaction values may differ.
            Prepared by Hunter Goodall using Tether — dealtether.com.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Step nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 4 }}>
        {([["financials", "1. Financials"], ["quality", "2. Quality & Risk"], ["report", "3. EOV Report"]] as const).map(([s, label]) => (
          <button key={s} onClick={() => setStep(s)}
            style={{ flex: 1, padding: "8px 12px", fontSize: 12, fontWeight: step === s ? 700 : 400, borderRadius: 6, border: "none", background: step === s ? TEAL : "none", color: step === s ? NAVY : MUTED, cursor: "pointer", transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {step === "financials" && (
        <>
          {renderFinancials()}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setStep("quality")}
              style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: TEAL, color: NAVY, cursor: "pointer" }}>
              Next: Quality & Risk →
            </button>
          </div>
        </>
      )}

      {step === "quality" && (
        <>
          {renderQuality()}

          {/* Live preview */}
          {analysis && (
            <div style={{ marginTop: 16, padding: "14px 18px", background: TEAL_BG, border: `1px solid ${TEAL_BD}`, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: TEAL, fontWeight: 700, marginBottom: 8 }}>Live Valuation Preview</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
                <div><span style={{ color: MUTED }}>Avg SDE: </span><strong style={{ color: WARM }}>{fmt(Math.round(analysis.avgSDE))}</strong></div>
                <div><span style={{ color: MUTED }}>Rec. Multiple: </span><strong style={{ color: TEAL }}>{analysis.recMult.toFixed(2)}×</strong></div>
                <div><span style={{ color: MUTED }}>FMV: </span><strong style={{ color: TEAL }}>{fmt(Math.round(analysis.fmv))}</strong></div>
                <div><span style={{ color: MUTED }}>Range: </span><strong style={{ color: AMBER }}>{fmtM(analysis.recMid * 0.9)} – {fmtM(analysis.recMid * 1.15)}</strong></div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button onClick={() => setStep("financials")}
              style={{ padding: "10px 20px", fontSize: 13, borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}>
              ← Back
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onSave(inputs); }}
                style={{ padding: "10px 20px", fontSize: 13, borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setStep("report")}
                style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: TEAL, color: NAVY, cursor: "pointer" }}>
                Generate Report →
              </button>
            </div>
          </div>
        </>
      )}

      {step === "report" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
            <button onClick={() => setStep("quality")}
              style={{ padding: "8px 18px", fontSize: 12, borderRadius: 7, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}>
              ← Back to Quality & Risk
            </button>
          </div>
          {renderReport()}
        </>
      )}
    </div>
  );
}
