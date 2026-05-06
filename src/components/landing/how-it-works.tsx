import Link from "next/link";

type Bullet = { bold: string; rest: string };

type Stage = {
  num: string;
  beta?: boolean;
  outcome: string;
  tool: string;
  desc: string;
  bullets: Bullet[];
  ctaHref: string;
  ctaLabel: string;
  flip?: boolean;
  mockup: "sourcing" | "qoe" | "valuation" | "pipeline" | "dd";
};

const STAGES: Stage[] = [
  {
    num: "01",
    beta: true,
    outcome: "Find the right business before you analyze it",
    tool: "Sourcing Tool — Acquisition Target Research",
    desc: "Most buyers wait for deals to come to them through brokers. Tether's sourcing tool lets you go find them. Search by industry and radius, get up to 15 real businesses with owner info, contact details, ratings, and acquisition signals — all in one search.",
    bullets: [
      { bold: "Search by industry + radius", rest: " — HVAC, roofing, landscaping, and more" },
      { bold: "Owner info surfaced", rest: " — name, email, phone when publicly available" },
      { bold: "Acquisition signals flagged", rest: " — retiring owner, declining reviews, outdated website" },
      { bold: "Status tracking built in", rest: " — New, Contacted, Responded, In Diligence" },
    ],
    ctaHref: "/sourcing",
    ctaLabel: "Try the sourcing tool",
    mockup: "sourcing",
  },
  {
    num: "02",
    outcome: "Don't get fooled by bad financials",
    tool: "Financial Normalizer · Financial Normalizer — Quality of Earnings",
    desc: "Before you can know what a business is worth, you need to know what it actually earns. The Financial Normalizer uploads the seller's P&Ls and uses AI to map every line item, identify owner add-backs, and show you the real adjusted SDE — the number your lender will use to underwrite your loan.",
    bullets: [
      { bold: "Upload PDF or CSV financials", rest: " — up to 4 years, analyzed instantly" },
      { bold: "AI identifies add-backs", rest: " — owner expenses that won't continue post-close" },
      { bold: "Edit and annotate inline", rest: " — adjust any line item with a reason" },
      { bold: "Export a clean CSV", rest: " — share with your lender, advisor, or CPA" },
    ],
    ctaHref: "/qoe",
    ctaLabel: "Try the Financial Normalizer",
    mockup: "qoe",
  },
  {
    num: "03",
    outcome: "Know exactly what to offer and why",
    tool: "Deal Analyzer · Deal Analyzer — Napkin Valuation Model",
    desc: "Once you know the real earnings, find out what the business is worth and what you should offer. The Deal Analyzer gives you a market-benchmarked multiple, a recommended offer range, and a full financing model — SBA loan, seller note, monthly cash flow, and a 5-year forecast — so you never walk into a negotiation guessing.",
    bullets: [
      { bold: "Market-benchmarked multiple", rest: " — based on actual SDE band comps" },
      { bold: "Risk-adjusted offer range", rest: " — qualitative scoring + risk penalty" },
      { bold: "Live financing stack", rest: " — model SBA loan, seller note, and down payment" },
      { bold: "DSCR, WACC, IRR", rest: " — the metrics your bank will look at" },
    ],
    ctaHref: "/napkin",
    ctaLabel: "Try the Deal Analyzer",
    flip: true,
    mockup: "valuation",
  },
  {
    num: "04",
    outcome: "Compare your deals before you commit",
    tool: "Pipeline Dashboard — Deal Comparison & Tracking",
    desc: "Most buyers evaluate deals one at a time. Tether's pipeline dashboard puts every opportunity side by side — SDE, multiple, DSCR, IRR, offer range — so you can see at a glance which deal is worth pursuing. When you're ready to move forward, one click pushes it into due diligence.",
    bullets: [
      { bold: "Side-by-side comparison", rest: " — DSCR, IRR, multiple, offer range across deals" },
      { bold: "Stage tracking", rest: " — Sourcing → Discovery → QoE → Valuation → Offer → DD" },
      { bold: "Best deal highlighted", rest: " — color-coded metrics show which deal wins each category" },
      { bold: "One click to DD", rest: " — push the winning deal straight into the execution workspace" },
    ],
    ctaHref: "/pipeline",
    ctaLabel: "See the pipeline dashboard",
    mockup: "pipeline",
  },
  {
    num: "05",
    outcome: "Don't let the deal fall apart before close",
    tool: "Deal Execution · Deal Execution — Due Diligence Workspace",
    desc: "Going under contract is when most deals die. The Deal Execution workspace gives you a pre-built checklist for every phase of the process, keeps your attorney, broker, advisor, and ops team aligned in one place, and automatically sends a weekly progress report to everyone — so nothing falls through and no one has an excuse not to know where the deal stands.",
    bullets: [
      { bold: "130+ tasks — general business and HVAC templates", rest: " — 110+ tasks across 11 phases" },
      { bold: "Magic link invites", rest: " — your whole team in without creating accounts" },
      { bold: "Flag any issue", rest: " — with a required note that surfaces in the weekly report" },
      { bold: "Weekly automated report", rest: " — sent to all participants every Thursday" },
    ],
    ctaHref: "/dd-pm",
    ctaLabel: "See an interactive demo",
    flip: true,
    mockup: "dd",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[0.5px] border-border px-10 py-20"
      style={{ background: "var(--navy2)" }}
    >
      <div className="mx-auto max-w-[960px]">
        <p className="sec-label-teal mb-2 text-center">The acquisition system</p>
        <h2 className="mb-2 text-center text-[34px] font-bold leading-tight tracking-tether-tight text-warm">
          Five stages. One integrated system. Built for how deals actually work.
        </h2>
        <p className="mx-auto mb-0 max-w-[600px] text-center text-base text-muted">
          From finding the right target to closing the deal — every stage of the acquisition process in one system. Built by an operator who has closed $60M+ in acquisitions.
        </p>

        <div className="flex flex-col">
          {STAGES.map((s) => (
            <div
              key={s.num}
              className={`grid items-center gap-12 border-b border-[0.5px] border-border py-14 last:border-b-0 md:grid-cols-2 ${
                s.flip ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-teal">
                  Stage {s.num} of 05
                  {s.beta && <BetaBadge />}
                </div>
                <div className="mb-1 text-[28px] font-bold leading-tight tracking-tether-tight text-warm">
                  {s.outcome}
                </div>
                <div
                  className="mb-4 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-medium text-teal"
                  style={{ background: "var(--teal-bg)" }}
                >
                  {s.tool}
                </div>
                <p className="mb-6 text-[15px] leading-[1.7] text-muted">{s.desc}</p>
                <ul className="mb-6 flex flex-col gap-2">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] leading-normal text-muted">
                      <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" />
                      <span>
                        <strong className="text-warm">{b.bold}</strong>{b.rest}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={s.ctaHref}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-teal transition-all hover:gap-2.5"
                >
                  {s.ctaLabel} →
                </Link>
              </div>
              <BrowserFrame>
                {s.mockup === "sourcing" && <SourcingMockup />}
                {s.mockup === "qoe" && <QoEMockup />}
                {s.mockup === "valuation" && <ValuationMockup />}
                {s.mockup === "pipeline" && <PipelineMockup />}
                {s.mockup === "dd" && <DDMockup />}
              </BrowserFrame>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BetaBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-[9px] py-[2px] text-[10px] font-semibold uppercase tracking-[0.03em] text-amber"
      style={{
        background: "rgba(232,160,32,0.12)",
        border: "0.5px solid rgba(232,160,32,0.3)",
      }}
    >
      Beta
    </span>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden bg-navy"
      style={{ borderRadius: "14px", border: "0.5px solid var(--border)" }}
    >
      <div
        className="flex items-center gap-[7px] border-b border-[0.5px] border-border px-4 py-[0.6rem]"
        style={{ background: "rgba(10,22,40,0.8)" }}
      >
        <span className="rounded-full bg-danger" style={{ width: "9px", height: "9px" }} />
        <span className="rounded-full bg-amber" style={{ width: "9px", height: "9px" }} />
        <span className="rounded-full bg-teal" style={{ width: "9px", height: "9px" }} />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SourcingMockup() {
  const rows = [
    { name: "Summit HVAC Services", city: "Scottsdale, AZ · 4.2 mi", stars: "★★★★★ 4.9", owner: "Dan Fowler", badgeLabel: "Retiring", badgeStyle: { background: "rgba(232,160,32,0.1)", color: "var(--amber)", borderColor: "rgba(232,160,32,0.3)" } },
    { name: "Desert Air Solutions", city: "Mesa, AZ · 9.1 mi", stars: "★★★★☆ 4.6", owner: "Mike Torres", badgeLabel: "Contacted", badgeStyle: { background: "rgba(91,163,232,0.1)", color: "#85B7EB", borderColor: "rgba(91,163,232,0.3)" } },
    { name: "Southwest Comfort Co.", city: "Tempe, AZ · 12.4 mi", stars: "★★★★☆ 4.4", owner: "—", badgeLabel: "New", badgeStyle: { background: "var(--teal-bg)", color: "var(--teal)", borderColor: "var(--teal-bd)" } },
    { name: "Peak Roofing & HVAC", city: "Chandler, AZ · 16.8 mi", stars: "★★★★☆ 4.2", owner: "Jim Walsh", badgeLabel: "Responded", badgeStyle: { background: "rgba(175,169,236,0.1)", color: "#AFA9EC", borderColor: "rgba(175,169,236,0.3)" } },
  ];
  return (
    <>
      <p className="mb-3 text-[11px] text-muted">HVAC &nbsp;·&nbsp; Phoenix, AZ &nbsp;·&nbsp; 25 mi radius &nbsp;·&nbsp; 15 results</p>
      {rows.map((r) => (
        <div
          key={r.name}
          className="mb-1 flex items-center justify-between rounded-[7px] px-2.5 py-[7px] text-[11px]"
          style={{ background: "rgba(10,22,40,0.5)" }}
        >
          <div>
            <div className="font-medium text-warm">{r.name}</div>
            <div className="text-[10px] text-muted">{r.city}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-amber">{r.stars}</div>
            <div className="text-[10px] text-teal">{r.owner}</div>
          </div>
          <span
            className="whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px]"
            style={{ border: "0.5px solid", ...r.badgeStyle }}
          >
            {r.badgeLabel}
          </span>
        </div>
      ))}
      <div className="mt-2 rounded text-[11px] text-muted px-2 py-1.5" style={{ background: "rgba(10,22,40,0.5)" }}>
        4 targets with owner identified &nbsp;·&nbsp; 2 acquisition signals flagged &nbsp;·&nbsp; Export CSV
      </div>
    </>
  );
}

function QoEMockup() {
  const rows = [
    { label: "Payroll", tag: "+$48k", actual: "$187k", adj: "$139k", highlight: true },
    { label: "Auto", tag: "+$18k", actual: "$26k", adj: "$8k", highlight: true },
    { label: "Travel", tag: "+$9k", actual: "$14k", adj: "$5k", highlight: true },
    { label: "Software", tag: null, actual: "$22k", adj: "$22k", highlight: false },
  ];
  return (
    <>
      <p className="mb-3 text-[11px] text-muted">AI mapping complete · 3 years · 4 add-backs found</p>
      <div
        className="grid grid-cols-[1fr_70px_70px] gap-1.5 rounded-t px-2 py-1.5 text-[10px] text-muted"
        style={{ background: "rgba(10,22,40,0.5)" }}
      >
        <span>Line item</span><span className="text-right">Actual</span><span className="text-right">Adjusted</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[1fr_70px_70px] items-center gap-1.5 border-b border-[0.5px] border-border px-2 py-[5px] text-[11px]"
          style={r.highlight ? { background: "var(--teal-bg)" } : {}}
        >
          <span className="text-warm">
            {r.label}
            {r.tag && (
              <span className="ml-1.5 rounded px-1 py-0.5 text-[9px] font-semibold text-teal" style={{ background: "var(--teal-bg)" }}>
                {r.tag}
              </span>
            )}
          </span>
          <span className="text-right text-muted">{r.actual}</span>
          <span className="text-right font-semibold text-teal">{r.adj}</span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_70px_70px] gap-1.5 px-2 py-[5px] text-[11px] font-semibold" style={{ background: "rgba(10,22,40,0.5)" }}>
        <span className="text-teal">Adjusted SDE</span>
        <span className="text-right text-muted">$198k</span>
        <span className="text-right text-teal">$303k</span>
      </div>
      <div className="mt-2 rounded px-2.5 py-1.5 text-[11px] leading-relaxed text-teal" style={{ background: "var(--teal-bg)" }}>
        $81k in add-backs found. At 3x that&apos;s <strong>$243k in deal value</strong> you&apos;d have missed.
      </div>
    </>
  );
}

function ValuationMockup() {
  return (
    <>
      <div className="mb-3 rounded-lg p-3 text-center" style={{ background: "rgba(10,22,40,0.5)" }}>
        <div className="mb-1 text-[10px] text-muted">Recommended offer range</div>
        <div className="text-[20px] font-bold text-teal">$960K – $1.24M</div>
        <div className="mt-1 text-[10px] text-muted">3.18x weighted SDE of $321,000 · Asking $1.5M is above fair value</div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {[
          ["Fair value", "$1.02M", "text-warm"],
          ["Max SBA price", "$1.18M", "text-warm"],
          ["DSCR", "1.47x", "text-teal"],
          ["5-yr IRR", "22.4%", "text-teal"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="rounded-md p-2" style={{ background: "rgba(10,22,40,0.5)" }}>
            <div className="text-[10px] text-muted">{l}</div>
            <div className={`text-sm font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded px-2.5 py-1.5 text-[11px] leading-relaxed text-danger" style={{ background: "rgba(226,74,74,0.07)" }}>
        ⚑ 3 risk flags detected — key-man syndrome, customer concentration, non-assignable contracts. Multiple adjusted accordingly.
      </div>
    </>
  );
}

function PipelineMockup() {
  const deals = [
    { name: "Summit HVAC Services", stage: "Offer made", stageStyle: { background: "rgba(0,201,167,0.08)", color: "var(--teal)", borderColor: "var(--teal-bd)" }, multiple: "3.2x", dscr: "1.61x", irr: "28.4%", metricClass: "text-teal" },
    { name: "Desert Air Solutions", stage: "Valuation", stageStyle: { background: "rgba(232,160,32,0.08)", color: "var(--amber)", borderColor: "rgba(232,160,32,0.3)" }, multiple: "3.8x", dscr: "1.38x", irr: "19.2%", metricClass: "text-amber" },
    { name: "Valley Roofing Co.", stage: "Discovery", stageStyle: { background: "rgba(91,163,232,0.08)", color: "#85B7EB", borderColor: "rgba(91,163,232,0.3)" }, multiple: "—", dscr: "—", irr: "—", metricClass: "text-muted" },
  ];
  return (
    <>
      <p className="mb-3 text-[11px] text-muted">3 deals in pipeline &nbsp;·&nbsp; comparing side-by-side</p>
      <div className="mb-1 grid grid-cols-[1fr_52px_52px_52px] gap-1 px-1.5 text-[10px] text-muted">
        <span>Deal</span><span className="text-right">Multiple</span><span className="text-right">DSCR</span><span className="text-right">IRR</span>
      </div>
      {deals.map((d) => (
        <div
          key={d.name}
          className="mb-1 grid grid-cols-[1fr_52px_52px_52px] items-center gap-1 rounded-[7px] px-2 py-[6px] text-[11px]"
          style={{ background: "rgba(10,22,40,0.5)" }}
        >
          <div>
            <div className="truncate font-medium text-warm">{d.name}</div>
            <span className="rounded-full px-1.5 py-0.5 text-[9px] whitespace-nowrap" style={{ border: "0.5px solid", ...d.stageStyle }}>{d.stage}</span>
          </div>
          <div className={`text-right text-xs font-semibold ${d.metricClass}`}>{d.multiple}</div>
          <div className={`text-right text-xs font-semibold ${d.metricClass}`}>{d.dscr}</div>
          <div className={`text-right text-xs font-semibold ${d.metricClass}`}>{d.irr}</div>
        </div>
      ))}
      <div className="mt-2 rounded px-2.5 py-1.5 text-[11px] leading-relaxed text-teal" style={{ background: "var(--teal-bg)" }}>
        Summit HVAC wins on DSCR and IRR. <strong>Push to due diligence →</strong>
      </div>
    </>
  );
}

function DDMockup() {
  return (
    <>
      <p className="mb-3 text-[11px] text-muted">Summit HVAC Services · 21 days left in DD</p>
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {[
          ["Complete", "8/110", "text-teal"],
          ["This week", "6", "text-[#85B7EB]"],
          ["Overdue", "4", "text-danger"],
          ["Flags", "3", "text-amber"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="rounded border border-[0.5px] border-border p-1.5" style={{ background: "rgba(10,22,40,0.4)" }}>
            <div className="text-[10px] text-muted">{l}</div>
            <div className={`text-sm font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <DDTaskRow flagged name="⚑ 3yrs taxes — overdue" role="Buyer" due="Overdue" dueClass="text-danger" fillPct={0} fillColor="var(--danger)" />
      <DDTaskRow flagged name="⚑ QoE — add-backs inflated" role="Acq. Team" due="Apr 22" fillPct={50} fillColor="var(--amber)" />
      <DDTaskRow name="LOI Signed" role="Buyer" due="Done" dueClass="text-teal" fillPct={100} fillColor="var(--teal)" done />
      <div className="mt-2 rounded px-2 py-1.5 text-[10px] text-muted" style={{ background: "rgba(10,22,40,0.5)" }}>
        Weekly report sends Thu 8:00 AM → Buyer, Acq. Team, Lawyer, Bank
      </div>
    </>
  );
}

function DDTaskRow({
  name, role, fillPct, fillColor, flagged, done,
}: {
  name: string; role: string; due: string; dueClass?: string;
  fillPct: number; fillColor: string; flagged?: boolean; done?: boolean;
}) {
  return (
    <div
      className="mb-0.5 grid grid-cols-[8px_1fr_60px_40px] items-center gap-1.5 rounded px-1.5 py-[5px] text-[11px]"
      style={flagged ? { background: "rgba(226,74,74,0.08)", border: "0.5px solid rgba(226,74,74,0.2)" } : { background: "rgba(10,22,40,0.4)" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: flagged ? "var(--danger)" : "var(--teal)" }} />
      <span className={done ? "line-through text-muted" : "text-warm"}>{name}</span>
      <span className="rounded px-1 py-0.5 text-[9px] text-muted" style={{ background: "#E6F1FB", color: "#0C447C" }}>{role}</span>
      <div className="h-[3px] overflow-hidden rounded-full" style={{ background: "var(--navy3)" }}>
        <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: fillColor }} />
      </div>
    </div>
  );
}
