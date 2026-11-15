/**
 * Napkin valuation model — a port of the "General Napkin Tool 10.0" workbook.
 * Pure functions only. Cell references in comments point at the workbook
 * (FI = Financial inputs, NM = Napkin Model, W = Weighting).
 */
import { PM_COMPS, STATE_TAX } from "./napkin-model-data";

export type Num = number | null;

// --- Reference tables -------------------------------------------------------

export const SEASONALITY_PROFILES = {
  even: { label: "None (even)", hint: "Steady year-round", months: Array(12).fill(1 / 12) as number[] },
  summer: {
    label: "Summer peak",
    hint: "Pools, landscaping, tourism",
    months: [0.05, 0.05, 0.07, 0.08, 0.1, 0.12, 0.13, 0.12, 0.09, 0.08, 0.06, 0.05],
  },
  winter: {
    label: "Winter peak",
    hint: "Heating, snow removal, ski",
    months: [0.13, 0.12, 0.1, 0.07, 0.06, 0.05, 0.05, 0.05, 0.06, 0.08, 0.1, 0.13],
  },
  holiday: {
    label: "Holiday / Q4 peak",
    hint: "Retail, e-commerce, gifts",
    months: [0.06, 0.06, 0.07, 0.07, 0.075, 0.075, 0.075, 0.08, 0.08, 0.09, 0.115, 0.15],
  },
  summerWinter: {
    label: "Summer & winter peak",
    hint: "HVAC, resort towns",
    months: [0.1, 0.105, 0.1, 0.055, 0.05, 0.085, 0.11, 0.1, 0.07, 0.06, 0.05, 0.115],
  },
  spring: {
    label: "Spring peak",
    hint: "Tax prep, lawn & garden, home improvement",
    months: [0.08, 0.1, 0.13, 0.14, 0.11, 0.08, 0.07, 0.07, 0.06, 0.06, 0.05, 0.05],
  },
  custom: { label: "Custom", hint: "Enter the target's own monthly split", months: Array(12).fill(1 / 12) as number[] },
} as const;

export type SeasonalityKey = keyof typeof SEASONALITY_PROFILES;

export const SUBJECTIVE_FACTORS = [
  { key: "clientConcentration", label: "Client concentration", low: "A few clients drive most revenue", high: "Highly diversified" },
  { key: "industry", label: "Industry multiple", low: "Sector trades at low multiples", high: "Sector trades at premium multiples" },
  { key: "market", label: "Market", low: "Weak or shrinking local market", high: "Strong, growing market" },
  { key: "team", label: "Team", low: "Owner-dependent", high: "Runs without the owner" },
  { key: "history", label: "History", low: "Short or uneven track record", high: "Long, steady track record" },
  { key: "portfolio", label: "Portfolio", low: "Narrow or low-quality book", high: "Broad, high-quality book" },
  { key: "opportunity", label: "Opportunity", low: "No clear growth path", high: "Clear near-term upside" },
  { key: "buyerDemand", label: "Buyer demand", low: "Few interested buyers", high: "Many competing buyers" },
] as const;

export type SubjectiveKey = (typeof SUBJECTIVE_FACTORS)[number]["key"];

/** W!A63:C71 — SDE breakpoint → multiple band. */
const SIZE_TIERS: ReadonlyArray<readonly [number, number, number]> = [
  [50_000, 1, 1.25],
  [75_000, 1.1, 1.8],
  [100_000, 2, 2.7],
  [200_000, 2.5, 3],
  [500_000, 3, 3.75],
  [1_000_000, 3.5, 5],
  [2_000_000, 5, 8],
  [5_000_000, 10, 12],
  [10_000_000, 12, 20],
];

/** W!A111:B115 — average revenue → buyer-pool score. */
const REVENUE_SCALE: ReadonlyArray<readonly [number, number]> = [
  [0, -0.25],
  [500_000, 0],
  [1_000_000, 0.15],
  [2_000_000, 0.35],
  [5_000_000, 0.5],
];

/** W!C19:E21 — year weights (latest full year, N-1, N-2) by trend regime. */
const WEIGHT_SCHEMES = {
  Declining: [0.7, 0.2, 0.1],
  Flat: [0.55, 0.3, 0.15],
  Growing: [0.45, 0.35, 0.2],
} as const;

export type Regime = keyof typeof WEIGHT_SCHEMES;
export type Confidence = "Low" | "Medium" | "High";
export type ForecastMode = "Trend Only" | "Full-Year Actual" | "YTD + Trend";

export const DEFAULT_SETTINGS = {
  // FI confidence settings (L41:L47)
  weightTimeElapsed: 0.5,
  weightGrowthStability: 0.25,
  weightMethodAgreement: 0.25,
  volatilityCap: 0.25,
  divergenceCap: 0.25,
  highConfidenceAt: 0.75,
  mediumConfidenceAt: 0.5,
  // FI trend-only settings (L51:L54)
  trendMaxGrowth: 0,
  trendVolatilityHaircut: 1,
  assumedVolatility: 0.1,
  // FI 5-year projection growth (L57:L61)
  longTermGrowth: 0.03,
  startingGrowthCap: 0.08,
  confidenceScaling: { High: 1, Medium: 0.75, Low: 0.5 },
  // NM DSCR policy (R17:R25)
  bankMinDscr: 1.25,
  yourMinDscr: 1.5,
  comfortDscr: 1.8,
  stableVolatility: 0.1,
  sdeForDebtService: 0.8,
  financedPct: 0.9,
  minDscrShortHistory: 2,
  // NM required return (O30:O35)
  riskFreeRate: 0.0513,
  marketRiskPremium: 0.08,
  smallBizRisk: 0.06,
  exitMultiple: 3.8,
  // W thresholds and method weights
  decliningBelow: -0.02,
  growingAbove: 0.02,
  maxYtdRatio: 0.75,
  methodWeights: { avgSde: 0.2, weightedSde: 0.45, dcf: 0.35 },
  scoreAtBandLow: 2,
  scoreAtBandHigh: 5,
  // W comps (B122:B127)
  compsSizeWindow: 0.5,
  compsLookbackYears: 4,
  compsMinForWindow: 8,
  compsMaxWeight: 0.33,
  compsForFullWeight: 20,
  // W price window (B150:B169)
  minCashDiscount: 0.1,
  maxCashDiscount: 0.25,
  creativeMinDscr: 1.35,
};

export type Settings = typeof DEFAULT_SETTINGS;

export type Loan = { amount: number; rate: number; months: number };

export type NapkinInputs = {
  /** Sets the year labels: latest full year = this year − 1. */
  today: Date;
  /** Three full years, oldest first. */
  years: { revenue: Num; sde: Num }[];
  ytd: { revenue: Num; sde: Num };
  /** Date of the last closed month, YYYY-MM-DD. */
  ytdDate: string;
  ytdPeriod: "auto" | "full" | "partial";
  seasonality: SeasonalityKey;
  customSeasonality?: number[];
  askingPrice: number;
  state: string;
  scores: Record<SubjectiveKey, number>;
  growthOverrides?: Num[];
  capex?: number[];
  creativeExpense?: number[];
  structure: {
    sba: Loan;
    sellerNote: Loan;
    buyerCash: number;
    forgivableNote: Loan;
    earnout: number;
  };
  usePmComps: boolean;
  /** Bid harder to win: price the cash offer as if the deal were lowest-risk. */
  aggressive?: boolean;
  settings?: Partial<Settings>;
};

// --- Excel-equivalent helpers -----------------------------------------------

const n = (v: Num | undefined) => v ?? 0;
const isNum = (v: Num | undefined): v is number => typeof v === "number" && Number.isFinite(v);
const finiteOr = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function stdevS(a: number[]): number {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

function linearFit(xs: number[], ys: number[]): { slope: number; intercept: number } | null {
  if (xs.length < 2) return null;
  const mx = mean(xs);
  const my = mean(ys);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx;
  return { slope, intercept: my - slope * mx };
}

/** Payment on an amortizing loan (positive number). */
export function pmt(rate: number, nper: number, pv: number): number {
  if (nper <= 0) return NaN;
  if (rate === 0) return pv / nper;
  return (pv * rate) / (1 - Math.pow(1 + rate, -nper));
}

/** Present value of a level payment stream. */
function pvAnnuity(rate: number, nper: number, payment: number): number {
  if (rate === 0) return payment * nper;
  return (payment * (1 - Math.pow(1 + rate, -nper))) / rate;
}

function npv(rate: number, flows: number[]): number {
  return flows.reduce((s, v, i) => s + v / Math.pow(1 + rate, i + 1), 0);
}

function irr(flows: number[]): number | null {
  const f = (r: number) => flows.reduce((s, v, i) => s + v / Math.pow(1 + r, i), 0);
  let lo = -0.99;
  let hi = 1;
  if (!(f(lo) > 0)) return null;
  while (f(hi) > 0) {
    hi *= 2;
    if (hi > 1e6) return null;
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function percentileInc(values: number[], p: number): number {
  const a = [...values].sort((x, y) => x - y);
  const pos = p * (a.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return a[lo] + (pos - lo) * (a[hi] - a[lo]);
}

function parseDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

/** Average of b/a − 1 across consecutive pairs. */
function yoyPairs(vals: Num[], requireBoth: boolean): number[] {
  const out: number[] = [];
  for (let i = 0; i < vals.length - 1; i++) {
    const a = vals[i];
    const b = vals[i + 1];
    if (!isNum(a) || a === 0) continue;
    if (requireBoth && !isNum(b)) continue;
    out.push(n(b) / a - 1);
  }
  return out;
}

// --- Size tiers (W section 6) -----------------------------------------------

export type TierBand = { bracket: number; fraction: number; low: number; high: number };

export function tierBand(sde: number): TierBand {
  let bracket = 0;
  for (let i = 0; i < SIZE_TIERS.length; i++) if (SIZE_TIERS[i][0] <= sde) bracket = i + 1;
  if (bracket === 0) return { bracket, fraction: 0, low: SIZE_TIERS[0][1], high: SIZE_TIERS[0][2] };
  if (bracket >= SIZE_TIERS.length) {
    const last = SIZE_TIERS[SIZE_TIERS.length - 1];
    return { bracket, fraction: 0, low: last[1], high: last[2] };
  }
  const [bp, lo, hi] = SIZE_TIERS[bracket - 1];
  const [bpNext, loNext, hiNext] = SIZE_TIERS[bracket];
  const fraction = (sde - bp) / (bpNext - bp);
  return { bracket, fraction, low: lo + fraction * (loNext - lo), high: hi + fraction * (hiNext - hi) };
}

function ifs(value: number, steps: [boolean, number][], otherwise: number): number {
  if (!Number.isFinite(value)) return 0;
  for (const [hit, score] of steps) if (hit) return score;
  return otherwise;
}

export function dscrStatus(v: number, s: Settings): "Comfortable" | "Acceptable" | "Bank-only" | "Fails bank" {
  if (v >= s.comfortDscr) return "Comfortable";
  if (v >= s.yourMinDscr) return "Acceptable";
  if (v >= s.bankMinDscr) return "Bank-only";
  return "Fails bank";
}

function loanYears(loan: Loan): { interest: number[]; principal: number[]; payment: number } {
  const interest = [0, 0, 0, 0, 0];
  const principal = [0, 0, 0, 0, 0];
  if (!(loan.amount > 0) || !(loan.months > 0)) return { interest, principal, payment: 0 };
  const r = loan.rate / 12;
  const payment = pmt(r, loan.months, loan.amount);
  let balance = loan.amount;
  for (let m = 1; m <= Math.min(60, loan.months); m++) {
    const i = balance * r;
    const y = Math.floor((m - 1) / 12);
    interest[y] += i;
    principal[y] += payment - i;
    balance -= payment - i;
  }
  return { interest, principal, payment };
}

// --- The model --------------------------------------------------------------

export function runNapkinModel(input: NapkinInputs) {
  const s: Settings = { ...DEFAULT_SETTINGS, ...input.settings };
  const lastYear = input.today.getFullYear() - 1;
  const yearNums = [lastYear - 2, lastYear - 1, lastYear];
  const ytdYear = lastYear + 1;

  const rev3 = [0, 1, 2].map((i) => input.years[i]?.revenue ?? null);
  const sde3 = [0, 1, 2].map((i) => input.years[i]?.sde ?? null);
  const ytdRev = input.ytd.revenue;
  const ytdSde = input.ytd.sde;
  const date = parseDate(input.ytdDate);
  const isDec31 = date.month === 12 && date.day === 31;

  // FI!C13
  const mode: ForecastMode =
    n(ytdRev) === 0 || n(ytdSde) === 0
      ? "Trend Only"
      : input.ytdPeriod === "full" || (input.ytdPeriod === "auto" && isDec31)
        ? "Full-Year Actual"
        : "YTD + Trend";
  const isFull = mode === "Full-Year Actual";
  const isTrend = mode === "Trend Only";

  // FI!C5
  const fullYears = sde3.filter(isNum).length + (isFull && isNum(ytdSde) ? 1 : 0);

  // FI!C18
  const profile =
    input.seasonality === "custom"
      ? (input.customSeasonality ?? SEASONALITY_PROFILES.custom.months)
      : SEASONALITY_PROFILES[input.seasonality].months;
  const profileTotal = profile.reduce((a, b) => a + b, 0);
  const pctEarned = isFull
    ? 1
    : profile.slice(0, date.month - 1).reduce((a, b) => a + b, 0) +
      (profile[date.month - 1] * date.day) / daysInMonth(date.year, date.month);

  const forecastSeries = (vals: Num[], ytdVal: Num) => {
    const [c, d, e] = vals;
    // FI!C22
    const start = n(c) > 0 ? n(c) : n(d);
    const span = (isFull ? 3 : 2) - (n(c) > 0 ? 0 : 1);
    const cagr = finiteOr(Math.pow((isFull ? n(ytdVal) : n(e)) / start, 1 / span) - 1, 0);
    // FI!C23:C24
    const pairs = yoyPairs(isFull ? [c, d, e, ytdVal] : [c, d, e], false);
    const avgYoy = pairs.length ? mean(pairs) : 0;
    const volatility = finiteOr(stdevS(pairs), s.assumedVolatility);
    // FI!C27:C33
    const ytdActual = n(ytdVal);
    const runRate = ytdActual / pctEarned;
    const historicalGrowth = n(e) * (1 + cagr);
    const xs: number[] = [];
    const ys: number[] = [];
    vals.forEach((v, i) => {
      if (isNum(v)) {
        xs.push(yearNums[i]);
        ys.push(v);
      }
    });
    const fit = linearFit(xs, ys);
    const trajectory = fit ? fit.intercept + fit.slope * ytdYear : historicalGrowth;
    const trendEstimate = (historicalGrowth + trajectory) / 2;
    const conservativeGrowth = Math.min(
      ...[s.trendMaxGrowth, n(e) / n(d) - 1, cagr - s.trendVolatilityHaircut * volatility].filter(Number.isFinite)
    );
    const conservativeTrend = n(e) * (1 + conservativeGrowth);
    const ytdWeight = isTrend ? 0 : pctEarned;
    const forecast = isTrend ? conservativeTrend : ytdWeight * runRate + (1 - ytdWeight) * trendEstimate;
    // FI!C39:C48
    const divergence = finiteOr(
      isFull
        ? 0
        : isTrend
          ? Math.abs(historicalGrowth - trajectory) / forecast
          : Math.abs(runRate - trendEstimate) / forecast,
      0
    );
    const rangeWidth = (1 - ytdWeight) * Math.sqrt(volatility ** 2 + divergence ** 2);
    const scoreStability = Math.max(0, 1 - volatility / s.volatilityCap);
    const scoreAgreement = Math.max(0, 1 - divergence / s.divergenceCap);
    const confidenceScore =
      ytdWeight * s.weightTimeElapsed +
      scoreStability * s.weightGrowthStability +
      scoreAgreement * s.weightMethodAgreement;
    const level = Math.max(
      0,
      (confidenceScore >= s.highConfidenceAt ? 1 : 0) +
        (confidenceScore >= s.mediumConfidenceAt ? 1 : 0) -
        (fullYears < 3 ? 1 : 0)
    );
    return {
      cagr,
      avgYoy,
      volatility,
      ytdActual,
      runRate,
      historicalGrowth,
      trajectory,
      trendEstimate,
      conservativeTrend,
      forecast,
      remaining: forecast - ytdActual,
      impliedGrowth: forecast / n(e) - 1,
      divergence,
      rangeWidth,
      low: Math.max(ytdActual, forecast * (1 - rangeWidth)),
      high: forecast * (1 + rangeWidth),
      scoreTime: ytdWeight,
      scoreStability,
      scoreAgreement,
      confidenceScore,
      confidence: (["Low", "Medium", "High"] as const)[level] as Confidence,
    };
  };

  const fRev = forecastSeries(rev3, ytdRev);
  const fSde = forecastSeries(sde3, ytdSde);
  const confidence = fRev.confidence;

  // NM!E8:H10 — the forecast column only exists once both YTD figures are entered.
  const hasForecastCol = isNum(ytdRev) && isNum(ytdSde);
  const R: Num[] = [...rev3, hasForecastCol ? fRev.forecast : null];
  const S: Num[] = [...sde3, hasForecastCol ? fSde.forecast : null];
  const margins: Num[] = R.map((r, i) => (isNum(r) && isNum(S[i]) && r !== 0 ? (S[i] as number) / r : null));
  const numR = R.filter(isNum);
  const numS = S.filter(isNum);
  const numM = margins.filter(isNum);

  // W section 1 — trend regime
  const regimePairs = (vals: Num[]) => yoyPairs(isFull ? vals : vals.slice(0, 3), true);
  const revGrowthFullYears = regimePairs(R).length ? mean(regimePairs(R)) : 0;
  const sdeGrowthFullYears = regimePairs(S).length ? mean(regimePairs(S)) : 0;
  const trendScore = (g: number) => (g < s.decliningBelow ? 1 : g > s.growingAbove ? 3 : 2);
  const revScore = trendScore(revGrowthFullYears);
  const sdeScore = trendScore(sdeGrowthFullYears);
  const appliedScore = Math.abs(revScore - sdeScore) === 2 ? 2 : Math.min(revScore, sdeScore);
  const regime = (["Declining", "Flat", "Growing"] as const)[appliedScore - 1];
  const trendFlag =
    revScore === 3 && sdeScore === 1
      ? "Revenue up / SDE down — check the P&L for reinvestment (headcount, marketing) vs. true margin erosion"
      : revScore === 1 && sdeScore === 3
        ? "Revenue down / SDE up — verify cost cuts are sustainable, not one-time"
        : revScore !== sdeScore
          ? "Revenue and SDE trends diverge — applied the more conservative regime"
          : "Revenue and SDE agree — no divergence";

  // W section 3 — year weights, ordered to match R/S (oldest … forecast)
  const scheme = WEIGHT_SCHEMES[regime];
  const shift = isFull ? 1 : 0;
  const rawLatest = scheme[shift] ?? 0;
  const raw = [
    scheme[2 + shift] ?? 0,
    scheme[1 + shift] ?? 0,
    rawLatest,
    isNum(S[3]) ? (isFull ? scheme[0] : rawLatest * s.maxYtdRatio * (isTrend ? 0 : pctEarned)) : 0,
  ];
  const rawTotal = raw.reduce((a, w, i) => a + (isNum(S[i]) ? w : 0), 0);
  const weights = raw.map((w, i) => (isNum(S[i]) && rawTotal > 0 ? w / rawTotal : 0));

  // NM!E12:G14
  const avgSde = numS.length ? mean(numS) : 0;
  const weightedOf = (vals: Num[]) => {
    const den = vals.reduce((a: number, v, i) => a + (isNum(v) ? weights[i] : 0), 0);
    return den > 0 ? vals.reduce((a: number, v, i) => a + (isNum(v) ? v * weights[i] : 0), 0) / den : 0;
  };
  const weightedSde = weightedOf(S);
  const weightedMargin = weightedOf(margins);
  const avgRevenue = numR.length ? mean(numR) : NaN;
  const avgRevGrowth = (() => {
    const p = yoyPairs(R, true);
    return p.length ? mean(p) : 0;
  })();
  const avgSdeGrowth = (() => {
    const p = yoyPairs(S, true);
    return p.length ? mean(p) : 0;
  })();

  // FI!L63:L73 — projection growth
  const forecastGrowth =
    n(fRev.forecast) > 0 ? finiteOr(fRev.forecast / n(rev3[2]) - 1, fRev.cagr) : fRev.cagr;
  const startingRate = Math.min(fRev.cagr, forecastGrowth, s.startingGrowthCap);
  const scaled = startingRate < 0 ? startingRate : startingRate * s.confidenceScaling[confidence];
  const year1Growth = regime === "Declining" || fullYears < 3 ? Math.min(scaled, s.longTermGrowth) : scaled;
  const year5Growth = year1Growth >= s.longTermGrowth ? s.longTermGrowth : Math.max(year1Growth, 0);
  const formulaGrowth = [0, 1, 2, 3, 4].map((i) => year1Growth + ((year5Growth - year1Growth) * i) / 4);
  const growth = formulaGrowth.map((g, i) => {
    const o = input.growthOverrides?.[i];
    return isNum(o) ? o : g;
  });

  // NM!K8:O11 — 5-year projections
  const baseRevenue = isNum(R[3]) ? R[3] : n(R[2]);
  const projMargin = isNum(margins[3]) ? margins[3] : weightedMargin;
  const projRevenue: number[] = [];
  growth.forEach((g, i) => projRevenue.push((i === 0 ? baseRevenue : projRevenue[i - 1]) * (1 + g)));
  const projSde = projRevenue.map((r) => r * projMargin);

  // NM!C38:H56 — deal structure
  const st = input.structure;
  const loans = [st.sba, st.sellerNote, st.forgivableNote].map(loanYears);
  const purchasePrice =
    st.sba.amount + st.sellerNote.amount + st.buyerCash + st.forgivableNote.amount + st.earnout;
  const capitalStack = purchasePrice - st.earnout;
  const wacc =
    finiteOr((st.sba.amount / purchasePrice) * st.sba.rate, 0) +
    finiteOr((st.sellerNote.amount / capitalStack) * st.sellerNote.rate, 0) +
    finiteOr((st.forgivableNote.amount / capitalStack) * st.forgivableNote.rate, 0);
  const requiredReturn = s.riskFreeRate + s.marketRiskPremium + wacc + s.smallBizRisk;

  // NM!K18:O26 — cash flow
  const taxRate = STATE_TAX.find((t) => t.code === input.state)?.rate ?? 0;
  const capex = [0, 1, 2, 3, 4].map((i) => input.capex?.[i] ?? 0);
  const creative = [0, 1, 2, 3, 4].map((i) => input.creativeExpense?.[i] ?? 0);
  const cashFlow = [0, 1, 2, 3, 4].map((i) => {
    const interest = loans.reduce((a, l) => a + l.interest[i], 0);
    const principal = loans.reduce((a, l) => a + l.principal[i], 0);
    const tax = (projSde[i] - interest - capex[i] - creative[i]) * taxRate;
    const annual = projSde[i] - interest - principal - capex[i] - creative[i] - tax;
    return {
      year: i + 1,
      revenue: projRevenue[i],
      growth: growth[i],
      sde: projSde[i],
      interest,
      principal,
      capex: capex[i],
      creative: creative[i],
      tax,
      annual,
      monthly: annual / 12,
    };
  });
  const annualDebtService = cashFlow[0].interest + cashFlow[0].principal;
  const year1Operating = projSde[0] - capex[0] - creative[0];
  const dealDscr = annualDebtService > 0 ? year1Operating / annualDebtService : null;
  const dealIrr =
    purchasePrice > 0
      ? irr([
          -purchasePrice,
          ...cashFlow.map((c, i) => c.sde - c.capex - c.creative + (i === 4 ? c.sde * s.exitMultiple : 0)),
        ])
      : null;

  // NM!C25:E36 — objective score adjustments
  const revVolatility = finiteOr(stdevS(numR) / mean(numR), 0);
  const revFit = linearFit(
    yearNums.filter((_, i) => isNum(rev3[i])),
    rev3.filter(isNum)
  );
  const revSlope = revFit?.slope ?? 0;
  const recent = R.slice(1).filter(isNum);
  const revRange = recent.length ? Math.max(...recent) - Math.min(...recent) : 0;
  const avgMargin = numM.length ? mean(numM) : 0;
  const annuals = cashFlow.map((c) => c.annual);
  const avgCashFlow = mean(annuals);
  const cashFlowRange = Math.max(...annuals) - Math.min(...annuals);
  const forecastVsAvg = baseRevenue / avgRevenue - 1;
  const scaleRow = [...REVENUE_SCALE].reverse().find(([min]) => avgRevenue >= min);
  const objective = [
    {
      key: "volatility",
      label: "Revenue volatility",
      detail: `${(revVolatility * 100).toFixed(1)}% swing around the average`,
      score:
        fullYears < 3
          ? 0
          : ifs(revVolatility, [[revVolatility <= 0.05, 0.25], [revVolatility <= 0.1, 0.1], [revVolatility <= 0.2, 0]], -0.25),
    },
    {
      key: "trend",
      label: "Revenue trend",
      detail: revSlope > 0 ? "Trending up across full years" : revSlope < 0 ? "Trending down across full years" : "Flat",
      score: revSlope > 0 ? 0.1 : revSlope === 0 ? 0 : -0.1,
    },
    {
      key: "growth",
      label: "Revenue growth rate",
      detail: `${(avgRevGrowth * 100).toFixed(1)}% average per year`,
      score: ifs(avgRevGrowth, [[avgRevGrowth >= 0.8, 0.25], [avgRevGrowth >= 0.05, 0.1], [avgRevGrowth >= 0, 0]], -0.25),
    },
    {
      key: "range",
      label: "3-year revenue range",
      detail: `${((revRange / avgRevenue) * 100 || 0).toFixed(0)}% of average revenue`,
      score: ifs(revRange / avgRevenue, [[revRange / avgRevenue <= 0.1, 0.1], [revRange / avgRevenue <= 0.25, 0]], -0.1),
    },
    {
      key: "scale",
      label: "Revenue scale (buyer pool)",
      detail: "Bigger top line = more buyers and lender appetite",
      score: scaleRow ? scaleRow[1] : 0,
    },
    {
      key: "forecast",
      label: "Revenue forecast",
      detail: `${(forecastVsAvg * 100 || 0).toFixed(1)}% vs. historical average`,
      score: ifs(forecastVsAvg, [[forecastVsAvg >= 0.1, 0.25], [forecastVsAvg >= 0.03, 0.05], [forecastVsAvg > -0.03, 0]], -0.15),
    },
    {
      key: "margin",
      label: "Average SDE margin",
      detail: `${(avgMargin * 100).toFixed(1)}%`,
      score: ifs(avgMargin, [[avgMargin >= 0.22, 0.35], [avgMargin >= 0.18, 0.1], [avgMargin >= 0.15, 0]], -0.25),
    },
    {
      key: "cashFlowRange",
      label: "Cash flow stability",
      detail: "Spread of projected cash flow across 5 years",
      score: ifs(cashFlowRange / avgCashFlow, [[cashFlowRange / avgCashFlow <= 0.15, 0.1], [cashFlowRange / avgCashFlow <= 0.35, 0]], -0.1),
    },
  ];
  const objectiveTotal = objective.reduce((a, o) => a + o.score, 0);
  const subjectiveAvg = mean(SUBJECTIVE_FACTORS.map((f) => input.scores[f.key]));
  const qualityScore = subjectiveAvg + objectiveTotal;
  const bandPosition = clamp01((qualityScore - s.scoreAtBandLow) / (s.scoreAtBandHigh - s.scoreAtBandLow));

  // W section 6 + 9 — size tier band blended with comps
  const tier = tierBand(weightedSde);
  const earliestCompYear = input.today.getFullYear() - s.compsLookbackYears;
  const recentComps = input.usePmComps
    ? PM_COMPS.filter(([price, cf, year]) => price > 0 && cf > 0 && year >= earliestCompYear)
    : [];
  const windowLow = weightedSde * (1 - s.compsSizeWindow);
  const windowHigh = weightedSde * (1 + s.compsSizeWindow);
  const inWindow = recentComps.filter(([, cf]) => cf >= windowLow && cf <= windowHigh);
  const usedSizeWindow = inWindow.length >= s.compsMinForWindow;
  const compsUsed = usedSizeWindow ? inWindow : recentComps;
  const compMultiples = compsUsed.map(([price, cf]) => price / cf);
  const hasComps = compMultiples.length > 0;
  const compP25 = hasComps ? percentileInc(compMultiples, 0.25) : null;
  const compMedian = hasComps ? percentileInc(compMultiples, 0.5) : null;
  const compP75 = hasComps ? percentileInc(compMultiples, 0.75) : null;
  const compsWeight = hasComps ? s.compsMaxWeight * Math.min(1, compMultiples.length / s.compsForFullWeight) : 0;
  const bandLow = (1 - compsWeight) * tier.low + compsWeight * n(compP25);
  const bandHigh = (1 - compsWeight) * tier.high + compsWeight * n(compP75);
  const multiple = bandLow + bandPosition * (bandHigh - bandLow);
  const compsVerdict = !hasComps
    ? "No qualifying comps"
    : multiple < n(compP25)
      ? "Below the comp middle 50% — conservative vs. market"
      : multiple > n(compP75)
        ? "Above the comp middle 50% — confirm what supports a premium"
        : "Within the comp middle 50% — supported by market";

  // NM!H15:H24 + W section 4 — valuation methods
  const fairMarketValue = weightedSde * multiple;
  const valueAvgSde = multiple * avgSde;
  const dcf = npv(requiredReturn, projSde);
  const mw = s.methodWeights;
  const concludedValue =
    (mw.avgSde * valueAvgSde + mw.weightedSde * fairMarketValue + mw.dcf * dcf) /
    (mw.avgSde + mw.weightedSde + mw.dcf);

  // NM!Q16:W25 — DSCR policy and price ceilings
  const loanRate = st.sba.rate / 12;
  const loanMonths = st.sba.months;
  const debtCapacity = weightedSde * s.sdeForDebtService;
  const maxPriceAt = (dscr: number) => pvAnnuity(loanRate, loanMonths, debtCapacity / dscr / 12) / s.financedPct;
  const dscrAt = (price: number, sde = debtCapacity) =>
    finiteOr(sde / (12 * pmt(loanRate, loanMonths, price * s.financedPct)), 0);
  const lowerRisk = confidence === "High" && revVolatility <= s.stableVolatility && regime !== "Declining";
  const baseTarget = lowerRisk ? s.yourMinDscr : s.comfortDscr;
  const targetDscr = fullYears < 3 ? Math.max(s.minDscrShortHistory, baseTarget) : baseTarget;
  const sbaMaxFinanceable = maxPriceAt(targetDscr);

  // W section 10 — price window
  const riskScores = {
    quality: bandPosition,
    confidence: { High: 1, Medium: 0.5, Low: 0 }[confidence],
    volatility: Math.max(0, 1 - revVolatility / (2 * s.stableVolatility)),
    regime: { Growing: 1, Flat: 0.5, Declining: 0 }[regime],
  };
  const compositeRisk = mean(Object.values(riskScores));
  const standardCashDiscount = s.maxCashDiscount - (s.maxCashDiscount - s.minCashDiscount) * compositeRisk;
  const cashDiscount = input.aggressive ? s.minCashDiscount : standardCashDiscount;
  const cashOffer = concludedValue * (1 - cashDiscount);
  const creativeDscr = Math.max(1.35, s.creativeMinDscr, fullYears < 3 ? s.minDscrShortHistory : 0);
  const marketLimit = bandHigh * weightedSde;
  const cashFlowLimit = maxPriceAt(creativeDscr);
  const creativeCeiling = Math.max(concludedValue, Math.min(marketLimit, cashFlowLimit));
  const bindingLimit =
    Math.min(marketLimit, cashFlowLimit) < concludedValue
      ? "Floored at concluded value"
      : marketLimit <= cashFlowLimit
        ? "Market limit"
        : "Cash-flow limit";

  // NM!C17:E23 — stress test
  const stress = [0.1, 0.3].map((drop) => {
    const revenue = baseRevenue * (1 - drop);
    const sde = revenue * weightedMargin;
    const dscr = dscrAt(purchasePrice, sde);
    return { drop, revenue, sde, dscr, status: dscrStatus(dscr, s) };
  });

  const ceilings = [
    { label: "Max price at bank minimum", price: maxPriceAt(s.bankMinDscr), dscr: s.bankMinDscr },
    { label: "Max price at your minimum", price: maxPriceAt(s.yourMinDscr), dscr: s.yourMinDscr },
    { label: "Max price at comfort target", price: maxPriceAt(s.comfortDscr), dscr: s.comfortDscr },
    { label: "Asking price", price: input.askingPrice, dscr: dscrAt(input.askingPrice) },
    { label: "Concluded value", price: concludedValue, dscr: dscrAt(concludedValue) },
    { label: "Cash offer", price: cashOffer, dscr: dscrAt(cashOffer) },
  ].map((c) => ({ ...c, status: dscrStatus(c.dscr, s) }));

  // W section 7 — do independent size measures land in the same tier?
  const full3 = sde3.filter(isNum);
  const proxies = [
    { label: "Weighted average SDE", sde: weightedSde },
    { label: "Simple average SDE", sde: avgSde },
    { label: "Latest full-year SDE", sde: n(sde3[2]) },
    { label: "3-year average SDE", sde: full3.length ? mean(full3) : 0 },
    { label: "Forecast year-1 SDE", sde: projSde[0] },
    { label: "Average revenue × average margin", sde: finiteOr(avgRevenue * avgMargin, 0) },
    { label: "Stress case — 10% revenue drop", sde: stress[0].sde },
    { label: "Stress case — 30% revenue drop", sde: stress[1].sde },
  ].map((p) => ({ ...p, ...tierBand(p.sde) }));
  const bracketsHit = new Set(proxies.map((p) => p.bracket)).size;
  const widestLow = Math.min(...proxies.map((p) => p.low));
  const widestHigh = Math.max(...proxies.map((p) => p.high));
  const tierVerdict =
    bracketsHit === 1
      ? "All 8 size measures fall in the same SDE bracket — the tier is well supported"
      : `Size measures span ${bracketsHit} brackets — the tier is boundary-sensitive; treat ${widestLow.toFixed(2)}x–${widestHigh.toFixed(2)}x as the honest range`;
  const stressTierDrops = proxies[7].bracket < tier.bracket;
  const downsideTierRisk = stressTierDrops
    ? `At a 30% revenue drop the SDE falls into a lower tier — its band tops out at ${proxies[7].high.toFixed(2)}x. The applied multiple is optimistic under stress.`
    : "Even at a 30% revenue drop the SDE stays in the same tier — the applied band is not stress-fragile.";

  // W section 5 — sensitivity of concluded value
  const sensitivityMultiples = [-0.5, -0.25, 0, 0.25, 0.5].map((d) => multiple + d);
  const sensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map((adj) => ({
    adj,
    values: sensitivityMultiples.map(
      (m) =>
        ((1 + adj) * (mw.avgSde * m * avgSde + mw.weightedSde * m * weightedSde + mw.dcf * dcf)) /
        (mw.avgSde + mw.weightedSde + mw.dcf)
    ),
  }));

  // NM!J56:O59 — DSCR breakeven
  const breakeven = [s.yourMinDscr, s.bankMinDscr, 1].map((threshold) => {
    const revenue = finiteOr((threshold * annualDebtService + capex[0] + creative[0]) / projMargin, 0);
    return { threshold, revenue, cushion: projRevenue[0] > 0 ? 1 - revenue / projRevenue[0] : 0 };
  });
  const breakevenVerdict =
    annualDebtService <= 0
      ? "No debt in the structure"
      : breakeven[2].cushion <= 0
        ? "Fails today — below 1.00x breakeven"
        : breakeven[1].cushion <= 0
          ? `Below the bank minimum of ${s.bankMinDscr.toFixed(2)}x`
          : breakeven[0].cushion <= 0
            ? `Below your ${s.yourMinDscr.toFixed(2)}x floor`
            : breakeven[0].cushion < 0.1
              ? `Thin — under 10% cushion to your ${s.yourMinDscr.toFixed(2)}x floor`
              : `Above your ${s.yourMinDscr.toFixed(2)}x floor`;

  const warnings: string[] = [];
  if (fullYears < 3)
    warnings.push(
      `Only ${fullYears} full year${fullYears === 1 ? "" : "s"} of history — forecast confidence lowered one level and a ${s.minDscrShortHistory.toFixed(1)}x minimum DSCR applied`
    );
  if (!isTrend && date.year !== ytdYear) warnings.push(`The YTD date is not in ${ytdYear} — check it`);
  if (mode === "YTD + Trend" && Math.abs(profileTotal - 1) > 0.0005)
    warnings.push(`The seasonality profile totals ${(profileTotal * 100).toFixed(1)}% — it must equal 100%`);
  if (input.ytdPeriod === "partial" && isDec31 && !isTrend)
    warnings.push("The YTD date is Dec 31 — confirm it is really a partial year");
  if (!taxRate) warnings.push("No state selected — income taxes are not being applied to cash flow");

  return {
    labels: [...yearNums.map(String), `${ytdYear}${isFull ? "" : " forecast"}`],
    ytdYear,
    mode,
    fullYears,
    pctEarned,
    forecast: { revenue: fRev, sde: fSde, margin: fSde.forecast / fRev.forecast },
    confidence,
    sdeConfidence: fSde.confidence,
    history: { revenue: R, sde: S, margins, weights },
    avgSde,
    weightedSde,
    weightedMargin,
    avgRevenue: finiteOr(avgRevenue, 0),
    avgRevGrowth,
    avgSdeGrowth,
    askingMultiple: weightedSde > 0 ? input.askingPrice / weightedSde : 0,
    regime,
    trendFlag,
    revGrowthFullYears,
    sdeGrowthFullYears,
    growth: { formula: formulaGrowth, used: growth, year1: year1Growth, year5: year5Growth },
    cashFlow,
    taxRate,
    structure: {
      purchasePrice,
      cashAtClose: st.sba.amount + st.buyerCash,
      annualDebtService,
      payments: { sba: loans[0].payment, sellerNote: loans[1].payment, forgivableNote: loans[2].payment },
      dscr: dealDscr,
      wacc,
      requiredReturn,
      irr: dealIrr,
      irrVerdict: dealIrr == null ? null : dealIrr > requiredReturn ? "Accept" : "Reject",
    },
    quality: { subjectiveAvg, objective, objectiveTotal, score: qualityScore, bandPosition },
    tier,
    comps: {
      enabled: input.usePmComps,
      inWindow: inWindow.length,
      used: compMultiples.length,
      usedSizeWindow,
      p25: compP25,
      median: compMedian,
      p75: compP75,
      weight: compsWeight,
      verdict: compsVerdict,
    },
    band: { low: bandLow, high: bandHigh },
    multiple,
    methods: [
      { label: "Multiple × average SDE", weight: mw.avgSde, value: valueAvgSde },
      { label: "Multiple × weighted SDE", weight: mw.weightedSde, value: fairMarketValue },
      { label: "Discounted cash flow", weight: mw.dcf, value: dcf },
    ],
    fairMarketValue,
    dcf,
    concludedValue,
    concludedMultiple: concludedValue / mean([avgSde, weightedSde, projSde[0]]),
    dscrPolicy: { lowerRisk, targetDscr, revVolatility },
    sbaMaxFinanceable,
    financingTest:
      concludedValue > sbaMaxFinanceable
        ? `Over the ceiling — concluded value exceeds what an SBA buyer can finance at a ${targetDscr.toFixed(1)}x DSCR`
        : "Within financing capacity",
    ceilings,
    priceWindow: {
      cashOffer,
      fairMarketValue,
      concludedValue,
      creativeCeiling,
      valueCreated: creativeCeiling - cashOffer,
      cashDiscount,
      standardCashDiscount,
      standardCashOffer: concludedValue * (1 - standardCashDiscount),
      riskScores,
      compositeRisk,
      marketLimit,
      cashFlowLimit,
      creativeDscr,
      bindingLimit,
      ceilingMultiple: weightedSde > 0 ? creativeCeiling / weightedSde : 0,
    },
    stress,
    proxies,
    tierCheck: { bracketsHit, widestLow, widestHigh, verdict: tierVerdict, downside: downsideTierRisk, stressTierDrops },
    sensitivity: { multiples: sensitivityMultiples, rows: sensitivity },
    breakeven: { rows: breakeven, verdict: breakevenVerdict, sdeAtBreakeven: breakeven[2].revenue * projMargin },
    warnings,
    settings: s,
  };
}

export type NapkinResult = ReturnType<typeof runNapkinModel>;
