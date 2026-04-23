/**
 * Napkin Value — core math.
 *
 * Ported from legacy/valuation.html. Pure functions, no DOM, no React —
 * so they're trivially testable.
 */

// --- Formatting helpers -----------------------------------------------------
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(Math.round(n));
  const s = "$" + a.toLocaleString();
  return n < 0 ? "(" + s + ")" : s;
}

export function fmtM(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.abs(n) >= 1_000_000
    ? "$" + (n / 1_000_000).toFixed(2) + "M"
    : fmt(n);
}

export function fmtP(n: number, signed = false): string {
  const s = (Math.abs(n) * 100).toFixed(1) + "%";
  return (signed && n > 0 ? "+" : n < 0 ? "–" : "") + s;
}

// --- Benchmark multiples by SDE band ----------------------------------------
/** Returns the baseline market multiple given an SDE amount. */
export function benchM(sde: number): number {
  if (sde <= 50_000) return 1.125;
  if (sde <= 75_000) return 1.45;
  if (sde <= 100_000) return 2.35;
  if (sde <= 200_000) return 2.75;
  if (sde <= 500_000) return 3.375;
  return 4.0;
}

// --- Mortgage payment helper ------------------------------------------------
/** Monthly P&I payment on a standard amortizing loan. */
export function pmtFn(principal: number, annualRate: number, months: number) {
  if (!principal || principal <= 0) return 0;
  if (annualRate < 0.0001) return principal / months;
  const mr = annualRate / 12;
  return (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
}

export function cagrFn(start: number, end: number, years: number): number {
  if (!start || !end || years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

// --- Scoring factor definitions ---------------------------------------------
export type ScoreFactor = {
  key: string;
  label: string;
  desc: string;
  low: string;
  high: string;
};

export const SCORE_FACTORS: ScoreFactor[] = [
  {
    key: "clientConc",
    label: "Customer concentration",
    desc: "How spread out is revenue across clients?",
    low: "1–2 clients drive most revenue",
    high: "Highly diversified",
  },
  {
    key: "industry",
    label: "Industry multiple",
    desc: "How do comparables in this industry trade?",
    low: "Declining sector",
    high: "High-growth sector",
  },
  {
    key: "market",
    label: "Market conditions",
    desc: "Current buyer demand and deal availability.",
    low: "Flooded market",
    high: "Scarce deals, strong demand",
  },
  {
    key: "team",
    label: "Team & infrastructure",
    desc: "Does the business run without the owner?",
    low: "Owner-dependent",
    high: "Full team, documented SOPs",
  },
  {
    key: "history",
    label: "Track record",
    desc: "Years in business, consistency, reputation.",
    low: "Under 3 years or volatile",
    high: "10+ years, steady growth",
  },
  {
    key: "opportunity",
    label: "Upside opportunity",
    desc: "New revenue, margin expansion, synergies.",
    low: "No clear growth path",
    high: "Clear near-term levers",
  },
];

export type RiskFactor = {
  key: string;
  label: string;
  desc: string;
  pen: number; // max penalty at severity 5
};

export const RISK_FACTORS: RiskFactor[] = [
  { key: "decline", label: "Revenue decline", desc: "Revenue trending downward.", pen: 0.28 },
  { key: "keyman", label: "Key-man syndrome", desc: "Business depends on owner's relationships.", pen: 0.3 },
  { key: "custConc", label: "Customer concentration", desc: "One customer = 25%+ of revenue.", pen: 0.25 },
  { key: "legal", label: "Legal liabilities", desc: "Lawsuits, violations, disputes.", pen: 0.4 },
  { key: "empRet", label: "Employee retention", desc: "Key staff likely to leave post-close.", pen: 0.18 },
  { key: "econ", label: "Economic sensitivity", desc: "Highly exposed to recessions.", pen: 0.14 },
  { key: "reg", label: "Regulatory exposure", desc: "Incoming regulations or compliance.", pen: 0.16 },
  { key: "dis", label: "Competitive disruptors", desc: "Technology or market shifts.", pen: 0.2 },
];

// --- Severity bands ---------------------------------------------------------
export function severity(v: number): { label: string; bg: string; color: string } {
  if (v === 0) return { label: "None", bg: "rgba(0,201,167,0.15)", color: "var(--teal)" };
  if (v <= 1.5) return { label: "Low", bg: "rgba(0,201,167,0.1)", color: "var(--teal)" };
  if (v <= 3) return { label: "Moderate", bg: "rgba(232,160,32,0.12)", color: "var(--amber)" };
  if (v <= 4) return { label: "High", bg: "rgba(226,75,74,0.12)", color: "var(--danger)" };
  return { label: "Critical", bg: "rgba(226,75,74,0.2)", color: "var(--danger)" };
}

// --- Weighted averaging -----------------------------------------------------
export type YearInput = { revenue: number; sde: number };

/**
 * Weighted average SDE + revenue across 3, 4 historical years and optional YTD.
 * Weights match the legacy tool to keep results identical.
 */
export function weightedAverage(opts: {
  years: YearInput[]; // historical years, oldest first (length 3 or 4)
  ytd?: YearInput;
  ytdMonths?: number;
}): { avgSDE: number; avgRev: number; note: string } {
  const use4 = opts.years.length >= 4;
  const useY = !!opts.ytd;
  const ytdMonths = opts.ytdMonths ?? 6;

  const annualizedYtdSde = opts.ytd ? (opts.ytd.sde / ytdMonths) * 12 : 0;
  const annualizedYtdRev = opts.ytd ? (opts.ytd.revenue / ytdMonths) * 12 : 0;

  let avgSDE = 0;
  let avgRev = 0;
  let note = "";

  if (useY && use4) {
    avgSDE =
      opts.years[0].sde * 0.05 +
      opts.years[1].sde * 0.1 +
      opts.years[2].sde * 0.2 +
      opts.years[3].sde * 0.3 +
      annualizedYtdSde * 0.35;
    avgRev =
      opts.years[0].revenue * 0.05 +
      opts.years[1].revenue * 0.1 +
      opts.years[2].revenue * 0.2 +
      opts.years[3].revenue * 0.3 +
      annualizedYtdRev * 0.35;
    note = "5 periods";
  } else if (useY) {
    avgSDE =
      opts.years[0].sde * 0.1 +
      opts.years[1].sde * 0.2 +
      opts.years[2].sde * 0.3 +
      annualizedYtdSde * 0.4;
    avgRev =
      opts.years[0].revenue * 0.1 +
      opts.years[1].revenue * 0.2 +
      opts.years[2].revenue * 0.3 +
      annualizedYtdRev * 0.4;
    note = "YTD + 3 yrs";
  } else if (use4) {
    avgSDE =
      opts.years[0].sde * 0.1 +
      opts.years[1].sde * 0.2 +
      opts.years[2].sde * 0.35 +
      opts.years[3].sde * 0.35;
    avgRev =
      opts.years[0].revenue * 0.1 +
      opts.years[1].revenue * 0.2 +
      opts.years[2].revenue * 0.35 +
      opts.years[3].revenue * 0.35;
    note = "4 full years";
  } else {
    avgSDE =
      opts.years[0].sde * 0.2 +
      opts.years[1].sde * 0.35 +
      opts.years[2].sde * 0.45;
    avgRev =
      opts.years[0].revenue * 0.2 +
      opts.years[1].revenue * 0.35 +
      opts.years[2].revenue * 0.45;
    note = "3 years";
  }

  return { avgSDE, avgRev, note };
}

// --- Offer range ------------------------------------------------------------
export function offerRange(opts: { avgSDE: number; mult: number; askPrice: number }) {
  const { avgSDE, mult, askPrice } = opts;
  const fmv = avgSDE * mult;
  // Payment-per-dollar factor for a 9.5% SBA, 10-year amortization,
  // 90% financed. Used to estimate an all-cash DSCR-ceiling price.
  const r = 0.095;
  const mr = r / 12;
  const m = 120;
  const ppd = (mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1) * 0.9 * 12;
  const cashOffer = Math.min(avgSDE / ppd, fmv);
  const creativeOffer = Math.max(
    fmv * 1.1,
    askPrice > 0 ? Math.min(askPrice, fmv * 1.25) : fmv * 1.1
  );
  return { fmv, cashOffer, creativeOffer };
}

// --- Full analysis (Step 3 → results) ---------------------------------------
export type AnalysisInput = {
  years: YearInput[]; // oldest first, 3 or 4
  ytd?: YearInput;
  ytdMonths?: number;
  askPrice: number;
  cfGoal: number;
  scores: Record<string, number>; // 1..5, keyed by SCORE_FACTORS.key
  risks: Record<string, number>;  // 0..5, keyed by RISK_FACTORS.key
};

export type Analysis = {
  avgSDE: number;
  avgRev: number;
  dataNote: string;
  bench: number;
  qualitativeMod: number;
  riskPenalty: number;
  recMult: number;
  yr1Rev: number;
  yr1SDE: number;
  maxSBAPrice: number;
  fairValue: number;
  cashOffer: number;
  creativeOffer: number;
  flaggedRisks: Array<RiskFactor & { score: number; severity: ReturnType<typeof severity> }>;
  // Historical series for the trend chart, excluding years without data.
  histLabels: string[];
  histRevenues: number[];
  histSdes: number[];
};

export function runAnalysis(input: AnalysisInput): Analysis {
  const { avgSDE, avgRev, note } = weightedAverage({
    years: input.years,
    ytd: input.ytd,
    ytdMonths: input.ytdMonths,
  });

  const bench = benchM(avgSDE);
  const avgScore =
    SCORE_FACTORS.reduce((acc, f) => acc + (input.scores[f.key] ?? 3), 0) /
    SCORE_FACTORS.length;
  const qualitativeMod = ((avgScore - 3) / 2) * 1.5;
  const riskPenalty = RISK_FACTORS.reduce(
    (acc, f) => acc + ((input.risks[f.key] ?? 0) / 5) * f.pen,
    0
  );
  const recMult = Math.max(1.0, bench + qualitativeMod - riskPenalty);

  // Max SBA price (1.25x DSCR floor at 9.5%, 10yr)
  const r = 0.095;
  const mr = r / 12;
  const m = 120;
  const ppd = (mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1) * 0.9 * 12;
  const maxSBAPrice = avgSDE / ppd;

  const { fmv, cashOffer, creativeOffer } = offerRange({
    avgSDE,
    mult: recMult,
    askPrice: input.askPrice,
  });

  const flaggedRisks = RISK_FACTORS.filter(
    (f) => (input.risks[f.key] ?? 0) >= 2
  )
    .map((f) => ({
      ...f,
      score: input.risks[f.key] ?? 0,
      severity: severity(input.risks[f.key] ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  // Historical series: skip any years where both rev and sde are 0.
  const histLabels: string[] = [];
  const histRevenues: number[] = [];
  const histSdes: number[] = [];
  input.years.forEach((y, i) => {
    if (y.revenue > 0 || y.sde > 0) {
      histLabels.push(`Yr ${i + 1}`);
      histRevenues.push(y.revenue);
      histSdes.push(y.sde);
    }
  });
  if (input.ytd && (input.ytd.revenue > 0 || input.ytd.sde > 0)) {
    const months = input.ytdMonths ?? 6;
    histLabels.push("YTD (ann.)");
    histRevenues.push((input.ytd.revenue / months) * 12);
    histSdes.push((input.ytd.sde / months) * 12);
  }

  return {
    avgSDE,
    avgRev,
    dataNote: note,
    bench,
    qualitativeMod,
    riskPenalty,
    recMult,
    yr1Rev: avgRev * 1.04,
    yr1SDE: avgSDE * 1.04,
    maxSBAPrice,
    fairValue: fmv,
    cashOffer,
    creativeOffer,
    flaggedRisks,
    histLabels,
    histRevenues,
    histSdes,
  };
}
