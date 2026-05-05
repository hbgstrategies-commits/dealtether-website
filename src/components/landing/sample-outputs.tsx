"use client";

import { useState } from "react";

type TabKey = "src" | "qoe" | "val" | "pipe" | "dd";

const TABS: { key: TabKey; label: React.ReactNode; url: string }[] = [
  {
    key: "src",
    label: (
      <>
        Sourcing tool{" "}
        <span
          className="inline-flex items-center rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber"
          style={{ background: "rgba(232,160,32,0.12)", border: "0.5px solid rgba(232,160,32,0.3)" }}
        >
          Beta
        </span>
      </>
    ),
    url: "dealtether.com/sourcing — Acquisition target research",
  },
  { key: "qoe", label: "Financial Normalizer", url: "dealtether.com/qoe — Financial Normalizer output" },
  { key: "val", label: "Deal Analyzer", url: "dealtether.com/valuation — Deal Analyzer report" },
  { key: "pipe", label: "Pipeline dashboard", url: "dealtether.com/pipeline — Deal comparison dashboard" },
  { key: "dd", label: "DD workspace", url: "dealtether.com/dd-demo — Deal Execution workspace" },
];

export function SampleOutputs() {
  const [active, setActive] = useState<TabKey>("val");
  const currentTab = TABS.find((t) => t.key === active)!;

  return (
    <section id="examples" className="mx-auto max-w-[1020px] px-10 pb-20">
      <div className="mb-8 text-center">
        <p className="sec-label-teal mb-2">Real output</p>
        <h2 className="text-[30px] font-bold text-warm" style={{ letterSpacing: "-0.6px" }}>
          See exactly what you get
        </h2>
        <p className="mt-2 text-[15px] text-muted">Sample outputs from real tool runs on a HVAC acquisition.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`rounded-lg border border-[0.5px] px-[18px] py-[7px] text-[13px] font-medium transition-all ${
              active === t.key
                ? "border-teal-bd bg-navy-100 text-warm"
                : "border-border bg-transparent text-muted hover:text-warm"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[0.5px] border-border" style={{ background: "var(--navy2)" }}>
        <div className="flex items-center gap-2 border-b border-[0.5px] border-border bg-navy px-4 py-[0.6rem]">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal" />
          <div className="flex-1 rounded text-center px-2.5 py-0.5 text-[11px] text-muted" style={{ background: "var(--navy2)" }}>
            {currentTab.url}
          </div>
        </div>
        <div className="p-6">
          {active === "src" && <SrcPanel />}
          {active === "qoe" && <QoEPanel />}
          {active === "val" && <ValPanel />}
          {active === "pipe" && <PipePanel />}
          {active === "dd" && <DDPanel />}
        </div>
      </div>
    </section>
  );
}

/* ─── Sourcing Panel ─────────────────────────────────────────────────────── */
function SrcPanel() {
  const rows = [
    { name: "Summit HVAC Services", city: "Scottsdale, AZ · 4.2 mi", stars: "★★★★★ 4.9", owner: "Dan Fowler", revenue: "$2M–$5M", badge: "Retiring", badgeStyle: { background: "rgba(232,160,32,0.1)", color: "var(--amber)", borderColor: "rgba(232,160,32,0.3)" } },
    { name: "Desert Air Solutions", city: "Mesa, AZ · 9.1 mi", stars: "★★★★☆ 4.6", owner: "Mike Torres", revenue: "$1M–$3M", badge: "Contacted", badgeStyle: { background: "rgba(91,163,232,0.1)", color: "#85B7EB", borderColor: "rgba(91,163,232,0.3)" } },
    { name: "Peak Roofing & HVAC", city: "Chandler, AZ · 16.8 mi", stars: "★★★★☆ 4.2", owner: "Jim Walsh", revenue: "$800K–$2M", badge: "Responded", badgeStyle: { background: "rgba(175,169,236,0.1)", color: "#AFA9EC", borderColor: "rgba(175,169,236,0.3)" } },
    { name: "Valley Roofing Co.", city: "Gilbert, AZ · 19.3 mi", stars: "★★★★☆ 4.1", owner: "—", revenue: "$500K–$1M", badge: "New", badgeStyle: { background: "var(--teal-bg)", color: "var(--teal)", borderColor: "var(--teal-bd)" } },
  ];
  return (
    <>
      <p className="mb-4 text-[12px] text-muted">HVAC &nbsp;·&nbsp; Phoenix, AZ &nbsp;·&nbsp; 25 mile radius &nbsp;·&nbsp; 15 businesses found</p>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[0.5px] border-border bg-navy px-3 py-2">
        <span className="text-[12px] text-warm">HVAC</span>
        <span className="text-[11px] text-muted">·</span>
        <span className="text-[12px] text-muted">Phoenix, AZ</span>
        <span className="text-[11px] text-muted">·</span>
        <span className="text-[12px] text-muted">25 mi</span>
        <span className="ml-auto rounded px-2 py-0.5 text-[11px] text-teal" style={{ background: "var(--teal-bg)", border: "0.5px solid var(--teal-bd)" }}>15 results</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-[0.5px] border-border">
        <div className="grid grid-cols-[1fr_80px_80px_70px_70px] gap-0 border-b border-[0.5px] border-border bg-navy px-2.5 py-[7px] text-[10px] font-medium text-muted">
          <span>Company</span><span className="text-right">Rating</span><span className="text-right">Owner</span><span className="text-right">Revenue</span><span className="text-center">Status</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="grid grid-cols-[1fr_80px_80px_70px_70px] items-center gap-0 border-b border-[0.5px] border-border px-2.5 py-[7px] text-[12px] last:border-b-0"
            style={i % 2 === 1 ? { background: "rgba(26,47,80,0.4)" } : {}}
          >
            <div>
              <div className="font-medium text-warm">{r.name}</div>
              <div className="text-[10px] text-muted">{r.city}</div>
            </div>
            <div className="text-right text-[11px] text-amber">{r.stars}</div>
            <div className="text-right text-[11px] text-teal">{r.owner}</div>
            <div className="text-right text-[11px] text-muted">{r.revenue}</div>
            <div className="text-center">
              <span className="rounded-full px-[7px] py-0.5 text-[9px]" style={{ border: "0.5px solid", ...r.badgeStyle }}>{r.badge}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 rounded px-2.5 py-1.5 text-[11px] text-muted" style={{ background: "rgba(10,22,40,0.5)" }}>
          3 owners identified &nbsp;·&nbsp; 1 retirement signal &nbsp;·&nbsp; Export CSV
        </div>
        <a href="/sourcing" className="whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[12px] font-medium text-teal" style={{ background: "var(--teal-bg)", border: "0.5px solid var(--teal-bd)" }}>
          Try sourcing →
        </a>
      </div>
    </>
  );
}

/* ─── QoE Panel ──────────────────────────────────────────────────────────── */
function QoEPanel() {
  return (
    <>
      <p className="mb-4 text-[12px] text-muted">Summit HVAC Services · AI mapping complete · 3 years · 4 add-backs identified totaling $81,000</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { year: "2022", color: "#85B7EB", rev: "$891,000", sde: "$198k", adjSde: "$241k" },
          { year: "2023", color: "var(--teal)", rev: "$947,000", sde: "$223k", adjSde: "$271k" },
          { year: "2024", color: "var(--amber)", rev: "$1,008,000", sde: "$249k", adjSde: "$303k" },
        ].map((y) => (
          <div key={y.year} className="rounded-lg border border-[0.5px] border-border p-3" style={{ background: "var(--navy)" }}>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: y.color }}>{y.year}</div>
            <div className="text-[18px] font-bold text-warm">{y.rev}</div>
            <div className="mt-1 text-[11px] text-muted">
              SDE: {y.sde} → <span className="font-semibold text-teal">{y.adjSde} adj</span>
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-[0.5px] border-border">
        <div className="grid grid-cols-[1fr_90px_90px_90px] border-b border-[0.5px] border-border bg-navy px-3 py-2 text-[11px] font-medium text-muted">
          <span>Line item</span><span className="text-right">2022</span><span className="text-right">2023</span><span className="text-right">2024 adj</span>
        </div>
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal border-b border-[0.5px] border-border" style={{ background: "var(--navy2)", letterSpacing: "0.06em" }}>Revenue</div>
        {[
          { label: "Management Income", v22: "$712k", v23: "$758k", v24: "$804k", adj: false },
          { label: "Management Income", v22: "$142k", v23: "$151k", v24: "$161k", adj: false, total: false, label2: "Maintenance Income" },
        ].map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_90px_90px_90px] items-center gap-0 border-b border-[0.5px] border-border px-3 py-1.5 text-[12px]">
            <span className="text-warm">{i === 0 ? "Management Income" : "Maintenance Income"}</span>
            <span className="text-right text-muted">{r.v22}</span><span className="text-right text-muted">{r.v23}</span>
            <span className="text-right font-semibold text-teal">{r.v24}</span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_90px_90px_90px] gap-0 border-b border-[0.5px] border-border bg-navy px-3 py-1.5 text-[12px] font-semibold">
          <span className="text-teal">Total Revenue</span><span className="text-right text-muted">$891k</span><span className="text-right text-muted">$947k</span><span className="text-right text-teal">$1,008k</span>
        </div>
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal border-b border-[0.5px] border-border" style={{ background: "var(--navy2)", letterSpacing: "0.06em" }}>Expenses — add-backs highlighted</div>
        {[
          { label: "Payroll", tag: "+$48k addback", v22: "$287k", v23: "$298k", v24: "$261k", adj: true },
          { label: "Auto", tag: "+$18k addback", v22: "$26k", v23: "$27k", v24: "$10k", adj: true },
          { label: "Travel", tag: "+$9k addback", v22: "$14k", v23: "$15k", v24: "$6k", adj: true },
          { label: "Meals", tag: "+$6k addback", v22: "$9k", v23: "$10k", v24: "$4k", adj: true },
          { label: "Software", tag: null, v22: "$22k", v23: "$24k", v24: "$26k", adj: false },
        ].map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_90px_90px_90px] items-center gap-0 border-b border-[0.5px] border-border px-3 py-1.5 text-[12px]" style={r.adj ? { background: "var(--teal-bg)" } : {}}>
            <span className="text-warm">
              {r.label}
              {r.tag && <span className="ml-1.5 rounded px-1 py-0.5 text-[10px] text-teal" style={{ background: "var(--teal-bg)" }}>{r.tag}</span>}
            </span>
            <span className="text-right text-muted">{r.v22}</span><span className="text-right text-muted">{r.v23}</span>
            <span className="text-right font-semibold text-teal">{r.v24}</span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_90px_90px_90px] gap-0 bg-navy px-3 py-1.5 text-[12px] font-semibold">
          <span className="text-teal">Adjusted SDE (true earnings)</span><span className="text-right text-muted">$241k</span><span className="text-right text-muted">$271k</span><span className="text-right text-teal">$303k</span>
        </div>
      </div>
      <div className="mt-3 rounded-r-lg border-l-[3px] border-l-teal px-4 py-2.5 text-[12px] leading-relaxed text-teal" style={{ background: "var(--teal-bg)", border: "0.5px solid var(--teal-bd)", borderLeft: "3px solid var(--teal)" }}>
        AI flagged 4 add-backs totaling $81,000 — owner personal expenses run through the business that won&apos;t continue post-close. At a 3x multiple, that&apos;s <strong>$243,000 in deal value</strong> you&apos;d have missed without this analysis.
      </div>
    </>
  );
}

/* ─── Valuation Panel ───────────────────────────────────────────────────── */
function ValPanel() {
  return (
    <>
      <p className="mb-4 text-[12px] text-muted">Summit HVAC Services · Weighted SDE across 3 years · Analysis complete</p>
      <div className="mb-4 rounded-xl border border-[0.5px] border-border bg-navy p-5 text-center">
        <div className="mb-1.5 text-[12px] text-muted">Recommended offer range</div>
        <div className="mb-1 text-[28px] font-bold text-teal" style={{ letterSpacing: "-1px" }}>$960,000 – $1,240,000</div>
        <div className="text-[13px] text-muted">3.18x weighted average SDE of $321,000 &nbsp;·&nbsp; 3 years weighted</div>
        <div className="mt-1.5 text-[12px] text-amber">Asking $1,500,000 (4.67x) — above fair value · use creative deal structure to bridge the gap</div>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { l: "Weighted avg SDE", v: "$321,000", n: "3-yr weighted", vc: "text-teal" },
          { l: "Fair value", v: "$1,020,000", n: "3.18x SDE", vc: "text-warm" },
          { l: "Max SBA price", v: "$1,180,000", n: "1.25x DSCR floor", vc: "text-warm" },
          { l: "Year 1 proj. SDE", v: "$333,840", n: "+4% growth applied", vc: "text-teal" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg border border-[0.5px] border-border bg-navy p-2.5">
            <div className="text-[10px] text-muted">{m.l}</div>
            <div className={`text-[17px] font-semibold ${m.vc}`}>{m.v}</div>
            <div className="mt-0.5 text-[10px] text-muted">{m.n}</div>
          </div>
        ))}
      </div>
      <div className="mb-4 rounded-xl border border-[0.5px] border-border bg-navy p-4">
        <div className="mb-2.5 text-[13px] font-semibold text-warm">How the multiple was calculated</div>
        <div className="mb-2.5 grid grid-cols-3 gap-2">
          {[
            { l: "Benchmark (SDE band)", v: "3.375x", n: "$200k–$500k SDE range", vc: "text-warm" },
            { l: "Qualitative adjustment", v: "+0.25x", n: "Avg score 3.5 / 5.0", vc: "text-teal" },
            { l: "Risk penalty", v: "–0.46x", n: "3 risk flags present", vc: "text-danger" },
          ].map((m) => (
            <div key={m.l} className="rounded-lg p-2.5" style={{ background: "var(--navy2)" }}>
              <div className="text-[10px] text-muted">{m.l}</div>
              <div className={`text-[16px] font-semibold ${m.vc}`}>{m.v}</div>
              <div className="mt-0.5 text-[10px] text-muted">{m.n}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "var(--teal-bg)", border: "0.5px solid var(--teal-bd)" }}>
          <div>
            <div className="text-[11px] text-muted">Recommended multiple</div>
            <div className="text-[28px] font-bold text-teal">3.18x</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted">Applied to SDE of $321,000</div>
            <div className="text-[18px] font-semibold text-warm">$1,020,000 fair value</div>
          </div>
        </div>
      </div>
      <div className="mb-4 rounded-xl p-4" style={{ background: "rgba(226,74,74,0.07)", border: "0.5px solid rgba(226,74,74,0.2)" }}>
        <div className="mb-1.5 text-[12px] font-semibold text-danger">⚑ Risk flags — these reduce the multiple and suggest protective deal structures</div>
        {[
          { label: "Key-man syndrome — business depends on owner relationships", sev: "High", sevStyle: { background: "rgba(226,74,74,0.15)", color: "var(--danger)" } },
          { label: "Customer concentration — top 3 clients = 48% of revenue", sev: "Moderate", sevStyle: { background: "rgba(232,160,32,0.15)", color: "var(--amber)" } },
          { label: "3 management agreements have non-assignment clauses", sev: "Moderate", sevStyle: { background: "rgba(232,160,32,0.15)", color: "var(--amber)" } },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 border-b border-[0.5px] py-1.5 text-[12px] last:border-b-0" style={{ borderColor: "rgba(226,74,74,0.1)" }}>
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-danger" />
            <span className="flex-1 text-muted">{f.label}</span>
            <span className="ml-auto rounded-full px-[7px] py-px text-[10px]" style={f.sevStyle}>{f.sev}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "DSCR at offer", v: "1.47x", n: "Meets SBA 1.25x minimum", vc: "text-teal" },
          { l: "Monthly cash flow", v: "$6,840/mo", n: "Pre-tax after debt service", vc: "text-teal" },
          { l: "Est. 5-yr IRR", v: "22.4%", n: "Exceeds WACC — value creating", vc: "text-teal" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg border border-[0.5px] border-border bg-navy p-3">
            <div className="text-[10px] text-muted">{m.l}</div>
            <div className={`text-[15px] font-semibold ${m.vc}`}>{m.v}</div>
            <div className="mt-0.5 text-[10px] text-muted">{m.n}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Pipeline Panel ─────────────────────────────────────────────────────── */
function PipePanel() {
  const deals = [
    { name: "Summit HVAC Services", asking: "$850K", multiple: "3.2x", dscr: "1.61x", irr: "28.4%", stage: "Offer made", mc: "text-teal", sc: { background: "rgba(0,201,167,0.1)", color: "var(--teal)", borderColor: "var(--teal-bd)" }, highlight: true },
    { name: "Desert Air Solutions", asking: "$620K", multiple: "3.8x", dscr: "1.38x", irr: "19.2%", stage: "Valuation", mc: "text-amber", sc: { background: "rgba(232,160,32,0.1)", color: "var(--amber)", borderColor: "rgba(232,160,32,0.3)" }, highlight: false },
    { name: "Valley Roofing Co.", asking: "$490K", multiple: "—", dscr: "—", irr: "—", stage: "Discovery", mc: "text-muted", sc: { background: "rgba(91,163,232,0.1)", color: "#85B7EB", borderColor: "rgba(91,163,232,0.3)" }, highlight: false },
  ];
  return (
    <>
      <p className="mb-4 text-[12px] text-muted">3 active deals &nbsp;·&nbsp; select any 2 to compare side-by-side</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { l: "Active deals", v: "3", vc: "text-teal" },
          { l: "In diligence", v: "1", vc: "text-[#AFA9EC]" },
          { l: "Pipeline value", v: "$1.96M", vc: "text-amber" },
          { l: "Avg SDE", v: "$191K", vc: "text-teal" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-[0.5px] border-border bg-navy p-2.5">
            <div className="text-[10px] text-muted">{s.l}</div>
            <div className={`text-[18px] font-semibold ${s.vc}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="mb-3 overflow-hidden rounded-lg border border-[0.5px] border-border">
        <div className="grid grid-cols-[1fr_70px_55px_55px_55px_70px] gap-0 border-b border-[0.5px] border-border bg-navy px-2.5 py-[7px] text-[10px] font-medium text-muted">
          <span>Deal</span><span className="text-right">Asking</span><span className="text-right">Multiple</span><span className="text-right">DSCR</span><span className="text-right">IRR</span><span className="text-center">Stage</span>
        </div>
        {deals.map((d) => (
          <div
            key={d.name}
            className="grid grid-cols-[1fr_70px_55px_55px_55px_70px] items-center gap-0 border-b border-[0.5px] border-border px-2.5 py-2 text-[12px] last:border-b-0"
            style={d.highlight ? { background: "rgba(0,201,167,0.03)", borderLeft: "2px solid var(--teal)" } : { background: "rgba(26,47,80,0.4)" }}
          >
            <div className="font-medium text-warm">{d.name}</div>
            <div className="text-right text-muted">{d.asking}</div>
            <div className={`text-right font-semibold ${d.mc}`}>{d.multiple}</div>
            <div className={`text-right font-semibold ${d.mc}`}>{d.dscr}</div>
            <div className={`text-right font-semibold ${d.mc}`}>{d.irr}</div>
            <div className="text-center"><span className="rounded-full px-[7px] py-0.5 text-[9px]" style={{ border: "0.5px solid", ...d.sc }}>{d.stage}</span></div>
          </div>
        ))}
      </div>
      <div className="rounded-lg px-2.5 py-2 text-[11px] leading-relaxed text-teal" style={{ background: "var(--teal-bg)" }}>
        Summit HVAC leads on every metric — best DSCR, best IRR, lowest multiple. <strong>Ready to push to due diligence.</strong>
      </div>
    </>
  );
}

/* ─── DD Panel ───────────────────────────────────────────────────────────── */
function DDPanel() {
  const tasks = [
    { name: "⚑ 3yrs taxes — overdue", role: "Buyer", roleStyle: {}, due: "Overdue", dueClass: "text-danger", fill: 0, fillColor: "var(--danger)", flagged: true, done: false },
    { name: "⚑ QoE — add-backs under review", role: "Acq. Team", roleStyle: { background: "#EEEDFE", color: "#3C3489" }, due: "Apr 22", dueClass: "text-muted", fill: 50, fillColor: "var(--amber)", flagged: true, done: false },
    { name: "⚑ 3 contracts have non-assignment clauses", role: "Lawyer", roleStyle: { background: "#FAECE7", color: "#712B13" }, due: "Apr 19", dueClass: "text-muted", fill: 0, fillColor: "var(--danger)", flagged: true, done: false },
    { name: "LOI signed", role: "Buyer", roleStyle: {}, due: "Mar 17", dueClass: "text-teal", fill: 100, fillColor: "var(--teal)", flagged: false, done: true },
    { name: "Interview & select lender", role: "Buyer", roleStyle: {}, due: "Mar 22", dueClass: "text-teal", fill: 100, fillColor: "var(--teal)", flagged: false, done: true },
  ];
  return (
    <>
      <p className="mb-4 text-[12px] text-muted">Summit HVAC Services · HVAC acquisition · 18 days remaining in diligence</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total tasks", v: "110", vc: "text-warm" },
          { l: "Complete", v: "8", vc: "text-teal" },
          { l: "Overdue", v: "4", vc: "text-danger" },
          { l: "Flags", v: "3", vc: "text-amber" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-[0.5px] border-border bg-navy p-2.5">
            <div className="text-[10px] text-muted">{s.l}</div>
            <div className={`text-[18px] font-semibold ${s.vc}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="mb-3 rounded-lg border border-[0.5px] border-border bg-navy p-3">
        <div className="mb-1.5 flex justify-between">
          <span className="text-[12px] text-muted">Overall progress</span>
          <span className="text-[12px] font-semibold text-warm">7% complete</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full" style={{ background: "var(--navy3)" }}>
          <div className="h-full w-[7%] rounded-full bg-teal" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        {tasks.map((t) => (
          <div
            key={t.name}
            className="grid grid-cols-[8px_1fr_80px_50px_50px] items-center gap-2 rounded-md px-2 py-1.5 text-[12px]"
            style={t.flagged ? { background: "rgba(226,74,74,0.07)", border: "0.5px solid rgba(226,74,74,0.15)" } : { background: "var(--navy)" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: t.flagged ? "var(--danger)" : "var(--teal)" }} />
            <span className={t.done ? "line-through text-muted" : "text-warm"}>{t.name}</span>
            <span className="rounded px-1.5 py-0.5 text-center text-[10px]" style={{ background: "#E6F1FB", color: "#0C447C", ...t.roleStyle }}>{t.role}</span>
            <div className="h-1 overflow-hidden rounded-full" style={{ background: "var(--navy3)" }}>
              <div className="h-full rounded-full" style={{ width: `${t.fill}%`, background: t.fillColor }} />
            </div>
            <span className={`text-[10px] text-right ${t.dueClass}`}>{t.due}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-[0.5px] border-border bg-navy p-2.5 text-[11px] text-muted">
        📧 Weekly report sends Thu 8:00 AM &nbsp;·&nbsp; To: Hunter G. (Buyer), Sarah L. (Acq. Team), Robert T. (Lawyer), Live Oak Bank &nbsp;·&nbsp; Subject: Summit HVAC Services Diligence Weekly Report
      </div>
    </>
  );
}
