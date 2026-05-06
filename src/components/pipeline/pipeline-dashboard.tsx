"use client";

import { useState } from "react";

// ── Colors ────────────────────────────────────────────────────────────────────
const NAVY = "#0A1628";
const NAVY2 = "#111E35";
const NAVY4 = "#243E65";
const TEAL = "#00C9A7";
const TEAL_DIM = "#00A388";
const TEAL_BG = "rgba(0,201,167,0.07)";
const TEAL_BD = "rgba(0,201,167,0.18)";
const WARM = "#F5F2EC";
const MUTED = "#7A8A9A";
const BORDER = "#1A2F50";
const BORDER2 = "#243E65";
const AMBER = "#E8A020";
const DANGER = "#E24B4A";
const BLUE = "#5BA3E8";
const PURPLE = "#AFA9EC";

const MONO = "var(--font-mono, 'Courier New', monospace)";
const DISPLAY = "var(--font-display, system-ui, sans-serif)";

// ── Stage metadata ────────────────────────────────────────────────────────────
const STAGE_META: Record<string, { label: string; color: string; bar: string }> = {
  sourcing:  { label: "Sourcing",       color: "#5BA3E8", bar: "#185FA5" },
  discovery: { label: "Discovery",      color: "#AFA9EC", bar: "#534AB7" },
  qoe:       { label: "QoE analysis",   color: "#E8A020", bar: "#854F0B" },
  valuation: { label: "Valuation",      color: "#E8A020", bar: "#854F0B" },
  offer:     { label: "Offer made",     color: "#00C9A7", bar: "#0F6E56" },
  diligence: { label: "Due diligence",  color: "#00C9A7", bar: "#085041" },
  closed:    { label: "Closed",         color: "#39D17A", bar: "#27500A" },
  pass:      { label: "Passed",         color: "#E24B4A", bar: "#A32D2D" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "sourcing", label: "Sourcing" },
  { key: "discovery", label: "Discovery" },
  { key: "qoe", label: "QoE" },
  { key: "valuation", label: "Valuation" },
  { key: "offer", label: "Offer made" },
  { key: "diligence", label: "Diligence" },
  { key: "closed", label: "Closed" },
  { key: "pass", label: "Passed" },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Deal = {
  id: number;
  name: string;
  industry: string;
  location: string;
  ask: number;
  sde: number;
  rev: number;
  offer: string;
  stage: string;
  date: string;
  sba: number;
  down: number;
  notes: string;
  selected: boolean;
};

const SEED_DEALS: Deal[] = [
  { id: 1, name: "Apex Property Services", industry: "Property Management", location: "Phoenix, AZ", ask: 850000, sde: 224000, rev: 1180000, offer: "$720K – $880K", stage: "offer", date: "2026-03-17", sba: 680000, down: 85000, notes: "Owner retiring after 14 years. Strong review growth. Solid recurring contracts.", selected: false },
  { id: 2, name: "SunState HVAC", industry: "HVAC", location: "Scottsdale, AZ", ask: 620000, sde: 168000, rev: 890000, offer: "$510K – $630K", stage: "valuation", date: "2026-04-02", sba: 500000, down: 62000, notes: "Single technician dependency risk. Equipment in good shape. Owner willing to stay 90 days.", selected: false },
  { id: 3, name: "Verde Landscaping Co.", industry: "Landscaping", location: "Tempe, AZ", ask: 410000, sde: 132000, rev: 720000, offer: "", stage: "qoe", date: "", sba: 0, down: 0, notes: "Financials just received. Running QoE now. Seasonal revenue pattern noted.", selected: false },
  { id: 4, name: "Desert Pest Solutions", industry: "Pest Control", location: "Mesa, AZ", ask: 290000, sde: 95000, rev: 480000, offer: "$235K – $290K", stage: "discovery", date: "", sba: 230000, down: 30000, notes: "Second meeting scheduled. Owner hinted at retirement timeline. Small team.", selected: false },
];

// ── Financial calculations ─────────────────────────────────────────────────────
function fmt(n: number): string {
  if (!n || n === 0) return "—";
  const v = Math.abs(Math.round(n));
  if (v >= 1000000) return "$" + (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return "$" + (v / 1000).toFixed(0) + "K";
  return "$" + v.toLocaleString();
}

function calcMultiple(ask: number, sde: number): string | null {
  if (!ask || !sde) return null;
  return (ask / sde).toFixed(2);
}

function calcDSCR(sde: number, sba: number): string | null {
  if (!sde || !sba) return null;
  const r = 0.095 / 12, n = 120;
  const annDS = sba * ((r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) * 12;
  return (sde / annDS).toFixed(2);
}

function calcIRR(ask: number, sde: number, down: number): string | null {
  if (!ask || !sde || !down) return null;
  const sbaA = ask - down;
  const r = 0.095 / 12, n = 120;
  const annDS = sbaA > 0 ? sbaA * ((r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) * 12 : 0;
  const cfs: number[] = [-down];
  let bal = sbaA;
  for (let y = 1; y <= 5; y++) {
    const ySDE = sde * Math.pow(1.04, y);
    const prin = annDS - bal * 0.095;
    bal = Math.max(0, bal - prin);
    const ecf = ySDE - annDS;
    cfs.push(y === 5 ? ecf + ySDE * 3.5 - bal : ecf);
  }
  const npv = (rate: number) => cfs.reduce((s, c, i) => s + c / Math.pow(1 + rate, i), 0);
  let rate = 0.15;
  for (let iter = 0; iter < 80; iter++) {
    const nv = npv(rate);
    const dn = cfs.reduce((s, c, i) => s - i * c / Math.pow(1 + rate, i + 1), 0);
    if (Math.abs(dn) < 1e-10) break;
    const nr = rate - nv / dn;
    if (Math.abs(nr - rate) < 0.0001) break;
    rate = nr;
  }
  return rate > -0.5 && rate < 10 ? (rate * 100).toFixed(1) : null;
}

function dscrColor(d: string | null) { if (!d) return MUTED; const n = parseFloat(d); return n >= 1.5 ? TEAL : n >= 1.25 ? AMBER : DANGER; }
function irrColor(i: string | null) { if (!i) return MUTED; const n = parseFloat(i); return n >= 25 ? TEAL : n >= 15 ? AMBER : DANGER; }
function multipleColor(m: string | null) { if (!m) return MUTED; const n = parseFloat(m); return n <= 3.0 ? TEAL : n <= 4.5 ? AMBER : DANGER; }

// ── MetricBox ─────────────────────────────────────────────────────────────────
function MetricBox({ label, value, note, color }: { label: string; value: string; note: string; color?: string }) {
  return (
    <div style={{ background: NAVY, border: `.5px solid ${BORDER}`, borderRadius: 8, padding: "7px 9px" }}>
      <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3, fontFamily: MONO }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: DISPLAY, letterSpacing: "-.3px", color: color ?? WARM }}>{value}</div>
      <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{note}</div>
    </div>
  );
}

// ── DealCard ──────────────────────────────────────────────────────────────────
function DealCard({ deal, onToggle, onEdit, onMoveToDiligence, dimmed }: {
  deal: Deal;
  onToggle: (id: number) => void;
  onEdit: (id: number) => void;
  onMoveToDiligence: (id: number) => void;
  dimmed: boolean;
}) {
  const sm = STAGE_META[deal.stage] ?? STAGE_META.sourcing;
  const mult = calcMultiple(deal.ask, deal.sde);
  const dscr = calcDSCR(deal.sde, deal.sba);
  const irr = calcIRR(deal.ask, deal.sde, deal.down);
  const dscrPct = dscr ? Math.min(parseFloat(dscr) / 3 * 100, 100) : 0;

  return (
    <div
      onClick={() => onToggle(deal.id)}
      style={{
        background: NAVY2, border: `.5px solid ${deal.selected ? TEAL : BORDER}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer", position: "relative",
        transition: "all .2s", opacity: dimmed ? 0.45 : 1,
        boxShadow: deal.selected ? "0 0 0 1px rgba(0,201,167,.15)" : "none",
      }}
    >
      {/* Stage bar */}
      <div style={{ height: 3, background: sm.bar }} />

      <div style={{ padding: "1rem 1.1rem" }}>
        {/* Card top */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: ".65rem" }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, letterSpacing: "-.3px", color: WARM, lineHeight: 1.2 }}>{deal.name}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{deal.industry}{deal.location ? " · " + deal.location : ""}</div>
          </div>
          <div style={{ width: 20, height: 20, borderRadius: 5, border: `.5px solid ${deal.selected ? TEAL : BORDER2}`, background: deal.selected ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "all .15s" }}>
            {deal.selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
        </div>

        {/* Stage badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 500, border: `.5px solid ${sm.color}33`, background: sm.color + "18", color: sm.color, marginBottom: ".75rem" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: sm.color, flexShrink: 0 }} />
          {sm.label}
        </div>

        {/* Metrics row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: ".75rem" }}>
          <MetricBox label="Asking" value={fmt(deal.ask)} note="list price" />
          <MetricBox label="SDE" value={fmt(deal.sde)} note="normalized" color={deal.sde ? TEAL : undefined} />
          <MetricBox label="Multiple" value={mult ? mult + "x" : "—"} note="ask / SDE" color={multipleColor(mult)} />
        </div>

        {/* Metrics row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: ".75rem" }}>
          <MetricBox label="DSCR" value={dscr ? dscr + "x" : "—"} note={dscr ? (parseFloat(dscr) >= 1.5 ? "lender ready" : parseFloat(dscr) >= 1.25 ? "acceptable" : "below min") : "add loan"} color={dscrColor(dscr)} />
          <MetricBox label="IRR" value={irr ? irr + "%" : "—"} note="5-yr equity" color={irrColor(irr)} />
          <MetricBox label="Down" value={fmt(deal.down)} note="cash to close" color={BLUE} />
        </div>

        {/* DSCR bar */}
        {dscr && (
          <div style={{ marginBottom: ".75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: MUTED, fontFamily: MONO, textTransform: "uppercase", letterSpacing: ".05em" }}>DSCR</span>
              <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 500, color: dscrColor(dscr) }}>{dscr}x</span>
            </div>
            <div style={{ height: 5, background: NAVY4, borderRadius: 99, overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", width: dscrPct + "%", background: dscrColor(dscr), borderRadius: 99, transition: "width .5s" }} />
              <div style={{ position: "absolute", top: -3, bottom: -3, left: (1.25 / 3 * 100) + "%", width: 1.5, background: DANGER, opacity: 0.6, borderRadius: 1 }} title="SBA min 1.25x" />
              <div style={{ position: "absolute", top: -3, bottom: -3, left: (1.5 / 3 * 100) + "%", width: 1.5, background: AMBER, opacity: 0.6, borderRadius: 1 }} title="Preferred 1.5x" />
            </div>
          </div>
        )}

        {/* Offer range */}
        {deal.offer && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: NAVY, border: `.5px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", marginBottom: ".75rem" }}>
            <span style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: MONO }}>Offer range</span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: DISPLAY, letterSpacing: "-.3px", color: TEAL }}>{deal.offer}</span>
          </div>
        )}

        {/* Notes */}
        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, fontStyle: "italic", marginBottom: ".75rem", minHeight: 16 }}>
          {deal.notes || "No notes yet."}
        </div>
      </div>

      {/* Card footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".65rem 1.1rem", borderTop: `.5px solid ${BORDER}`, background: NAVY }}>
        <div style={{ fontSize: 10, color: MUTED, fontFamily: MONO }}>
          {deal.date ? new Date(deal.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date set"}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveToDiligence(deal.id); }}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, cursor: "pointer" }}>
            {deal.stage === "diligence" ? "In DD" : "→ DD"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(deal.id); }}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `.5px solid ${TEAL_BD}`, background: TEAL_BG, color: TEAL, cursor: "pointer" }}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CompareBar ────────────────────────────────────────────────────────────────
function CompareBar({ deals, onClear }: { deals: Deal[]; onClear: () => void }) {
  const sel = deals.filter((d) => d.selected).slice(0, 4);
  if (sel.length < 2) return null;

  const metrics: { label: string; fn: (d: Deal) => string | null; fmt: (v: string | null) => string; higher: "good" | "bad" }[] = [
    { label: "Asking price", fn: (d) => d.ask ? String(d.ask) : null, fmt: (v) => fmt(Number(v)), higher: "bad" },
    { label: "Normalized SDE", fn: (d) => d.sde ? String(d.sde) : null, fmt: (v) => fmt(Number(v)), higher: "good" },
    { label: "SDE multiple", fn: (d) => calcMultiple(d.ask, d.sde), fmt: (v) => v ? v + "x" : "—", higher: "bad" },
    { label: "DSCR", fn: (d) => calcDSCR(d.sde, d.sba), fmt: (v) => v ? v + "x" : "—", higher: "good" },
    { label: "5-yr IRR", fn: (d) => calcIRR(d.ask, d.sde, d.down), fmt: (v) => v ? v + "%" : "—", higher: "good" },
    { label: "Cash to close", fn: (d) => d.down ? String(d.down) : null, fmt: (v) => fmt(Number(v)), higher: "bad" },
  ];

  return (
    <div style={{ background: NAVY2, border: `.5px solid ${BORDER}`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".85rem" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: WARM }}>Side-by-side comparison</div>
        <button onClick={onClear} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, cursor: "pointer" }}>Clear</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${sel.length}, 1fr)`, gap: 6, alignItems: "start" }}>
        <div />
        {sel.map((d) => (
          <div key={d.id} style={{ fontSize: 12, fontWeight: 600, color: WARM, padding: "4px 0", fontFamily: DISPLAY }}>
            {d.name.length > 18 ? d.name.slice(0, 16) + "…" : d.name}
          </div>
        ))}
        {metrics.map((m) => {
          const vals = sel.map((d) => parseFloat(m.fn(d) ?? "0") || 0);
          const maxV = Math.max(...vals.filter((v) => v > 0));
          return [
            <div key={m.label + "_l"} style={{ fontSize: 10, color: MUTED, fontFamily: MONO, textTransform: "uppercase", letterSpacing: ".05em", paddingTop: 6 }}>{m.label}</div>,
            ...sel.map((d, i) => {
              const raw = m.fn(d);
              const numVal = parseFloat(raw ?? "0") || 0;
              const pct = maxV > 0 ? numVal / maxV * 100 : 0;
              const positiveVals = vals.filter((v) => v > 0);
              const isBest = positiveVals.length > 0 && (m.higher === "good"
                ? numVal === Math.max(...positiveVals)
                : numVal === Math.min(...positiveVals) && numVal > 0);
              return (
                <div key={d.id + "_" + m.label} style={{ paddingTop: 4 }}>
                  <div style={{ height: 6, background: NAVY4, borderRadius: 99, overflow: "hidden", marginBottom: 3 }}>
                    <div style={{ height: "100%", width: pct + "%", background: isBest ? TEAL : NAVY4, borderRadius: 99, transition: "width .5s" }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: MONO, color: isBest ? TEAL : MUTED, fontWeight: isBest ? 500 : 400 }}>{m.fmt(raw)}</div>
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}

// ── DealModal ─────────────────────────────────────────────────────────────────
function DealModal({ open, editDeal, onSave, onClose }: {
  open: boolean;
  editDeal: Deal | null;
  onSave: (data: Omit<Deal, "id" | "selected">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editDeal?.name ?? "");
  const [industry, setIndustry] = useState(editDeal?.industry ?? "");
  const [location, setLocation] = useState(editDeal?.location ?? "");
  const [ask, setAsk] = useState(editDeal?.ask ? String(editDeal.ask) : "");
  const [sde, setSde] = useState(editDeal?.sde ? String(editDeal.sde) : "");
  const [rev, setRev] = useState(editDeal?.rev ? String(editDeal.rev) : "");
  const [offer, setOffer] = useState(editDeal?.offer ?? "");
  const [stage, setStage] = useState(editDeal?.stage ?? "sourcing");
  const [date, setDate] = useState(editDeal?.date ?? "");
  const [sba, setSba] = useState(editDeal?.sba ? String(editDeal.sba) : "");
  const [down, setDown] = useState(editDeal?.down ? String(editDeal.down) : "");
  const [notes, setNotes] = useState(editDeal?.notes ?? "");
  const [nameErr, setNameErr] = useState(false);

  if (!open) return null;

  const inp: React.CSSProperties = { width: "100%", background: NAVY, border: `.5px solid ${BORDER2}`, borderRadius: 8, color: WARM, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const lbl: React.CSSProperties = { fontSize: 11, color: MUTED, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: MONO };

  const handleSave = () => {
    if (!name.trim()) { setNameErr(true); return; }
    onSave({ name: name.trim(), industry: industry.trim(), location: location.trim(), ask: parseFloat(ask) || 0, sde: parseFloat(sde) || 0, rev: parseFloat(rev) || 0, offer: offer.trim(), stage, date, sba: parseFloat(sba) || 0, down: parseFloat(down) || 0, notes: notes.trim() });
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(5,12,25,.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
      <div style={{ background: NAVY2, border: `.5px solid ${BORDER2}`, borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, letterSpacing: "-.3px", marginBottom: ".25rem", color: WARM }}>{editDeal ? "Edit deal" : "Add deal to pipeline"}</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: "1.25rem", lineHeight: 1.5 }}>Enter what you know. You can update financials after running QoE and the valuation model.</div>

        <div style={{ marginBottom: ".9rem" }}>
          <label style={lbl}>Business name *</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setNameErr(false); }} placeholder="e.g. Apex Property Services" style={{ ...inp, borderColor: nameErr ? DANGER : BORDER2 }} />
          {nameErr && <div style={{ fontSize: 11, color: DANGER, marginTop: 3 }}>Business name is required</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ".9rem" }}>
          <div><label style={lbl}>Industry</label><input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Property Management" style={inp} /></div>
          <div><label style={lbl}>Location</label><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Phoenix, AZ" style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ".9rem" }}>
          <div><label style={lbl}>Asking price ($)</label><input type="number" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="850000" style={inp} /></div>
          <div><label style={lbl}>Normalized SDE ($)</label><input type="number" value={sde} onChange={(e) => setSde(e.target.value)} placeholder="220000" style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ".9rem" }}>
          <div><label style={lbl}>Revenue ($)</label><input type="number" value={rev} onChange={(e) => setRev(e.target.value)} placeholder="1200000" style={inp} /></div>
          <div><label style={lbl}>Offer range</label><input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="e.g. $720K – $880K" style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ".9rem" }}>
          <div>
            <label style={lbl}>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ ...inp, appearance: "none" }}>
              <option value="sourcing">Sourcing</option>
              <option value="discovery">Discovery</option>
              <option value="qoe">QoE analysis</option>
              <option value="valuation">Valuation</option>
              <option value="offer">Offer made</option>
              <option value="diligence">Due diligence</option>
              <option value="closed">Closed</option>
              <option value="pass">Passed</option>
            </select>
          </div>
          <div><label style={lbl}>LOI / Target date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ".9rem" }}>
          <div><label style={lbl}>SBA loan amount ($)</label><input type="number" value={sba} onChange={(e) => setSba(e.target.value)} placeholder="680000" style={inp} /></div>
          <div><label style={lbl}>Your cash down ($)</label><input type="number" value={down} onChange={(e) => setDown(e.target.value)} placeholder="85000" style={inp} /></div>
        </div>
        <div style={{ marginBottom: ".9rem" }}>
          <label style={lbl}>Notes / acquisition signals</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Owner retiring, 12-year business, strong review growth…" style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: "1.25rem" }}>
          <button onClick={handleSave} style={{ flex: 1, padding: 10, borderRadius: 8, background: TEAL, color: NAVY, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save to pipeline</button>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 8, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, fontSize: 13, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export function PipelineDashboard() {
  const [deals, setDeals] = useState<Deal[]>(SEED_DEALS);
  const [nextId, setNextId] = useState(5);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const openModal = (deal: Deal | null = null) => { setEditingDeal(deal); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingDeal(null); };

  const saveDeal = (data: Omit<Deal, "id" | "selected">) => {
    if (editingDeal) {
      setDeals((prev) => prev.map((d) => d.id === editingDeal.id ? { ...d, ...data } : d));
      showToast("Deal updated");
    } else {
      setDeals((prev) => [...prev, { ...data, id: nextId, selected: false }]);
      setNextId((n) => n + 1);
      showToast("Deal added to pipeline");
    }
    closeModal();
  };

  const toggleSelect = (id: number) => setDeals((prev) => prev.map((d) => d.id === id ? { ...d, selected: !d.selected } : d));
  const clearSelection = () => setDeals((prev) => prev.map((d) => ({ ...d, selected: false })));

  const moveToDiligence = (id: number) => {
    setDeals((prev) => prev.map((d) => d.id === id ? { ...d, stage: "diligence" } : d));
    showToast("Moved to due diligence");
  };

  // Derived
  const selected = deals.filter((d) => d.selected);
  const active = deals.filter((d) => !["closed", "pass"].includes(d.stage));
  const closed = deals.filter((d) => d.stage === "closed");
  const inDD = deals.filter((d) => d.stage === "diligence");
  const totalAsk = active.reduce((a, d) => a + (d.ask || 0), 0);
  const avgSDE = active.length ? active.reduce((a, d) => a + (d.sde || 0), 0) / active.length : 0;

  const filtered = filter === "all" ? deals
    : filter === "active" ? active
    : deals.filter((d) => d.stage === filter);

  const stats = [
    { label: "Total deals", value: String(deals.length), sub: "in pipeline", color: TEAL },
    { label: "Active", value: String(active.length), sub: "evaluating now", color: BLUE },
    { label: "In diligence", value: String(inDD.length), sub: "moving to close", color: PURPLE },
    { label: "Pipeline value", value: fmt(totalAsk), sub: "combined asking", color: AMBER, big: true },
    { label: "Avg SDE", value: fmt(avgSDE), sub: "normalized earnings", color: TEAL, big: true },
  ];

  const pageSub = deals.length === 0
    ? "Track, compare, and advance every acquisition opportunity."
    : `${deals.length} deal${deals.length > 1 ? "s" : ""} tracked · ${active.length} active · ${closed.length} closed`;

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: WARM }}>
      {/* Toast */}
      <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", background: TEAL, color: NAVY, fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 99, opacity: toastVisible ? 1 : 0, transition: "opacity .3s", pointerEvents: "none", zIndex: 999 }}>
        {toastMsg}
      </div>

      {/* Modal */}
      <DealModal open={modalOpen} editDeal={editingDeal} onSave={saveDeal} onClose={closeModal} />

      {/* Content */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: "-.5px", color: WARM, lineHeight: 1 }}>Deal pipeline</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>{pageSub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, border: `.5px solid ${filter === f.key ? TEAL_BD : BORDER2}`, background: filter === f.key ? TEAL_BG : "transparent", color: filter === f.key ? TEAL : MUTED, cursor: "pointer", transition: "all .15s" }}>
                  {f.label}
                </button>
              ))}
            </div>
            {/* Compare + Add */}
            <div style={{ display: "flex", gap: 8 }}>
              {selected.length >= 2 && (
                <button onClick={clearSelection} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, cursor: "pointer" }}>
                  Compare {selected.length} deals
                </button>
              )}
              <button onClick={() => openModal(null)} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 7, border: "none", background: TEAL, color: NAVY, cursor: "pointer", fontWeight: 600, transition: "background .15s" }}>
                + Add deal
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: "1.25rem" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: NAVY2, border: `.5px solid ${BORDER}`, borderRadius: 10, padding: ".85rem 1rem" }}>
              <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, fontFamily: MONO }}>{s.label}</div>
              <div style={{ fontSize: s.big ? 18 : 22, fontWeight: 600, fontFamily: DISPLAY, letterSpacing: "-.5px", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Compare bar */}
        {selected.length >= 2 && <CompareBar deals={deals} onClear={clearSelection} />}

        {/* Deals grid */}
        {deals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: NAVY2, border: `.5px dashed ${BORDER2}`, borderRadius: 16 }}>
            <svg style={{ width: 48, height: 48, margin: "0 auto 1rem", opacity: 0.25 }} viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="30" x2="22" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, marginBottom: ".5rem" }}>No deals in your pipeline</div>
            <div style={{ fontSize: 13, color: MUTED, maxWidth: 360, margin: "0 auto 1.25rem", lineHeight: 1.6 }}>Add your first acquisition target to start tracking. Pull from the sourcing tool or add manually.</div>
            <button onClick={() => openModal(null)} style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: TEAL, color: NAVY, fontWeight: 600, cursor: "pointer" }}>+ Add your first deal</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: NAVY2, border: `.5px dashed ${BORDER2}`, borderRadius: 16 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, marginBottom: ".5rem" }}>No deals in this stage</div>
            <div style={{ fontSize: 13, color: MUTED }}>Try a different filter or add a deal at this stage.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {filtered.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onToggle={toggleSelect}
                onEdit={(id) => openModal(deals.find((d) => d.id === id) ?? null)}
                onMoveToDiligence={moveToDiligence}
                dimmed={selected.length > 0 && !deal.selected}
              />
            ))}
          </div>
        )}
      </div>

      {/* Suppress unused warnings */}
      {void TEAL_DIM}{void AMBER}{void PURPLE}
    </div>
  );
}
