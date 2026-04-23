import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    num: "Step 01",
    outcome: "Don't get fooled by bad financials",
    tool: "Stage 01 · Financial Normalizer — Quality of Earnings",
    desc: "Before you can know what a business is worth, you need to know what it actually earns. The Financial Normalizer uploads the seller's P&Ls and uses AI to map every line item, identify owner add-backs, and show you the real adjusted SDE — the number your lender will use to underwrite your loan.",
    bullets: [
      "Upload PDF or CSV financials — up to 4 years, analyzed instantly",
      "AI identifies add-backs — owner expenses that won't continue post-close",
      "Edit and annotate inline — adjust any line item with a reason",
      "Export a clean CSV — share with your lender, advisor, or CPA",
    ],
    ctaHref: "/qoe",
    ctaLabel: "Try the Financial Normalizer — $10",
  },
  {
    num: "Step 02",
    outcome: "Know exactly what to offer and why",
    tool: "Stage 02 · Deal Analyzer — Napkin Valuation Model",
    desc: "Once you know the real earnings, find out what the business is worth and what you should offer. The Deal Analyzer gives you a market-benchmarked multiple, a recommended offer range, and a full financing model — SBA loan, seller note, monthly cash flow, and a 5-year forecast — so you never walk into a negotiation guessing.",
    bullets: [
      "Market-benchmarked multiple — based on actual SDE band comps",
      "Risk-adjusted offer range — qualitative scoring + risk penalty",
      "Live financing stack — model SBA loan, seller note, and down payment",
      "DSCR, WACC, IRR — the metrics your bank will look at",
    ],
    ctaHref: "/napkin",
    ctaLabel: "Try the Deal Analyzer — free",
    flip: true,
  },
  {
    num: "Step 03",
    outcome: "Don't let the deal fall apart before close",
    tool: "Stage 03 · Deal Execution — Due Diligence Workspace",
    desc: "Going under contract is when most deals die. The Deal Execution workspace gives you a pre-built checklist for every phase of the process, keeps your attorney, broker, advisor, and ops team aligned in one place, and automatically sends a weekly progress report to everyone.",
    bullets: [
      "Pre-built for property management — 110+ tasks across 11 phases",
      "Magic link invites — your whole team in without creating accounts",
      "Flag any issue — with a required note that surfaces in the weekly report",
      "Weekly automated report — sent to all participants every Thursday",
    ],
    ctaHref: "/dd-pm",
    ctaLabel: "See an interactive demo",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[0.5px] border-border bg-navy-100 px-10 py-20"
    >
      <div className="mx-auto max-w-5xl">
        <p className="sec-label-teal mb-3">The acquisition system</p>
        <h2 className="mb-3 text-center text-[34px] font-bold tracking-tether-tight text-warm">
          Three stages. One integrated system. Built for how deals actually
          work.
        </h2>
        <p className="mx-auto mb-2 max-w-xl text-center text-base text-muted">
          Each stage of the Tether system is designed to eliminate one of the
          three ways buyers lose money — and together they form the complete
          acquisition methodology.
        </p>

        <div className="flex flex-col">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className={`grid items-center gap-12 border-b border-[0.5px] border-border py-14 last:border-b-0 md:grid-cols-2 ${
                s.flip ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-teal">
                  {s.num}
                </div>
                <div className="mb-1 text-[28px] font-bold leading-tight tracking-tether-tight text-warm">
                  {s.outcome}
                </div>
                <div className="mb-4 inline-block rounded-full bg-teal-bg px-3 py-0.5 text-[13px] font-medium text-teal">
                  {s.tool}
                </div>
                <p className="mb-6 text-[15px] leading-relaxed text-muted">
                  {s.desc}
                </p>
                <ul className="mb-6 flex flex-col gap-2">
                  {s.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[13px] leading-normal text-muted"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={s.ctaHref}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal transition-all hover:gap-2.5"
                >
                  {s.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <MockupPreview stepNum={s.num} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Simplified mockup preview. In the legacy HTML this was a rich hand-coded
 * pixel mockup per step. For the initial Next.js port, we use a clean
 * browser-chrome frame with representative content. We can flesh these out
 * into per-step mockups in follow-up work.
 */
function MockupPreview({ stepNum }: { stepNum: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[0.5px] border-border bg-navy">
      <div className="flex items-center gap-1.5 border-b border-[0.5px] border-border bg-navy/80 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal" />
      </div>
      <div className="p-5">
        {stepNum === "Step 01" && <QoEPreview />}
        {stepNum === "Step 02" && <ValuationPreview />}
        {stepNum === "Step 03" && <DDPreview />}
      </div>
    </div>
  );
}

function QoEPreview() {
  const rows = [
    { label: "Payroll", tag: "+$48k", actual: "$187k", adj: "$139k" },
    { label: "Auto", tag: "+$18k", actual: "$26k", adj: "$8k" },
    { label: "Travel", tag: "+$9k", actual: "$14k", adj: "$5k" },
    { label: "Software", tag: null, actual: "$22k", adj: "$22k" },
  ];
  return (
    <>
      <div className="mb-3 text-[11px] text-muted">
        AI mapping complete · 3 years · 4 add-backs found
      </div>
      <div className="grid grid-cols-[1fr_70px_70px] gap-1.5 rounded-t bg-navy/50 px-2 py-1.5 text-[10px] text-muted">
        <span>Line item</span>
        <span className="text-right">Actual</span>
        <span className="text-right">Adjusted</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.label}
          className={`grid grid-cols-[1fr_70px_70px] items-center gap-1.5 border-b border-[0.5px] border-border px-2 py-1.5 text-[11px] ${
            r.tag ? "bg-teal-bg" : ""
          }`}
        >
          <span className="text-warm">
            {r.label}
            {r.tag && (
              <span className="ml-1.5 rounded bg-teal-bg px-1 py-0.5 text-[9px] font-semibold text-teal">
                {r.tag}
              </span>
            )}
          </span>
          <span className="text-right text-muted">{r.actual}</span>
          <span className="text-right font-semibold text-teal">{r.adj}</span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_70px_70px] gap-1.5 bg-navy/50 px-2 py-1.5 text-[11px] font-semibold">
        <span className="text-teal">Adjusted SDE</span>
        <span className="text-right text-muted">$198k</span>
        <span className="text-right text-teal">$303k</span>
      </div>
      <div
        className="mt-2 rounded px-2.5 py-1.5 text-[11px] leading-relaxed text-teal"
        style={{ background: "var(--teal-bg)" }}
      >
        $81k in add-backs found. At 3x that&apos;s{" "}
        <strong>$243k in deal value</strong> you&apos;d have missed.
      </div>
    </>
  );
}

function ValuationPreview() {
  return (
    <>
      <div className="mb-2 text-[12px] text-muted">Recommended offer range</div>
      <div className="mb-1 text-2xl font-bold tracking-tether-tight text-warm">
        $960K – $1.24M
      </div>
      <div className="mb-4 text-xs text-muted">
        3.18x weighted SDE of $321,000 · Asking $1.5M is above fair value
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Fair value", "$1.02M", "text-warm"],
          ["Max SBA price", "$1.18M", "text-warm"],
          ["DSCR", "1.47x", "text-teal"],
          ["5-yr IRR", "22.4%", "text-teal"],
        ].map(([l, v, c]) => (
          <div
            key={l}
            className="rounded border border-[0.5px] border-border bg-navy/40 p-2"
          >
            <div className="text-[10px] text-muted">{l}</div>
            <div className={`text-sm font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div
        className="mt-3 rounded px-2.5 py-1.5 text-[11px] leading-relaxed text-danger"
        style={{ background: "rgba(226,74,74,0.07)" }}
      >
        ⚑ 3 risk flags detected — key-man syndrome, customer concentration,
        non-assignable contracts. Multiple adjusted accordingly.
      </div>
    </>
  );
}

function DDPreview() {
  return (
    <>
      <div className="mb-3 text-[11px] text-muted">
        Apex Property Services · 18 days left in DD
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {[
          ["Complete", "8/110", "text-teal"],
          ["This week", "6", "text-[#85B7EB]"],
          ["Overdue", "4", "text-danger"],
          ["Flags", "3", "text-amber"],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded border border-[0.5px] border-border bg-navy/40 p-2 text-center">
            <div className="text-[10px] text-muted">{l}</div>
            <div className={`text-sm font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <TaskRow
          flagged
          name="⚑ 3yrs taxes — overdue"
          role="Buyer"
          due="Overdue"
          dueClass="text-danger"
          fillWidth="0%"
          fillColor="var(--danger)"
        />
        <TaskRow
          flagged
          name="⚑ QoE — add-backs inflated"
          role="Acq. Team"
          due="Apr 22"
          fillWidth="50%"
          fillColor="var(--amber)"
        />
        <TaskRow
          name="LOI Signed"
          role="Buyer"
          due="Done"
          dueClass="text-teal"
          fillWidth="100%"
          fillColor="var(--teal)"
          done
        />
      </div>
      <div className="mt-2 rounded bg-navy/50 px-2 py-1.5 text-[10px] text-muted">
        Weekly report sends Thu 8:00 AM → Buyer, Acq. Team, Lawyer, Bank
      </div>
    </>
  );
}

function TaskRow({
  name,
  role,
  due,
  dueClass = "text-muted",
  fillWidth,
  fillColor,
  flagged,
  done,
}: {
  name: string;
  role: string;
  due: string;
  dueClass?: string;
  fillWidth: string;
  fillColor: string;
  flagged?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto_60px_auto] items-center gap-2 rounded px-2 py-1.5 text-[11px] ${
        flagged ? "bg-danger/5" : ""
      }`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: flagged ? "var(--danger)" : "var(--teal)" }}
      />
      <span className={done ? "text-muted line-through" : "text-warm"}>
        {name}
      </span>
      <span className="rounded bg-navy/50 px-1.5 py-0.5 text-[9px] text-muted">
        {role}
      </span>
      <div className="h-1 rounded-full bg-navy-200">
        <div
          className="h-full rounded-full"
          style={{ width: fillWidth, background: fillColor }}
        />
      </div>
      <span className={`text-[10px] ${dueClass}`}>{due}</span>
    </div>
  );
}
