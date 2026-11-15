import { test, expect } from "@playwright/test";
import { runNapkinModel, tierBand, type NapkinInputs } from "../src/lib/napkin-model";

// Inputs and expected values are the ones saved in "General Napkin Tool 10.0.xlsx".
const workbook: NapkinInputs = {
  today: new Date(2026, 10, 14),
  years: [
    { revenue: 766344, sde: 198192 },
    { revenue: 964977, sde: 267558 },
    { revenue: 978718, sde: 220327 },
  ],
  ytd: { revenue: 1151038, sde: 242683 },
  ytdDate: "2026-12-31",
  ytdPeriod: "auto",
  seasonality: "even",
  askingPrice: 750000,
  state: "TX",
  scores: {
    clientConcentration: 3.5,
    industry: 3.2,
    market: 2.5,
    team: 3,
    history: 4,
    portfolio: 3,
    opportunity: 3.25,
    buyerDemand: 2,
  },
  structure: {
    sba: { amount: 180000, rate: 0.095, months: 120 },
    sellerNote: { amount: 0, rate: 0.06, months: 72 },
    buyerCash: 50000,
    forgivableNote: { amount: 0, rate: 0.06, months: 60 },
    earnout: 0,
  },
  usePmComps: true,
};

const close = (actual: number | null, expected: number) =>
  expect(Math.abs((actual ?? NaN) - expected) / Math.abs(expected)).toBeLessThan(1e-6);

test.describe("Napkin model matches the workbook", () => {
  const r = runNapkinModel(workbook);

  test("forecast and confidence", () => {
    expect(r.mode).toBe("Full-Year Actual");
    expect(r.fullYears).toBe(4);
    close(r.forecast.revenue.cagr, 0.1452192338442797);
    close(r.forecast.sde.cagr, 0.06983732304854806);
    close(r.forecast.revenue.volatility, 0.12456713930369066);
    close(r.forecast.sde.volatility, 0.26339747041902944);
    close(r.forecast.revenue.trajectory, 1115720.3333333433);
    close(r.forecast.sde.conservativeTrend, 177680.47341030397);
    close(r.forecast.revenue.forecast, 1151038);
    close(r.forecast.revenue.confidenceScore, 0.8754328606963093);
    expect(r.confidence).toBe("High");
  });

  test("weights, SDE and projections", () => {
    expect(r.regime).toBe("Growing");
    [0, 0.2, 0.35, 0.45].forEach((w, i) => expect(r.history.weights[i]).toBeCloseTo(w, 10));
    close(r.avgSde, 232190);
    close(r.weightedSde, 239833.4);
    close(r.weightedMargin, 0.2291223190699567);
    [0.08, 0.0675, 0.055, 0.0425, 0.03].forEach((g, i) => expect(r.growth.used[i]).toBeCloseTo(g, 10));
    close(r.cashFlow[4].revenue, 1503304.815724105);
    close(r.cashFlow[4].sde, 316954.36866061157);
  });

  test("multiple and valuation", () => {
    close(r.quality.score, 3.85625);
    close(r.tier.low, 2.566389);
    close(r.tier.high, 3.0995835);
    expect(r.comps.used).toBe(27);
    close(r.comps.p25, 2.2456521739130437);
    close(r.comps.median, 2.6956521739130435);
    close(r.comps.p75, 3.0384615384615383);
    close(r.band.low, 2.4605458473913044);
    close(r.band.high, 3.0794132526923077);
    close(r.multiple, 2.8434700544213003);
    close(r.fairMarketValue, 681959.0909500455);
    close(r.dcf, 744865.5484426143);
    close(r.concludedValue, 699629.5952696517);
    close(r.concludedMultiple, 2.8590500359572246);
  });

  test("price window and DSCR checks", () => {
    close(r.priceWindow.cashDiscount, 0.14485848219644645);
    close(r.priceWindow.cashOffer, 598282.3139991758);
    close(r.priceWindow.creativeCeiling, 738546.1503982553);
    close(r.priceWindow.cashFlowLimit, 1016988.514966115);
    expect(r.priceWindow.bindingLimit).toBe("Market limit");
    expect(r.dscrPolicy.targetDscr).toBe(1.8);
    close(r.sbaMaxFinanceable, 762741.3862245864);
    close(r.ceilings[0].price, 1098347.5961634042);
    close(r.ceilings[3].dscr, 1.8305793269390214);
    close(r.ceilings[4].dscr, 1.96237338226824);
    close(r.ceilings[5].dscr, 2.2947937170781176);
    expect(r.ceilings.map((c) => c.status)).toEqual([
      "Bank-only", "Acceptable", "Comfortable", "Comfortable", "Comfortable", "Comfortable",
    ]);
    close(r.stress[0].dscr, 7.384513638318759);
    close(r.stress[1].dscr, 5.743510607581257);
  });

  test("cash flow, returns and sensitivity", () => {
    close(r.cashFlow[0].interest, 16614.886891298993);
    close(r.cashFlow[0].principal, 11334.99154409079);
    close(r.cashFlow[0].tax, 77695.29135890388);
    close(r.cashFlow[0].annual, 156452.47020570637);
    close(r.cashFlow[4].annual, 192296.43124059134);
    close(r.structure.dscr, 9.37741609881692);
    close(r.structure.requiredReturn, 0.26564782608850035);
    close(r.structure.irr, 1.2788353474436258);
    expect(r.structure.irrVerdict).toBe("Accept");
    close(r.sensitivity.rows[0].values[0], 560203.2722426867);
    close(r.sensitivity.rows[4].values[4], 854492.221296617);
    close(r.breakeven.rows[0].revenue, 198848.11981791587);
    close(r.breakeven.rows[0].cushion, 0.8400412241289748);
    expect(r.tierCheck.bracketsHit).toBe(2);
    close(r.tierCheck.widestLow, 2.423049735641757);
    close(r.tierCheck.widestHigh, 3.1552441);
  });
});

test.describe("Napkin model behaviour", () => {
  test("no YTD entered falls back to a conservative trend", () => {
    const r = runNapkinModel({ ...workbook, ytd: { revenue: null, sde: null } });
    expect(r.mode).toBe("Trend Only");
    expect(r.history.revenue[3]).toBeNull();
    expect(r.history.weights[3]).toBe(0);
    expect(r.history.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(r.forecast.revenue.forecast).toBeLessThanOrEqual(978718);
  });

  test("partial-year YTD blends run-rate with trend", () => {
    const r = runNapkinModel({
      ...workbook,
      ytd: { revenue: 560000, sde: 120000 },
      ytdDate: "2026-06-30",
    });
    expect(r.mode).toBe("YTD + Trend");
    expect(r.pctEarned).toBeCloseTo(0.5, 10);
    expect(r.forecast.revenue.runRate).toBeCloseTo(1120000, 6);
    const f = r.forecast.revenue;
    expect(f.forecast).toBeCloseTo(0.5 * f.runRate + 0.5 * f.trendEstimate, 6);
    // YTD weight = latest full-year weight × 0.75 × 50% earned, then normalized.
    expect(r.history.weights[3] / r.history.weights[2]).toBeCloseTo(0.375, 10);
    expect(f.low).toBeLessThanOrEqual(f.forecast);
    expect(f.high).toBeGreaterThanOrEqual(f.forecast);
  });

  test("seasonality changes how much of the year counts as earned", () => {
    const r = runNapkinModel({
      ...workbook,
      ytd: { revenue: 560000, sde: 120000 },
      ytdDate: "2026-06-30",
      seasonality: "holiday",
    });
    expect(r.pctEarned).toBeCloseTo(0.41, 10);
  });

  test("short history demands a higher DSCR", () => {
    const r = runNapkinModel({
      ...workbook,
      years: [{ revenue: null, sde: null }, workbook.years[1], workbook.years[2]],
      ytd: { revenue: null, sde: null },
    });
    expect(r.fullYears).toBe(2);
    expect(r.dscrPolicy.targetDscr).toBe(2);
    expect(r.warnings.join(" ")).toContain("Only 2 full years");
  });

  test("aggressive mode raises only the cash offer", () => {
    const base = runNapkinModel(workbook);
    const r = runNapkinModel({ ...workbook, aggressive: true });
    expect(r.priceWindow.cashDiscount).toBe(0.1);
    expect(r.priceWindow.cashOffer).toBeCloseTo(base.concludedValue * 0.9, 6);
    expect(r.priceWindow.cashOffer).toBeGreaterThan(base.priceWindow.cashOffer);
    expect(r.priceWindow.standardCashOffer).toBeCloseTo(base.priceWindow.cashOffer, 6);
    expect(r.concludedValue).toBe(base.concludedValue);
    expect(r.priceWindow.creativeCeiling).toBe(base.priceWindow.creativeCeiling);
  });

  test("size tiers interpolate between breakpoints", () => {
    expect(tierBand(40000)).toMatchObject({ bracket: 0, low: 1, high: 1.25 });
    expect(tierBand(350000).low).toBeCloseTo(2.75, 10);
    expect(tierBand(20000000)).toMatchObject({ low: 12, high: 20 });
  });
});
