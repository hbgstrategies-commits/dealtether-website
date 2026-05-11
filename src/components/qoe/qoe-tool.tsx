"use client";

import { useCallback, useRef, useState } from "react";
import { exportQoEPDF } from "@/lib/pdf-export";

// ── Color constants (match legacy/qoe.html) ───────────────────────────────────
const TEAL = "#00C9A7";
const TEAL_BG = "rgba(0,201,167,0.08)";
const TEAL_BD = "rgba(0,201,167,0.22)";
const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const NAVY3 = "#2A4A7A";
const WARM = "#F5F2EC";
const MUTED = "#9AA5B4";
const BORDER = "#1E3A5F";
const AMBER = "#E8A020";
const DANGER = "#E24B4A";
const YC = [TEAL, "#85B7EB", "#EF9F27", "#AFA9EC"];

const SCHEMA = {
  revenue: [
    "Management Income", "Maintenance Income", "Brokerage Income", "Leasing Income",
    "HOA Income", "Late Fee Income", "Inspection Income", "Misc Income",
  ],
  expenses: [
    "Advertising", "Auto", "Bank Charge", "Computer Exp.", "Continued Education",
    "Corporate Taxes", "Depreciation", "Dues & Subscriptions", "Gifts", "Insurance Exp",
    "Interest Exp", "License", "Meals", "Office Supplies", "Payroll", "Postage & Delivery",
    "Printing", "Professional Fees", "Rent", "Repairs & Maintenance",
    "Small Tools & Equipment", "Software", "Supplies", "Telephone", "Travel",
    "Uniforms", "Utilities",
  ],
};

// ── Types ─────────────────────────────────────────────────────────────────────
type QoeResult = {
  years: string[];
  revenue: Record<string, Record<string, number>>;
  cogs: Record<string, number>;
  expenses: Record<string, Record<string, number>>;
  unmapped: { label: string; category: string; values: Record<string, number> }[];
  aiNotes: string[];
};

type UnmappedRes = Record<string, { action: string; mergeTarget?: string }>;
type Adjs = Record<string, number | string>;
type Notes = Record<string, string>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined): string {
  if (n === 0 || n == null) return "—";
  const v = Number(n);
  const a = Math.abs(Math.round(v));
  return (v < 0 ? "(" : "") + "$" + a.toLocaleString() + (v < 0 ? ")" : "");
}

function fmtAdj(n: number | string): string | null {
  const v = Number(n);
  if (!v) return null;
  return (v > 0 ? "+" : "") + "$" + Math.abs(Math.round(v)).toLocaleString();
}

// ── AdjCell ───────────────────────────────────────────────────────────────────
function AdjCell({
  rowKey, year, rawVal, adjs, setAdj,
}: {
  rowKey: string; year: string; rawVal: number;
  adjs: Adjs; setAdj: (k: string, y: string, v: number | string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const a = adjs[`${rowKey}__${year}`] ?? "";
  const hasA = a !== "" && Number(a) !== 0;
  const adjV = (rawVal || 0) + (a === "" ? 0 : Number(a));
  return (
    <td style={{ padding: "5px 8px", verticalAlign: "middle", borderLeft: `1px solid ${BORDER}`, minWidth: 90, background: hasA ? TEAL_BG : "transparent" }}>
      {editing ? (
        <input
          type="number" autoFocus defaultValue={String(a)}
          onBlur={(e) => { setAdj(rowKey, year, e.target.value === "" ? "" : Number(e.target.value)); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }}
          style={{ width: 80, fontSize: 12, padding: "2px 6px", textAlign: "right", border: `1.5px solid ${TEAL}`, borderRadius: 4, outline: "none", background: NAVY2, color: WARM }}
          placeholder="0"
        />
      ) : (
        <div onClick={() => setEditing(true)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }} title="Click to enter adjustment">
          {hasA ? (
            <>
              <span style={{ fontSize: 11, color: Number(a) > 0 ? TEAL : DANGER, fontWeight: 600 }}>{fmtAdj(a)}</span>
              <span style={{ fontSize: 12, color: WARM, fontWeight: 500 }}>{fmt(adjV)}</span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: MUTED, fontStyle: "italic" }}>+ adj</span>
          )}
        </div>
      )}
    </td>
  );
}

// ── NoteCell ──────────────────────────────────────────────────────────────────
function NoteCell({ rowKey, notes, setNote }: { rowKey: string; notes: Notes; setNote: (k: string, v: string) => void }) {
  const [ed, setEd] = useState(false);
  const n = notes[rowKey] ?? "";
  return ed ? (
    <input type="text" autoFocus defaultValue={n}
      onBlur={(e) => { setNote(rowKey, e.target.value); setEd(false); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }}
      style={{ fontSize: 11, padding: "2px 6px", width: "100%", border: `1.5px solid ${TEAL}`, borderRadius: 4, outline: "none", background: NAVY2, color: WARM }}
      placeholder="Add note..."
    />
  ) : (
    <span onClick={() => setEd(true)} style={{ fontSize: 11, color: n ? MUTED : "#3A5070", cursor: "pointer", fontStyle: n ? "normal" : "italic" }} title="Click to add note">
      {n || "note"}
    </span>
  );
}

// ── UnmappedControls ──────────────────────────────────────────────────────────
function UnmappedControls({
  label, sectionKey, unmappedRes, setUnmappedRes,
}: {
  label: string; sectionKey: string;
  unmappedRes: UnmappedRes; setUnmappedRes: React.Dispatch<React.SetStateAction<UnmappedRes>>;
}) {
  const res = unmappedRes[label] || { action: "keep" };
  const list = sectionKey === "Revenue" ? SCHEMA.revenue : SCHEMA.expenses;
  const setRes = (u: Partial<typeof res>) => setUnmappedRes((p) => ({ ...p, [label]: { ...res, ...u } }));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <select value={res.action} onChange={(e) => setRes({ action: e.target.value })}
        style={{ fontSize: 11, padding: "2px 6px", border: `1.5px solid ${res.action === "remove" ? DANGER : res.action === "merge" ? TEAL : AMBER}`, borderRadius: 4, background: NAVY3, color: res.action === "remove" ? DANGER : res.action === "merge" ? TEAL : AMBER, fontWeight: 600, cursor: "pointer", outline: "none" }}>
        <option value="keep">Keep as own line</option>
        <option value="merge">Merge into →</option>
        <option value="remove">Remove</option>
      </select>
      {res.action === "merge" && (
        <select value={res.mergeTarget || ""} onChange={(e) => setRes({ mergeTarget: e.target.value })}
          style={{ fontSize: 11, padding: "2px 6px", border: `1.5px solid ${TEAL}`, borderRadius: 4, background: NAVY3, color: TEAL, fontWeight: 500, cursor: "pointer", outline: "none", maxWidth: 160 }}>
          <option value="">— select category —</option>
          {list.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
    </div>
  );
}

// ── SectionTable ──────────────────────────────────────────────────────────────
function SectionTable({
  sectionKey, items, unmappedItems, years, adjs, setAdj, notes, setNote, unmappedRes, setUnmappedRes,
}: {
  sectionKey: string;
  items: Record<string, Record<string, number>>;
  unmappedItems: QoeResult["unmapped"];
  years: string[];
  adjs: Adjs;
  setAdj: (k: string, y: string, v: number | string) => void;
  notes: Notes;
  setNote: (k: string, v: string) => void;
  unmappedRes: UnmappedRes;
  setUnmappedRes: React.Dispatch<React.SetStateAction<UnmappedRes>>;
}) {
  const merged: Record<string, Record<string, number>> = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, { ...v }]));
  (unmappedItems || []).forEach((u) => {
    const r = unmappedRes[u.label] || { action: "keep" };
    if (r.action === "merge" && r.mergeTarget && merged[r.mergeTarget]) {
      Object.entries(u.values || {}).forEach(([y, v]) => { merged[r.mergeTarget!][y] = (merged[r.mergeTarget!][y] || 0) + (v || 0); });
    }
  });

  const getAdj = (k: string, y: string) => adjs[`${k}__${y}`] ?? "";
  const adjVal = (k: string, y: string, raw: number) => { const a = getAdj(k, y); return (raw || 0) + (a === "" ? 0 : Number(a)); };

  const totRaw = years.reduce<Record<string, number>>((a, y) => { a[y] = Object.values(items).reduce((s, v) => s + (v[y] || 0), 0); return a; }, {});
  const totAdj = years.reduce<Record<string, number>>((a, y) => {
    let s = 0;
    Object.entries(merged).forEach(([k, v]) => { s += adjVal(`${sectionKey}::${k}`, y, v[y] || 0); });
    a[y] = s; return a;
  }, {});

  const allRows = [
    ...Object.entries(items).map(([label, vals]) => ({ label, vals: merged[label] || vals, rowKey: `${sectionKey}::${label}`, mapped: true, action: undefined as string | undefined, mergeTarget: undefined as string | undefined })),
    ...(unmappedItems || []).map((u) => {
      const r = unmappedRes[u.label] || { action: "keep" };
      return { label: u.label, vals: u.values || {}, rowKey: `unmapped::${u.label}`, mapped: false, action: r.action, mergeTarget: r.mergeTarget };
    }),
  ];

  return (
    <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: NAVY }}>
            <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 500, color: WARM, fontSize: 11, width: "22%" }}>Line item</th>
            <th style={{ textAlign: "left", padding: "9px 10px", fontWeight: 400, color: MUTED, fontSize: 10, width: "10%" }}>Note</th>
            {years.map((y, i) => (
              <th key={y} colSpan={2} style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: YC[i % 4], fontSize: 11, borderLeft: `1px solid ${BORDER}` }}>{y}</th>
            ))}
          </tr>
          <tr style={{ background: NAVY2, borderBottom: `2px solid ${TEAL}` }}>
            <th style={{ padding: "3px 12px" }} /><th style={{ padding: "3px 10px" }} />
            {years.map((y) => [
              <th key={`${y}r`} style={{ textAlign: "right", padding: "3px 10px", fontSize: 10, fontWeight: 400, color: MUTED, borderLeft: `1px solid ${BORDER}` }}>actual</th>,
              <th key={`${y}a`} style={{ textAlign: "right", padding: "3px 10px", fontSize: 10, fontWeight: 600, color: TEAL }}>adj</th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {allRows.map(({ label, vals, rowKey, mapped, action, mergeTarget }, ri) => {
            const isRem = !mapped && action === "remove";
            const isMrg = !mapped && action === "merge" && mergeTarget;
            const hasData = years.some((y) => vals[y] && vals[y] !== 0);
            const bg = isRem ? "rgba(226,74,74,0.06)" : isMrg ? TEAL_BG : !mapped ? "rgba(232,160,32,0.06)" : ri % 2 === 0 ? NAVY2 : NAVY3 + "66";
            return (
              <tr key={rowKey} style={{ borderBottom: `1px solid ${BORDER}`, background: bg, opacity: isRem ? 0.45 : hasData ? 1 : 0.55 }}>
                <td style={{ padding: "6px 12px", fontSize: 12 }}>
                  {!mapped ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 9, background: "rgba(232,160,32,0.15)", color: AMBER, padding: "1px 5px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>unmapped</span>
                        <span style={{ color: isRem ? MUTED : isMrg ? TEAL : AMBER, textDecoration: isRem ? "line-through" : "none" }}>{label}</span>
                        {isMrg && <span style={{ fontSize: 10, color: TEAL }}>→ {mergeTarget}</span>}
                      </div>
                      <UnmappedControls label={label} sectionKey={sectionKey} unmappedRes={unmappedRes} setUnmappedRes={setUnmappedRes} />
                    </div>
                  ) : (
                    <span style={{ color: WARM }}>{label}</span>
                  )}
                </td>
                <td style={{ padding: "6px 10px" }}>{!isRem && <NoteCell rowKey={rowKey} notes={notes} setNote={setNote} />}</td>
                {years.map((y) => [
                  <td key={`${y}r`} style={{ padding: "5px 10px", textAlign: "right", color: MUTED, borderLeft: `1px solid ${BORDER}`, fontSize: 12, textDecoration: isRem ? "line-through" : "none" }}>{fmt(vals[y])}</td>,
                  isRem
                    ? <td key={`${y}a`} style={{ padding: "5px 10px", borderLeft: `1px solid ${BORDER}` }} />
                    : <AdjCell key={`${y}a`} rowKey={rowKey} year={y} rawVal={vals[y] || 0} adjs={adjs} setAdj={setAdj} />,
                ])}
              </tr>
            );
          })}
          <tr style={{ background: NAVY }}>
            <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 12, color: WARM }}>Total</td>
            <td />
            {years.map((y) => [
              <td key={`${y}r`} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 500, borderLeft: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>{fmt(totRaw[y])}</td>,
              <td key={`${y}a`} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 12, color: Math.round(totAdj[y]) !== Math.round(totRaw[y]) ? TEAL : WARM }}>{fmt(totAdj[y])}</td>,
            ])}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main tool ─────────────────────────────────────────────────────────────────
export function QoETool() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<QoeResult | null>(null);
  const [adjs, setAdjsState] = useState<Adjs>({});
  const [notes, setNotesState] = useState<Notes>({});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("revenue");
  const [unmappedRes, setUnmappedRes] = useState<UnmappedRes>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setAdj = (k: string, y: string, v: number | string) =>
    setAdjsState((p) => ({ ...p, [`${k}__${y}`]: v }));
  const setNote = (k: string, v: string) => setNotesState((p) => ({ ...p, [k]: v }));
  const getAdj = (k: string, y: string) => adjs[`${k}__${y}`] ?? "";
  const adjVal = (k: string, y: string, raw: number) => { const a = getAdj(k, y); return (raw || 0) + (a === "" ? 0 : Number(a)); };

  const secTotals = (items: Record<string, Record<string, number>>, years: string[], useAdj = false) =>
    Object.entries(items).reduce<Record<string, number>>((acc, [k, vals]) => {
      years.forEach((y) => { acc[y] = (acc[y] || 0) + (useAdj ? adjVal(k, y, vals[y]) : (vals[y] || 0)); });
      return acc;
    }, {});

  const calcNOI = (
    rev: Record<string, Record<string, number>>,
    exp: Record<string, Record<string, number>>,
    cogs: Record<string, number>,
    years: string[],
    useAdj = false,
  ) => {
    const rt = secTotals(rev, years, useAdj);
    const et = secTotals(exp, years, useAdj);
    return years.reduce<Record<string, number>>((a, y) => {
      a[y] = rt[y] - (useAdj ? adjVal("__cogs", y, cogs[y] || 0) : (cogs[y] || 0)) - et[y];
      return a;
    }, {});
  };

  const readB64 = (f: File): Promise<string> =>
    new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(f); });
  const readText = (f: File): Promise<string> =>
    new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsText(f); });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const d = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.name.match(/\.(xlsx|xls|csv)$/i),
    );
    setFiles((p) => [...p, ...d].slice(0, 4));
  }, []);

  const runMapping = async () => {
    if (!files.length) return;
    setLoading(true); setError(null); setResult(null); setAdjsState({}); setNotesState({}); setUnmappedRes({});
    try {
      setLoadingMsg(`Reading ${files.length} file${files.length > 1 ? "s" : ""}…`);
      const payloads = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          type: f.type,
          content: f.type === "application/pdf" ? await readB64(f) : await readText(f),
        })),
      );

      setLoadingMsg("Analyzing with AI… this takes about 15–30 seconds");
      const resp = await fetch("/api/qoe/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: payloads }),
      });
      const data = await resp.json() as QoeResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setResult(data);
      setActiveTab("revenue");
    } catch (e) {
      setError("Processing failed — " + (e instanceof Error ? e.message : String(e)) + ". Try saving your P&L as a CSV and re-uploading.");
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!result) return;
    const { years, revenue, cogs, expenses, unmapped } = result;
    const hdr = ["Section", "Line Item", "Note", ...years.flatMap((y) => [`${y} Actual`, `${y} Adjustment`, `${y} Adjusted`])];
    const rows: (string | number)[][] = [hdr];

    const addSec = (
      label: string,
      items: Record<string, Record<string, number>>,
      uItems: QoeResult["unmapped"],
      sk: string,
    ) => {
      const mi = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, { ...v }]));
      (uItems || []).forEach((u) => {
        const r = unmappedRes[u.label] || { action: "keep" };
        if (r.action === "merge" && r.mergeTarget && mi[r.mergeTarget]) {
          Object.entries(u.values || {}).forEach(([y, v]) => { mi[r.mergeTarget!][y] = (mi[r.mergeTarget!][y] || 0) + (v || 0); });
        }
      });
      Object.entries(mi).forEach(([k, vals]) => {
        const rk = `${sk}::${k}`;
        const row: (string | number)[] = [label, k, notes[rk] ?? ""];
        years.forEach((y) => { const a = getAdj(rk, y); const raw = vals[y] || 0; row.push(raw, a === "" ? "" : a, adjVal(rk, y, raw)); });
        rows.push(row);
      });
      (uItems || []).forEach((u) => {
        const r = unmappedRes[u.label] || { action: "keep" };
        if (r.action === "remove" || r.action === "merge") return;
        const rk = `unmapped::${u.label}`;
        const row: (string | number)[] = [label + " (unmapped)", u.label, notes[rk] ?? ""];
        years.forEach((y) => { const a = getAdj(rk, y); const raw = u.values?.[y] || 0; row.push(raw, a === "" ? "" : a, adjVal(rk, y, raw)); });
        rows.push(row);
      });
    };

    addSec("Revenue", revenue, (unmapped || []).filter((u) => u.category === "revenue"), "Revenue");
    const cr: (string | number)[] = ["COGS", "COGS", notes["__cogs"] ?? ""];
    years.forEach((y) => { const a = getAdj("__cogs", y); const raw = cogs[y] || 0; cr.push(raw, a === "" ? "" : a, adjVal("__cogs", y, raw)); });
    rows.push(cr);
    addSec("Expense", expenses, (unmapped || []).filter((u) => u.category === "expense"), "Expense");
    const nR = calcNOI(revenue, expenses, cogs, years, false);
    const nA = calcNOI(revenue, expenses, cogs, years, true);
    const nr: (string | number)[] = ["Summary", "NOI", ""];
    years.forEach((y) => nr.push(Math.round(nR[y]), "", Math.round(nA[y])));
    rows.push(nr);

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "Tether_QoE_Mapped.csv";
    a.click();
  };

  // ── Upload screen ────────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, background: NAVY }}>
        <div style={{ background: NAVY, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: WARM }}>Quality of Earnings</div>
            <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>AI-powered P&L mapper</div>
          </div>
        </div>

        <div style={{ background: NAVY2, padding: "24px 20px" }}>
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.7 }}>
            Upload up to 4 years of P&L files. Tether maps every line item to a standardized QoE template using AI — then adjust and annotate inline before exporting.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? TEAL : BORDER}`, borderRadius: 10, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? TEAL_BG : NAVY, transition: "all 0.15s", marginBottom: 16 }}
          >
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: TEAL_BG, border: `1.5px solid ${TEAL_BD}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V8M8 12l4-4 4 4" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: WARM, fontWeight: 500 }}>Drop P&L files here or click to browse</p>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: MUTED }}>PDF or CSV · up to 4 files (one per year)</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.csv,.xlsx,.xls" style={{ display: "none" }}
              onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files || [])].slice(0, 4))} />
          </div>

          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: NAVY3, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: TEAL_BG, color: TEAL, letterSpacing: "0.06em", border: `1px solid ${TEAL_BD}` }}>
                    {f.name.endsWith(".pdf") ? "PDF" : f.name.endsWith(".csv") ? "CSV" : "XLS"}
                  </span>
                  <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: WARM }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: MUTED }}>{(f.size / 1024).toFixed(0)} kb</span>
                  <button onClick={(e) => { e.stopPropagation(); setFiles((p) => p.filter((_, j) => j !== i)); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 18, padding: "0 4px", lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(226,74,74,0.08)", border: `1px solid rgba(226,74,74,0.25)`, borderRadius: 8, color: DANGER, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={runMapping} disabled={loading || !files.length}
            style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, borderRadius: 8, border: "none", background: files.length && !loading ? TEAL : NAVY3, color: files.length && !loading ? NAVY : MUTED, cursor: files.length && !loading ? "pointer" : "not-allowed", transition: "background 0.15s" }}>
            {loading
              ? (loadingMsg || "Analyzing…")
              : `Run QoE mapping${files.length ? ` (${files.length} file${files.length > 1 ? "s" : ""})` : ""}`}
          </button>
        </div>

        <div style={{ background: NAVY, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 10, color: BORDER, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tether · Quality of Earnings Tool</span>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────────
  const { years, revenue, cogs, expenses, unmapped, aiNotes } = result;
  const uRev = (unmapped || []).filter((u) => u.category === "revenue");
  const uExp = (unmapped || []).filter((u) => u.category === "expense");
  const revRaw = secTotals(revenue, years, false);
  const revAdj = secTotals(revenue, years, true);
  const expRaw = secTotals(expenses, years, false);
  const expAdj = secTotals(expenses, years, true);
  const noiRaw = calcNOI(revenue, expenses, cogs, years, false);
  const noiAdj = calcNOI(revenue, expenses, cogs, years, true);
  const hasAdj = Object.keys(adjs).some((k) => adjs[k] !== "" && Number(adjs[k]) !== 0);
  const tabs = ["revenue", "expenses", "summary", ...(aiNotes?.length ? ["observations"] : [])];

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, background: NAVY }}>
      {/* Header */}
      <div style={{ background: NAVY, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: WARM }}>Quality of Earnings</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>AI-powered P&L mapper</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => { setResult(null); setFiles([]); setAdjsState({}); setNotesState({}); setUnmappedRes({}); }}
            style={{ padding: "5px 12px", fontSize: 11, borderRadius: 6, border: `1px solid ${BORDER}`, background: "none", cursor: "pointer", color: MUTED, fontWeight: 500 }}>
            New analysis
          </button>
          <button onClick={exportCSV}
            style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${TEAL}`, background: TEAL, color: NAVY, cursor: "pointer" }}>
            Export CSV ↓
          </button>
          <button
            onClick={async () => {
              const getAdj = (k: string, y: string) => adjs[`${k}__${y}`] ?? "";
              const adjVal = (k: string, y: string, raw: number) => {
                const a = getAdj(k, y);
                return (raw || 0) + (a === "" ? 0 : Number(a));
              };
              const makeRows = (items: Record<string, Record<string, number>>) =>
                Object.entries(items).map(([k, vals]) => ({
                  label: k,
                  rawVals: Object.fromEntries(years.map((y) => [y, vals[y] || 0])),
                  adjVals: Object.fromEntries(years.map((y) => [y, adjVal(k, y, vals[y] || 0)])),
                }));
              await exportQoEPDF({
                years,
                revRaw,
                revAdj,
                expRaw,
                expAdj,
                noiRaw,
                noiAdj,
                revenueRows: makeRows(revenue),
                expenseRows: makeRows(expenses),
              });
            }}
            style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${TEAL}`, background: "transparent", color: TEAL, cursor: "pointer" }}>
            Export PDF ↓
          </button>
          <button
            onClick={() => {
              // Save QoE results to localStorage so Deal Analyzer can pre-fill year data
              const handoff = {
                years: years.map((y) => ({
                  label: y,
                  revenue: Math.round(revAdj[y] || 0),
                  sde: Math.round(noiAdj[y] || 0),
                })),
              };
              localStorage.setItem("tether_qoe_handoff", JSON.stringify(handoff));
              window.location.href = "/napkin";
            }}
            style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: "1px solid #AFA9EC", background: "rgba(175,169,236,0.12)", color: "#AFA9EC", cursor: "pointer", whiteSpace: "nowrap" }}>
            Take to Deal Analyzer →
          </button>
        </div>
      </div>

      {/* Year metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(years.length, 4)},minmax(0,1fr))`, borderBottom: `2px solid ${TEAL}` }}>
        {years.map((y, i) => {
          const m = revAdj[y] ? ((noiAdj[y] / revAdj[y]) * 100).toFixed(1) : "0.0";
          const ch = Math.round(noiAdj[y]) !== Math.round(noiRaw[y]);
          return (
            <div key={y} style={{ padding: "14px 16px", background: i === 0 ? NAVY : NAVY2, borderRight: i < years.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 10, color: YC[i % 4], fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{y}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: WARM, marginBottom: 3 }}>{fmt(revAdj[y])}</div>
              <div style={{ fontSize: 11, color: MUTED }}>
                NOI: <span style={{ color: ch ? TEAL : MUTED, fontWeight: ch ? 600 : 400 }}>{fmt(noiAdj[y])}</span>
                <span style={{ color: BORDER, marginLeft: 6 }}>{m}% margin</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ background: NAVY2, padding: "0 16px", borderBottom: `1px solid ${BORDER}` }}>
        {hasAdj && (
          <div style={{ padding: "8px 14px", background: TEAL_BG, border: `1px solid ${TEAL_BD}`, borderLeft: `3px solid ${TEAL}`, borderRadius: "0 6px 6px 0", fontSize: 12, color: TEAL, margin: "12px 0 0", fontWeight: 500 }}>
            Adjustments applied — summary reflects adjusted figures. Export captures both columns.
          </div>
        )}
        <div style={{ display: "flex", gap: 0, marginTop: hasAdj ? 8 : 0 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: "10px 18px", fontSize: 12, fontWeight: activeTab === t ? 600 : 400, border: "none", borderBottom: activeTab === t ? `2px solid ${TEAL}` : "2px solid transparent", background: "none", color: activeTab === t ? TEAL : MUTED, cursor: "pointer", textTransform: "capitalize", letterSpacing: "0.02em", transition: "color 0.15s" }}>
              {t}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 12px" }}>
          Click any <strong style={{ color: TEAL }}>adj</strong> cell to enter an adjustment. Click <strong style={{ color: MUTED }}>note</strong> to annotate.
        </p>
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px", background: NAVY2 }}>
        {activeTab === "revenue" && (
          <SectionTable sectionKey="Revenue" items={revenue} unmappedItems={uRev} years={years}
            adjs={adjs} setAdj={setAdj} notes={notes} setNote={setNote} unmappedRes={unmappedRes} setUnmappedRes={setUnmappedRes} />
        )}

        {activeTab === "expenses" && (
          <>
            <div style={{ borderRadius: "8px 8px 0 0", border: `1px solid ${BORDER}`, borderBottom: "none", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: NAVY }}>
                    <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 500, color: WARM, fontSize: 11, width: "22%" }}>COGS</th>
                    <th style={{ width: "10%", padding: "9px 10px" }} />
                    {years.map((y) => [
                      <th key={`${y}r`} style={{ textAlign: "right", padding: "8px 10px", fontWeight: 400, color: MUTED, fontSize: 10, borderLeft: `1px solid ${BORDER}` }}>actual</th>,
                      <th key={`${y}a`} style={{ textAlign: "right", padding: "8px 10px", fontWeight: 600, color: TEAL, fontSize: 10 }}>adj</th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `2px solid ${TEAL}` }}>
                    <td style={{ padding: "6px 12px", color: WARM, fontWeight: 500 }}>Cost of Goods Sold</td>
                    <td style={{ padding: "6px 10px" }}><NoteCell rowKey="__cogs" notes={notes} setNote={setNote} /></td>
                    {years.map((y) => [
                      <td key={`${y}r`} style={{ padding: "5px 10px", textAlign: "right", color: MUTED, borderLeft: `1px solid ${BORDER}`, fontSize: 12 }}>{fmt(cogs[y])}</td>,
                      <AdjCell key={`${y}a`} rowKey="__cogs" year={y} rawVal={cogs[y] || 0} adjs={adjs} setAdj={setAdj} />,
                    ])}
                  </tr>
                </tbody>
              </table>
            </div>
            <SectionTable sectionKey="Expense" items={expenses} unmappedItems={uExp} years={years}
              adjs={adjs} setAdj={setAdj} notes={notes} setNote={setNote} unmappedRes={unmappedRes} setUnmappedRes={setUnmappedRes} />
          </>
        )}

        {activeTab === "summary" && (() => {
          const cogsR = years.reduce<Record<string, number>>((a, y) => ({ ...a, [y]: cogs[y] || 0 }), {});
          const cogsA = years.reduce<Record<string, number>>((a, y) => ({ ...a, [y]: adjVal("__cogs", y, cogs[y] || 0) }), {});
          const gpR = years.reduce<Record<string, number>>((a, y) => ({ ...a, [y]: revRaw[y] - cogsR[y] }), {});
          const gpA = years.reduce<Record<string, number>>((a, y) => ({ ...a, [y]: revAdj[y] - cogsA[y] }), {});
          const summaryRows = [
            { label: "Gross Revenue", raw: revRaw, adj: revAdj, bold: true, neg: false, highlight: false, divider: false },
            { label: "COGS", raw: cogsR, adj: cogsA, neg: true, bold: false, highlight: false, divider: false },
            { label: "Gross Profit", raw: gpR, adj: gpA, bold: true, divider: true, neg: false, highlight: false },
            { label: "Total Operating Expenses", raw: expRaw, adj: expAdj, neg: true, bold: false, highlight: false, divider: false },
            { label: "NOI (Adjusted SDE)", raw: noiRaw, adj: noiAdj, bold: true, highlight: true, divider: true, neg: false },
          ];
          return (
            <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: NAVY }}>
                    <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 500, color: WARM, fontSize: 11, width: "28%" }} />
                    {years.map((y, i) => (
                      <th key={y} colSpan={2} style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: YC[i % 4], fontSize: 11, borderLeft: `1px solid ${BORDER}` }}>{y}</th>
                    ))}
                  </tr>
                  <tr style={{ background: NAVY2, borderBottom: `2px solid ${TEAL}` }}>
                    <th style={{ padding: "3px 12px" }} />
                    {years.map((y) => [
                      <th key={`${y}r`} style={{ textAlign: "right", padding: "3px 10px", fontSize: 10, fontWeight: 400, color: MUTED, borderLeft: `1px solid ${BORDER}` }}>actual</th>,
                      <th key={`${y}a`} style={{ textAlign: "right", padding: "3px 10px", fontSize: 10, fontWeight: 600, color: TEAL }}>adjusted</th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map(({ label, raw, adj, bold, neg, highlight, divider }, ri) => (
                    <tr key={label} style={{ borderTop: divider ? `2px solid ${TEAL}` : "none", borderBottom: `1px solid ${BORDER}`, background: highlight ? NAVY : ri % 2 === 0 ? NAVY2 : NAVY3 + "88" }}>
                      <td style={{ padding: "9px 12px", fontWeight: bold ? 600 : 400, color: WARM, fontSize: 12 }}>{label}</td>
                      {years.map((y) => {
                        const rv = raw[y] || 0, av = adj[y] || 0, ch = Math.round(rv) !== Math.round(av);
                        return [
                          <td key={`${y}r`} style={{ padding: "9px 10px", textAlign: "right", color: MUTED, fontWeight: bold ? 500 : 400, borderLeft: `1px solid ${BORDER}`, fontSize: 12 }}>{fmt(rv)}</td>,
                          <td key={`${y}a`} style={{ padding: "9px 10px", textAlign: "right", color: highlight ? (ch ? TEAL : WARM) : ch ? TEAL : neg ? DANGER : WARM, fontWeight: bold ? 700 : 400, fontSize: 12 }}>{fmt(av)}</td>,
                        ];
                      })}
                    </tr>
                  ))}
                  <tr style={{ background: NAVY, borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "7px 12px", fontWeight: 500, fontSize: 11, color: MUTED }}>SDE Margin</td>
                    {years.map((y) => {
                      const mr = revRaw[y] ? ((noiRaw[y] / revRaw[y]) * 100).toFixed(1) + "%" : "—";
                      const ma = revAdj[y] ? ((noiAdj[y] / revAdj[y]) * 100).toFixed(1) + "%" : "—";
                      return [
                        <td key={`${y}r`} style={{ padding: "7px 10px", textAlign: "right", fontSize: 11, color: MUTED, borderLeft: `1px solid ${BORDER}` }}>{mr}</td>,
                        <td key={`${y}a`} style={{ padding: "7px 10px", textAlign: "right", fontSize: 11, color: mr !== ma ? TEAL : MUTED, fontWeight: mr !== ma ? 700 : 400 }}>{ma}</td>,
                      ];
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        {activeTab === "observations" && (aiNotes?.length ?? 0) > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 8px", fontWeight: 500 }}>AI-flagged observations — potential addbacks to consider:</p>
            {aiNotes.map((n, i) => (
              <div key={i} style={{ padding: "10px 14px", background: TEAL_BG, border: `1px solid ${TEAL_BD}`, borderLeft: `3px solid ${TEAL}`, borderRadius: "0 8px 8px 0", fontSize: 13, color: WARM, lineHeight: 1.6 }}>{n}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: NAVY, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${BORDER}` }}>
        <span style={{ fontSize: 10, color: BORDER, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tether · Quality of Earnings Tool</span>
      </div>
    </div>
  );
}
