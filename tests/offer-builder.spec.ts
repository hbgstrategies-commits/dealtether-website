import { test, expect } from "@playwright/test";
import {
  buildCriteria,
  buildPackages,
  buildPlan,
  buildQuestions,
  matchStructures,
  STRUCTURES,
  type OfferContext,
} from "../src/lib/offer-builder";
import { pmt } from "../src/lib/napkin-model";

const ctx: OfferContext = {
  cashOffer: 600000,
  fairMarketValue: 680000,
  concludedValue: 700000,
  creativeCeiling: 740000,
  askingPrice: 750000,
  sde: 262000,
  revenue: 1243000,
  sbaRate: 0.095,
  sbaMonths: 120,
  multiple: 2.84,
};

test.describe("Offer Builder rules", () => {
  test("covers all thirteen structures from the deal structure table", () => {
    expect(STRUCTURES).toHaveLength(13);
    for (const s of STRUCTURES) expect(s.example(ctx)).toContain("$");
  });

  test("ranks structures by what was ticked and explains why", () => {
    const m = matchStructures(["topPrice"], ["unprovenGrowth", "valuationGap"], ctx);
    expect(m[0].key).toBe("earnout");
    expect(m[0].score).toBe(3);
    expect(m[0].why).toHaveLength(3);
    expect(m.find((s) => s.key === "partialBuyout")!.score).toBe(0);
  });

  test("a seller who wants a clean exit gets the cash offer first", () => {
    expect(matchStructures(["cashNow", "speed"], [], ctx)[0].key).toBe("cashOffer");
  });

  test("builds three packages across the price window", () => {
    const [cash, balanced, creative] = buildPackages(ctx, matchStructures(["topPrice"], ["unprovenGrowth"], ctx));
    expect([cash.headlinePrice, balanced.headlinePrice, creative.headlinePrice]).toEqual([600000, 700000, 740000]);

    // Clean cash: 10% down, 90% SBA, seller paid in full.
    expect(cash.buyerCash).toBe(60000);
    expect(cash.sbaLoan).toBe(540000);
    expect(cash.sellerCashAtClose).toBe(600000);
    expect(cash.annualDebtService).toBeCloseTo(12 * pmt(0.095 / 12, 120, 540000), 6);
    expect(cash.dscr).toBeCloseTo(262000 / cash.annualDebtService, 6);

    // Shared financing: 15% seller note.
    expect(balanced.sellerNote).toBe(105000);
    expect(balanced.sbaLoan).toBe(700000 - 70000 - 105000);
    expect(balanced.sellerCashAtClose).toBe(595000);

    // Performance-based: the amount above concluded value is earned, not financed.
    expect(creative.contingent).toBe(40000);
    expect(creative.contingentLabel).toBe("Earnout");
    expect(creative.sbaLoan).toBe(740000 - 74000 - 70000 - 40000);
    expect(creative.sellerCashAtClose + creative.sellerNote + creative.contingent).toBe(740000);
  });

  test("an escrowed clawback is still financed; a forgivable note carries payments", () => {
    const claw = buildPackages(ctx, matchStructures(["cashNow"], ["customerConcentration"], ctx))[2];
    expect(claw.contingentLabel).toBe("Clawback");
    expect(claw.sbaLoan).toBe(740000 - 74000 - 70000);

    const forg = buildPackages(ctx, matchStructures([], ["decliningRevenue"], ctx))[2];
    expect(forg.contingentLabel).toBe("Forgivable note");
    const earn = buildPackages(ctx, matchStructures(["topPrice"], ["unprovenGrowth"], ctx))[2];
    expect(forg.annualDebtService).toBeGreaterThan(earn.annualDebtService);
  });

  test("no room above concluded value means nothing is tied to performance", () => {
    const creative = buildPackages({ ...ctx, creativeCeiling: 700000 }, matchStructures([], [], ctx))[2];
    expect(creative.contingent).toBe(0);
    expect(creative.contingentLabel).toBeNull();
  });

  test("the plan opens low, stretches with terms, and flags an ask above walk-away", () => {
    const plan = buildPlan(ctx);
    expect(plan).toMatchObject({ openingLow: 600000, openingHigh: 700000, walkAway: 740000, gapToAsk: 10000 });
    expect(plan.gapNote).toContain("$10,000 above your walk-away");
    expect(buildPlan({ ...ctx, askingPrice: 720000 }).gapNote).toContain("inside your window");
    expect(buildPlan({ ...ctx, askingPrice: 0 }).gapNote).toBeNull();
  });

  test("questions follow the seller's interests", () => {
    const q = buildQuestions(["employees"], 750000);
    expect(q[0]).toContain("what does success look like for you");
    expect(q.join(" ")).toContain("$750,000");
    expect(q.join(" ")).toContain("Who on the team");
    expect(buildQuestions([], 0).join(" ")).not.toContain("how you arrived at");
  });
});

test("criteria are drawn from the valuation", async () => {
  const { runNapkinModel } = await import("../src/lib/napkin-model");
  const r = runNapkinModel({
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
    scores: { clientConcentration: 3.5, industry: 3.2, market: 2.5, team: 3, history: 4, portfolio: 3, opportunity: 3.25, buyerDemand: 2 },
    structure: {
      sba: { amount: 180000, rate: 0.095, months: 120 },
      sellerNote: { amount: 0, rate: 0.06, months: 72 },
      buyerCash: 50000,
      forgivableNote: { amount: 0, rate: 0.06, months: 60 },
      earnout: 0,
    },
    usePmComps: true,
  });
  const text = buildCriteria(r, 750000).join(" ");
  expect(text).toContain("2.57x to 3.10x");
  expect(text).toContain("27 comparable sales");
  expect(text).toContain("$762,741");
  expect(text).toContain("asking price of $750,000");
});
