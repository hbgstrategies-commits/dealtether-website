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

// --- Color helpers (for inline styles) --------------------------------------
export function gC(v: number): string {
  return v > 0.05
    ? "var(--teal)"
    : v > 0
      ? "#5BA3E8"
      : v === 0
        ? "var(--muted)"
        : "var(--danger)";
}

export function dscrColor(v: number): string {
  return v >= 1.5 ? "var(--teal)" : v >= 1.25 ? "var(--amber)" : "var(--danger)";
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
export function pmtFn(principal: number, annualRate: number, months: number): number {
  if (!principal || principal <= 0) return 0;
  if (annualRate < 0.0001) return principal / months;
  const mr = annualRate / 12;
  return (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
}

export function cagrFn(start: number, end: number, years: number): number {
  if (!start || !end || years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

export function yoyFn(arr: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    r.push((arr[i] - arr[i - 1]) / Math.abs(arr[i - 1]));
  }
  return r;
}

// --- WACC -------------------------------------------------------------------
export function calcWACC(
  eq: number,
  sba: number,
  sbaR: number,
  sn: number,
  snR: number,
  tot: number
): number {
  if (tot <= 0) return 0;
  return (eq / tot) * 0.2 + (sba / tot) * (sbaR / 100) + (sn / tot) * (snR / 100);
}

// --- IRR (Newton-Raphson equity IRR) ----------------------------------------
export function calcIRR(opts: {
  sde: number;
  exitMult: number;
  years: number;
  eq: number;
  sbaAmount: number;
  sbaRate: number;
  sbaTerm: number;
  snAmount: number;
  snRate: number;
  snTerm: number;
}): number {
  const { sde, exitMult, years, eq, sbaAmount, sbaRate, sbaTerm, snAmount, snRate, snTerm } = opts;
  if (eq <= 0) return 0;
  const sbaDS = pmtFn(sbaAmount, sbaRate / 100, sbaTerm * 12) * 12;
  const snDS = pmtFn(snAmount, snRate / 100, snTerm * 12) * 12;
  const totDS = sbaDS + snDS;
  const cfs: number[] = [-eq];
  let sbaB = sbaAmount;
  let snB = snAmount;
  for (let y = 1; y <= years; y++) {
    const ySDE = sde * Math.pow(1.04, y);
    const sbaI = sbaB * (sbaRate / 100);
    const sbaP = Math.min(sbaB, sbaDS - sbaI);
    sbaB = Math.max(0, sbaB - sbaP);
    const snI = snB * (snRate / 100);
    const snP = Math.min(snB, snDS - snI);
    snB = Math.max(0, snB - snP);
    let cf = ySDE - totDS;
    if (y === years) cf += ySDE * exitMult - sbaB - snB;
    cfs.push(cf);
  }
  function npv(r: number) {
    return cfs.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
  }
  let rate = 0.15;
  for (let iter = 0; iter < 100; iter++) {
    const n = npv(rate);
    const dn = cfs.reduce((s, cf, i) => s - (i * cf) / Math.pow(1 + rate, i + 1), 0);
    if (Math.abs(dn) < 1e-10) break;
    const nr = rate - n / dn;
    if (Math.abs(nr - rate) < 0.0001) break;
    rate = nr;
  }
  return rate > -0.5 && rate < 5 ? rate : 0;
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
  const r = 0.095;
  const mr = r / 12;
  const m = 120;
  const ppd = ((mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1)) * 0.9 * 12;
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
  risks: Record<string, number>; // 0..5, keyed by RISK_FACTORS.key
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

  const r = 0.095;
  const mr = r / 12;
  const m = 120;
  const ppd = ((mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1)) * 0.9 * 12;
  const maxSBAPrice = avgSDE / ppd;

  const { fmv, cashOffer, creativeOffer } = offerRange({
    avgSDE,
    mult: recMult,
    askPrice: input.askPrice,
  });

  const flaggedRisks = RISK_FACTORS.filter((f) => (input.risks[f.key] ?? 0) >= 2)
    .map((f) => ({
      ...f,
      score: input.risks[f.key] ?? 0,
      severity: severity(input.risks[f.key] ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

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

// --- Deal structure recommendations -----------------------------------------
export type StructureTactic = {
  name: string;
  badge: string;
  cls: "" | "am" | "bl";
  desc: string;
  eg: string;
  why: string;
};
export type StructureGroup = { label: string; tactics: StructureTactic[] };

export function buildSG(opts: {
  fv: number;
  co: number;
  cr: number;
  avgSDE: number;
  flaggedRisks: Array<{ key: string; score: number }>;
  oppScore: number;
  teamScore: number;
  histScore: number;
  marginScore: number;
  askPrice: number;
}): StructureGroup[] {
  const { fv, co, avgSDE, flaggedRisks, oppScore, teamScore, histScore, marginScore, askPrice } =
    opts;
  const groups: StructureGroup[] = [];
  const gap = askPrice > 0 ? Math.max(0, askPrice - fv) : 0;
  const flag = (key: string) => flaggedRisks.find((f) => f.key === key && f.score >= 2);

  const pt: StructureTactic[] = [
    {
      name: "All-SBA cash offer",
      badge: "Recommended floor",
      cls: "",
      desc: "The highest price where SBA debt service alone is fully covered by SDE. Self-funding from day one.",
      eg: `Offer ${fmtM(co)} — 90% SBA, 10% down of ${fmtM(co * 0.1)}`,
      why: "Your anchor offer. The business pays for itself at this price with standard financing.",
    },
  ];
  if (gap > 0)
    pt.push({
      name: "Seller note to bridge the gap",
      badge: "Gap bridge",
      cls: "",
      desc: `A ${fmtM(gap)} gap exists. A seller note at a lower rate reduces blended cost and improves cash flow.`,
      eg: `${fmtM(fv * 0.75)} SBA + ${fmtM(fv * 0.2)} seller note @ 6%`,
      why: "Seller note rates are below SBA rates — blended cost drops, improving DSCR.",
    });
  pt.push({
    name: "Cash plus transition salary",
    badge: "Lower net cost",
    cls: "",
    desc: "Negotiate a transition salary as part of the deal — lowers real acquisition cost.",
    eg: `${fmtM(fv * 0.9)} + $125k/yr salary over 2 years`,
    why: "Effective when the seller values income continuity over a lump sum.",
  });
  groups.push({ label: "Pricing structures", tactics: pt });

  const rt: StructureTactic[] = [];
  if (flag("keyman") || flag("custConc"))
    rt.push({
      name: "Earnout",
      badge: "Performance-linked",
      cls: "am",
      desc: "Tie a portion to post-close performance.",
      eg: `${fmtM(fv * 0.82)} at close + ${fmtM(fv * 0.18)} on Year 1 revenue target`,
      why: "Key-man or concentration risk — earnout shares that risk.",
    });
  if (flag("custConc"))
    rt.push({
      name: "Clawback",
      badge: "Customer guard",
      cls: "am",
      desc: "Hold a portion in escrow, released only if top customers remain.",
      eg: `${fmtM(fv * 0.09)} held 12 months`,
      why: "Concentration above 25% — clawback makes seller share the exposure.",
    });
  if (flag("decline"))
    rt.push({
      name: "Forgivable note",
      badge: "Decline protection",
      cls: "am",
      desc: "Seller note that disappears if revenue falls by a defined threshold.",
      eg: `${fmtM(fv * 0.1)} forgivable if revenue drops 20%+`,
      why: "Revenue declining — converts seller note into downside insurance.",
    });
  if (flag("legal"))
    rt.push({
      name: "Escrow holdback",
      badge: "Legal buffer",
      cls: "am",
      desc: "Hold in escrow for 12–24 months to cover undisclosed liabilities.",
      eg: `${fmtM(fv * 0.1)} in escrow 18 months`,
      why: "Legal exposure present — protects from inheriting undisclosed obligations.",
    });
  if (rt.length) groups.push({ label: "Risk protection structures", tactics: rt });

  const gt: StructureTactic[] = [];
  if (oppScore >= 3.5)
    gt.push({
      name: "Revenue share",
      badge: "Upside capture",
      cls: "bl",
      desc: "Pay less upfront, share revenue growth above a baseline.",
      eg: `${fmtM(fv * 0.8)} upfront + 8% of revenue above ${fmtM(avgSDE / 0.33)} for 3 years`,
      why: "Strong upside opportunity — pay conservatively and reward seller if growth plays out.",
    });
  if (teamScore >= 3.5 && oppScore >= 3)
    gt.push({
      name: "Partial buyout",
      badge: "Staged acquisition",
      cls: "bl",
      desc: "Acquire a controlling stake now, buy the rest after validating the opportunity.",
      eg: `75% now at ${fmtM(fv * 0.75)}, option for 25% at ${fmtM(fv * 0.28)} after 24 months`,
      why: "Strong team and upside — staging reduces transition risk.",
    });
  if (marginScore >= 3.5 || oppScore >= 4)
    gt.push({
      name: "Profit share",
      badge: "Margin expansion",
      cls: "bl",
      desc: "Pay less upfront with seller receiving a profit share above a defined floor.",
      eg: `${fmtM(fv * 0.78)} upfront + 25% of SDE above ${fmtM(avgSDE * 0.28)} for 4 years`,
      why: "Margin expansion opportunity — profit share aligns seller with improvements.",
    });
  if (histScore >= 4 && oppScore >= 3)
    gt.push({
      name: "Series of buyouts",
      badge: "Low-risk entry",
      cls: "bl",
      desc: "Buy a portion now, lock in the right to acquire the rest at a pre-agreed price.",
      eg: `70% at ${fmtM(fv * 0.7)}, 30% in 24 months at ${fmtM(fv * 0.33)}`,
      why: "Proven track record with growth — tranched entry validates before full commitment.",
    });
  if (gt.length) groups.push({ label: "Growth & opportunity structures", tactics: gt });

  return groups;
}
