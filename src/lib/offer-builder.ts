/**
 * Offer Builder — turns a finished valuation into a negotiation plan.
 * Pure rules, no AI: seller interests and buyer concerns are matched to deal
 * structures, then priced inside the valuation's price window.
 */
import { pmt, type NapkinResult } from "./napkin-model";

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const x2 = (n: number) => n.toFixed(2) + "x";

// --- What each side cares about ---------------------------------------------

export const SELLER_INTERESTS = [
  { key: "topPrice", label: "The highest headline price", probe: "Help me understand how you arrived at your number — what is it based on?" },
  { key: "cashNow", label: "Cash at closing and a clean exit", probe: "How important is it to have everything paid at closing versus over time?" },
  { key: "speed", label: "A fast, certain close", probe: "Is there a date you need this wrapped up by? What is driving that?" },
  { key: "legacy", label: "Legacy and reputation", probe: "What do you want this business to look like five years from now?" },
  { key: "employees", label: "Taking care of employees", probe: "Who on the team are you most concerned about after the sale?" },
  { key: "stayInvolved", label: "Staying involved after the sale", probe: "What role, if any, would you like to have after closing?" },
  { key: "taxes", label: "Spreading out the tax bill", probe: "Has your CPA talked with you about how the timing of payments affects your taxes?" },
  { key: "income", label: "Steady income after the sale", probe: "What does your income need to look like after you step away?" },
] as const;

export const BUYER_CONCERNS = [
  { key: "valuationGap", label: "The asking price is above what the numbers support" },
  { key: "customerConcentration", label: "A few customers drive most of the revenue" },
  { key: "keyPerson", label: "The business depends on the owner" },
  { key: "decliningRevenue", label: "Revenue or earnings are slipping" },
  { key: "unprovenGrowth", label: "The seller is pricing in growth that hasn't happened yet" },
  { key: "limitedCash", label: "I want to keep my cash at closing low" },
  { key: "earlyCashFlow", label: "Loan payments would be tight in the first years" },
] as const;

export type SellerInterest = (typeof SELLER_INTERESTS)[number]["key"];
export type BuyerConcern = (typeof BUYER_CONCERNS)[number]["key"];

export const BUYER_ALTERNATIVES = ["Do nothing for now", "Grow what I already have", "Pursue another deal I'm looking at", "Keep searching for a better fit"];
export const SELLER_ALTERNATIVES = ["Keep running the business", "Sell to another buyer or a roll-up", "Hand it to family or a manager", "Wind the business down"];

// --- Deal structures ---------------------------------------------------------

export type Purpose = "Reduce risk" | "Free up cash" | "Increase alignment";

/** How the performance-based piece of a package is paid. */
export type ContingentKind = "deferred" | "note" | "escrow";

export type OfferContext = {
  cashOffer: number;
  fairMarketValue: number;
  concludedValue: number;
  creativeCeiling: number;
  askingPrice: number;
  /** Projected year-1 SDE. */
  sde: number;
  /** Projected year-1 revenue. */
  revenue: number;
  sbaRate: number;
  sbaMonths: number;
  multiple: number;
};

type Structure = {
  key: string;
  name: string;
  what: string;
  purpose: Purpose;
  interests: SellerInterest[];
  concerns: BuyerConcern[];
  contingent?: ContingentKind;
  example: (c: OfferContext) => string;
};

export const STRUCTURES: Structure[] = [
  {
    key: "cashOffer",
    name: "Discounted cash offer",
    what: "A lower price, all paid at closing. The seller trades price for certainty.",
    purpose: "Reduce risk",
    interests: ["cashNow", "speed"],
    concerns: [],
    example: (c) => `${money(c.cashOffer)} paid in full at closing`,
  },
  {
    key: "sellerNote",
    name: "Seller note",
    what: "The seller finances part of the price and is paid back with interest over time.",
    purpose: "Free up cash",
    interests: ["topPrice", "taxes", "income"],
    concerns: ["limitedCash", "valuationGap"],
    example: (c) => `${money(c.concludedValue * 0.85)} at closing + ${money(c.concludedValue * 0.15)} seller note at 6% over 6 years`,
  },
  {
    key: "forgivableNote",
    name: "Forgivable note",
    what: "A seller note that shrinks or disappears if the business misses agreed targets.",
    purpose: "Reduce risk",
    interests: ["topPrice"],
    concerns: ["decliningRevenue", "customerConcentration"],
    contingent: "note",
    example: (c) => `${money(c.concludedValue)} + a ${money(Math.max(c.creativeCeiling - c.concludedValue, c.concludedValue * 0.1))} note forgiven if revenue falls 25%`,
  },
  {
    key: "revenueShare",
    name: "Revenue share",
    what: "A lower price up front plus a share of revenue (or one revenue stream) for a few years.",
    purpose: "Increase alignment",
    interests: ["income", "stayInvolved"],
    concerns: ["unprovenGrowth", "limitedCash"],
    contingent: "deferred",
    example: (c) => `${money(c.cashOffer)} + 5% of revenue above ${money(c.revenue)} for 3 years`,
  },
  {
    key: "profitShare",
    name: "Profit share",
    what: "A lower price up front plus a share of profits for a set period.",
    purpose: "Increase alignment",
    interests: ["income", "stayInvolved"],
    concerns: ["unprovenGrowth"],
    contingent: "deferred",
    example: (c) => `${money(c.cashOffer)} + 25% of SDE above ${money(c.sde)} for 4 years`,
  },
  {
    key: "balloon",
    name: "Balloon payment",
    what: "Small payments for a period, then the balance paid off in one lump sum.",
    purpose: "Free up cash",
    interests: ["topPrice", "taxes"],
    concerns: ["earlyCashFlow", "limitedCash"],
    example: (c) => `${money(c.concludedValue * 0.2)} seller note amortized over 10 years at 7%, balance due after year 6`,
  },
  {
    key: "interestOnly",
    name: "Interest-only with balloons",
    what: "Interest-only payments early on to free up cash for growth, with lump sums later.",
    purpose: "Free up cash",
    interests: ["topPrice"],
    concerns: ["earlyCashFlow"],
    example: (c) => `${money(c.concludedValue * 0.15)} seller note, 7% interest-only for 12 months, balloons at months 13 and 24`,
  },
  {
    key: "partialBuyout",
    name: "Partial buyout",
    what: "Buy most of the business now and keep the seller on as a minority partner.",
    purpose: "Increase alignment",
    interests: ["stayInvolved", "legacy"],
    concerns: ["keyPerson"],
    example: (c) => `Buy 80% for ${money(c.concludedValue * 0.8)}; the seller keeps 20%`,
  },
  {
    key: "cashPlusSalary",
    name: "Cash plus salary",
    what: "Part of the value is paid as a salary or consulting contract while the seller helps with the transition.",
    purpose: "Reduce risk",
    interests: ["stayInvolved", "income", "employees"],
    concerns: ["keyPerson"],
    example: (c) => `${money(c.cashOffer)} + a 2-year transition contract at ${money(Math.max(c.concludedValue - c.cashOffer, 0) / 2)} per year`,
  },
  {
    key: "earnout",
    name: "Earnout",
    what: "Part of the price is paid only if the business hits agreed performance targets.",
    purpose: "Reduce risk",
    interests: ["topPrice"],
    concerns: ["unprovenGrowth", "valuationGap", "keyPerson"],
    contingent: "deferred",
    example: (c) => `${money(c.concludedValue)} + up to ${money(Math.max(c.creativeCeiling - c.concludedValue, c.concludedValue * 0.1))} for hitting revenue and margin targets`,
  },
  {
    key: "clawback",
    name: "Clawback",
    what: "Part of the price sits in escrow and comes back to you if performance drops.",
    purpose: "Reduce risk",
    interests: ["cashNow"],
    concerns: ["customerConcentration", "decliningRevenue"],
    contingent: "escrow",
    example: (c) => `${money(c.concludedValue * 0.1)} held in escrow for 12 months, reduced by any lost contracts`,
  },
  {
    key: "paidAsCollected",
    name: "Paid as collected",
    what: "Part of the price is paid as the contract revenue actually comes in.",
    purpose: "Reduce risk",
    interests: ["topPrice"],
    concerns: ["customerConcentration", "limitedCash"],
    contingent: "deferred",
    example: (c) => `${money(c.cashOffer)} + 20% of contract revenue as collected for 3 years`,
  },
  {
    key: "seriesOfBuyouts",
    name: "Series of buyouts",
    what: "Buy a portion now and the rest later, often at a higher multiple if things go well.",
    purpose: "Increase alignment",
    interests: ["stayInvolved", "legacy", "taxes"],
    concerns: ["keyPerson"],
    example: (c) => `70% now for ${money(c.concludedValue * 0.7)} (${x2(c.multiple)}), the remaining 30% in 2–3 years at ${x2(c.multiple + 0.5)}`,
  },
];

export type StructureMatch = {
  key: string;
  name: string;
  what: string;
  purpose: Purpose;
  contingent?: ContingentKind;
  example: string;
  score: number;
  /** Plain-language reasons this structure fits. */
  why: string[];
};

const label = <T extends { key: string; label: string }>(list: readonly T[], key: string) =>
  list.find((i) => i.key === key)?.label ?? key;

/** Rank every structure by how many ticked interests and concerns it addresses. */
export function matchStructures(
  interests: SellerInterest[],
  concerns: BuyerConcern[],
  ctx: OfferContext
): StructureMatch[] {
  return STRUCTURES.map((s, order) => {
    const hitInterests = s.interests.filter((i) => interests.includes(i));
    const hitConcerns = s.concerns.filter((c) => concerns.includes(c));
    return {
      key: s.key,
      name: s.name,
      what: s.what,
      purpose: s.purpose,
      contingent: s.contingent,
      example: s.example(ctx),
      score: hitInterests.length + hitConcerns.length,
      why: [
        ...hitInterests.map((i) => `Seller wants: ${label(SELLER_INTERESTS, i).toLowerCase()}`),
        ...hitConcerns.map((c) => `Protects you: ${label(BUYER_CONCERNS, c).toLowerCase()}`),
      ],
      order,
    };
  })
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((m): StructureMatch => ({
      key: m.key,
      name: m.name,
      what: m.what,
      purpose: m.purpose,
      contingent: m.contingent,
      example: m.example,
      score: m.score,
      why: m.why,
    }));
}

// --- Packaged offers ---------------------------------------------------------

export type OfferPackage = {
  key: "cash" | "balanced" | "creative";
  name: string;
  pitch: string;
  /** Total the seller could receive, including anything performance-based. */
  headlinePrice: number;
  /** What the seller receives on closing day. */
  sellerCashAtClose: number;
  sellerNote: number;
  contingent: number;
  contingentLabel: string | null;
  /** Your own cash in (the down payment). */
  buyerCash: number;
  sbaLoan: number;
  annualDebtService: number;
  dscr: number;
  /** Year-1 cash left after loan payments, before tax. */
  cashAfterDebt: number;
  terms: string[];
};

const DOWN_PCT = 0.1;
const NOTE_RATE = 0.06;
const NOTE_MONTHS = 72;

function finance(
  ctx: OfferContext,
  parts: { price: number; sellerNote: number; contingent: number; kind: ContingentKind | null }
) {
  const { price, sellerNote, contingent, kind } = parts;
  const buyerCash = price * DOWN_PCT;
  const outsideBank = sellerNote + (kind === "escrow" ? 0 : contingent);
  const sbaLoan = Math.max(0, price - buyerCash - outsideBank);
  const notePrincipal = sellerNote + (kind === "note" ? contingent : 0);
  const annualDebtService =
    12 * ((sbaLoan > 0 ? pmt(ctx.sbaRate / 12, ctx.sbaMonths, sbaLoan) : 0) +
      (notePrincipal > 0 ? pmt(NOTE_RATE / 12, NOTE_MONTHS, notePrincipal) : 0));
  return {
    buyerCash,
    sbaLoan,
    annualDebtService,
    dscr: annualDebtService > 0 ? ctx.sde / annualDebtService : 0,
    cashAfterDebt: ctx.sde - annualDebtService,
    sellerCashAtClose: price - sellerNote - contingent,
  };
}

/** Three offers across the price window: clean cash, shared financing, performance-based. */
export function buildPackages(ctx: OfferContext, matches: StructureMatch[]): OfferPackage[] {
  const contingentPick = matches.find((m) => m.contingent && m.score > 0) ?? matches.find((m) => m.key === "earnout")!;
  const upside = Math.max(0, ctx.creativeCeiling - ctx.concludedValue);
  const balancedNote = ctx.concludedValue * 0.15;
  const creativeNote = ctx.concludedValue * 0.1;

  const cash = finance(ctx, { price: ctx.cashOffer, sellerNote: 0, contingent: 0, kind: null });
  const balanced = finance(ctx, { price: ctx.concludedValue, sellerNote: balancedNote, contingent: 0, kind: null });
  const creative = finance(ctx, {
    price: ctx.creativeCeiling,
    sellerNote: creativeNote,
    contingent: upside,
    kind: contingentPick.contingent ?? "deferred",
  });

  return [
    {
      key: "cash",
      name: "Clean cash",
      pitch: "Lowest price, fastest close, nothing left open after closing.",
      headlinePrice: ctx.cashOffer,
      sellerNote: 0,
      contingent: 0,
      contingentLabel: null,
      ...cash,
      terms: [`${money(ctx.cashOffer)} paid in full at closing`, "No seller financing, no earnout", "Short transition period"],
    },
    {
      key: "balanced",
      name: "Shared financing",
      pitch: "A fair-value price, with the seller carrying a small note.",
      headlinePrice: ctx.concludedValue,
      sellerNote: balancedNote,
      contingent: 0,
      contingentLabel: null,
      ...balanced,
      terms: [
        `${money(ctx.concludedValue - balancedNote)} at closing`,
        `${money(balancedNote)} seller note at 6% over 6 years`,
        "Seller stays on for a defined transition",
      ],
    },
    {
      key: "creative",
      name: "Performance-based",
      pitch: "The highest price, with the top end earned by results.",
      headlinePrice: ctx.creativeCeiling,
      sellerNote: creativeNote,
      contingent: upside,
      contingentLabel: upside > 0 ? contingentPick.name : null,
      ...creative,
      terms: [
        `${money(ctx.creativeCeiling - creativeNote - upside)} at closing`,
        `${money(creativeNote)} seller note at 6% over 6 years`,
        upside > 0
          ? `${money(upside)} tied to performance (${contingentPick.name.toLowerCase()})`
          : "No room above concluded value — the ceiling is already the concluded value",
      ],
    },
  ];
}

// --- Criteria, questions and the plan ---------------------------------------

export function contextFromValuation(r: NapkinResult, askingPrice: number, sbaRate: number, sbaMonths: number): OfferContext {
  return {
    cashOffer: r.priceWindow.cashOffer,
    fairMarketValue: r.fairMarketValue,
    concludedValue: r.concludedValue,
    creativeCeiling: r.priceWindow.creativeCeiling,
    askingPrice,
    sde: r.cashFlow[0].sde,
    revenue: r.cashFlow[0].revenue,
    sbaRate,
    sbaMonths,
    multiple: r.multiple,
  };
}

/** Concerns the valuation itself points to, pre-ticked for the buyer. */
export function suggestedConcerns(
  r: NapkinResult,
  askingPrice: number,
  scores: { clientConcentration: number; team: number }
): BuyerConcern[] {
  const out: BuyerConcern[] = [];
  if (askingPrice > r.concludedValue) out.push("valuationGap");
  if (scores.clientConcentration <= 2.5) out.push("customerConcentration");
  if (scores.team <= 2.5) out.push("keyPerson");
  if (r.regime === "Declining") out.push("decliningRevenue");
  const askRow = r.ceilings.find((c) => c.label === "Asking price");
  if (askingPrice > 0 && askRow && askRow.dscr < r.settings.yourMinDscr) out.push("earlyCashFlow");
  return out;
}

/** Outside standards of fairness, drawn from the valuation. */
export function buildCriteria(r: NapkinResult, askingPrice: number): string[] {
  const out = [
    `Businesses earning about ${money(r.weightedSde)} a year typically sell for ${x2(r.tier.low)} to ${x2(r.tier.high)} earnings.`,
  ];
  if (r.comps.p25 != null && r.comps.p75 != null && r.comps.median != null)
    out.push(`${r.comps.used} comparable sales closed between ${x2(r.comps.p25)} and ${x2(r.comps.p75)}, with a median of ${x2(r.comps.median)}.`);
  out.push(
    `Earnings are weighted toward the most recent years and come to ${money(r.weightedSde)}; the trend is ${r.regime.toLowerCase()}.`,
    `Three valuation methods (two earnings multiples and a cash-flow model) land between ${money(Math.min(...r.methods.map((m) => m.value)))} and ${money(Math.max(...r.methods.map((m) => m.value)))}.`,
    `A lender needs earnings to cover loan payments at least ${x2(r.settings.bankMinDscr)}; at ${x2(r.dscrPolicy.targetDscr)} the most that can be financed is ${money(r.sbaMaxFinanceable)}.`
  );
  const askRow = r.ceilings.find((c) => c.label === "Asking price");
  if (askingPrice > 0 && askRow)
    out.push(`At the asking price of ${money(askingPrice)}, earnings would cover loan payments ${x2(askRow.dscr)} — ${askRow.status.toLowerCase()} by lender standards.`);
  return out;
}

export function buildQuestions(interests: SellerInterest[], askingPrice: number): string[] {
  const out = [
    "When this is all over, what does success look like for you?",
    "Putting price aside for a moment, what matters most to you in this sale?",
    "If we can't reach a deal, what would you do with the business?",
  ];
  if (askingPrice > 0) out.push(`Help me understand how you arrived at ${money(askingPrice)}.`);
  for (const i of SELLER_INTERESTS) {
    if (!interests.includes(i.key)) continue;
    if (i.key === "topPrice" && askingPrice > 0) continue;
    out.push(i.probe);
  }
  return out;
}

export function buildMessages(ctx: OfferContext): string[] {
  const out = [
    `"You've built something real here and I want to get this done. Lenders and comparable sales put this closer to ${money(ctx.concludedValue)}. Can I walk you through how I got there?"`,
    `"Hypothetically, if we were at ${money(ctx.concludedValue)}, would you be open to carrying part of it as a note?"`,
  ];
  if (ctx.creativeCeiling > ctx.concludedValue)
    out.push(`"I can see a path to ${money(ctx.creativeCeiling)} if part of it is tied to how the business performs after closing."`);
  out.push(`"The bank will only lend against what the earnings can cover — that's the limit I'm working inside, not a judgment on what you've built."`);
  return out;
}

export const STAGES = [
  { stage: "First call", process: "Agree on a time to talk again", substance: "Nothing yet — listen and learn" },
  { stage: "NDA and financials", process: "Sign the NDA; get three years of returns", substance: "Nothing yet" },
  { stage: "Letter of intent", process: "60 days of exclusivity and a diligence timeline", substance: "A price range and structure, still non-binding" },
  { stage: "Diligence", process: "A document list and weekly check-ins", substance: "Stays open — change terms only with evidence" },
  { stage: "Purchase agreement", process: "Closing date and checklist", substance: "Price, note, earnout, transition and people — all at once" },
] as const;

export function buildPlan(ctx: OfferContext) {
  const gapToAsk = ctx.askingPrice > 0 ? ctx.askingPrice - ctx.creativeCeiling : 0;
  return {
    openingLow: ctx.cashOffer,
    openingHigh: ctx.concludedValue,
    stretch: ctx.creativeCeiling,
    walkAway: ctx.creativeCeiling,
    gapToAsk,
    gapNote:
      ctx.askingPrice <= 0
        ? null
        : gapToAsk > 0
          ? `The asking price is ${money(gapToAsk)} above your walk-away number. Closing that gap would take terms that don't cost you cash — or the seller moving on price.`
          : ctx.askingPrice > ctx.concludedValue
            ? "The asking price is above concluded value but inside your window — reachable with performance-based terms."
            : "The asking price is at or below concluded value — you have room to offer clean terms.",
  };
}
