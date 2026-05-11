/**
 * PDF export utilities for Tether tools.
 * Uses jsPDF + jspdf-autotable (client-side only).
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number | null | undefined): string {
  if (!n) return "—";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + v.toLocaleString();
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(1) + "%";
}

const NAVY  = [10, 22, 40] as [number, number, number];
const TEAL  = [0, 201, 167] as [number, number, number];
const WARM  = [245, 242, 236] as [number, number, number];
const MUTED = [154, 165, 180] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];

// ─── Deal Analyzer PDF ────────────────────────────────────────────────────────

export interface DealAnalyzerPDFData {
  businessName: string;
  avgSDE: number;
  activeMult: number;
  askPrice: number;
  offerPrice: number;
  offerLow: number;
  offerHigh: number;
  dscr: number;
  irr: number;
  eq: number;
  sbaAmount: number;
  sbaRate: number;
  sbaTerm: number;
  snAmount: number;
  snRate: number;
  snTerm: number;
  yearInputs: { label: string; revenue: number; sde: number }[];
}

export async function exportDealAnalyzerPDF(data: DealAnalyzerPDFData) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // ── Header bar ───────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 28, "F");

  doc.setTextColor(...TEAL);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TETHER", margin, 11);

  doc.setTextColor(...WARM);
  doc.setFontSize(14);
  doc.text("Deal Analyzer Report", margin, 20);

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W - margin, 20, { align: "right" });

  y = 36;

  // ── Business name ─────────────────────────────────────────────────────────────
  const name = data.businessName.trim() || "Unnamed Deal";
  doc.setTextColor(...NAVY);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(name, margin, y);
  y += 10;

  // ── Key metrics row ───────────────────────────────────────────────────────────
  const metrics = [
    { label: "Avg SDE", value: money(data.avgSDE) },
    { label: "Multiple", value: data.activeMult.toFixed(2) + "x" },
    { label: "Offer range", value: `${money(data.offerLow)} – ${money(data.offerHigh)}` },
    { label: "DSCR", value: data.dscr > 0 ? data.dscr.toFixed(2) + "x" : "—" },
    { label: "5-yr IRR", value: data.irr > 0 ? pct(data.irr * 100) : "—" },
  ];

  const boxW = (W - margin * 2 - 8) / metrics.length;
  metrics.forEach((m, i) => {
    const bx = margin + i * (boxW + 2);
    doc.setFillColor(240, 248, 246);
    doc.roundedRect(bx, y, boxW, 18, 2, 2, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(m.label.toUpperCase(), bx + boxW / 2, y + 5.5, { align: "center" });
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(m.value, bx + boxW / 2, y + 13, { align: "center" });
  });
  y += 26;

  // ── Financial inputs table ────────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Historical Financials", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Year", "Revenue", "SDE", "SDE Margin"]],
    body: data.yearInputs
      .filter((r) => r.revenue > 0 || r.sde > 0)
      .map((r) => [
        r.label,
        money(r.revenue),
        money(r.sde),
        r.revenue > 0 ? pct((r.sde / r.revenue) * 100) : "—",
      ]),
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 252, 251] },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Valuation section ─────────────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Valuation Summary", margin, y);
  y += 4;

  const valRows = [
    ["Weighted average SDE", money(data.avgSDE)],
    ["Recommended multiple", data.activeMult.toFixed(2) + "x"],
    ["Asking price", data.askPrice > 0 ? money(data.askPrice) : "Not provided"],
    ["Offer price (your target)", money(data.offerPrice)],
    ["Offer range — low", money(data.offerLow)],
    ["Offer range — high", money(data.offerHigh)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: valRows,
    bodyStyles: { fontSize: 9, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 252, 251] },
    columnStyles: {
      0: { halign: "left", cellWidth: 100 },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Deal structure section ────────────────────────────────────────────────────
  if (data.eq > 0 || data.sbaAmount > 0) {
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Capital Structure", margin, y);
    y += 4;

    const structRows: [string, string][] = [];
    if (data.eq > 0) structRows.push(["Equity (cash at close)", money(data.eq)]);
    if (data.sbaAmount > 0) structRows.push(
      ["SBA loan", money(data.sbaAmount)],
      ["  — rate / term", `${data.sbaRate}% / ${data.sbaTerm} years`],
    );
    if (data.snAmount > 0) structRows.push(
      ["Seller note", money(data.snAmount)],
      ["  — rate / term", `${data.snRate}% / ${data.snTerm} years`],
    );
    const total = data.eq + data.sbaAmount + data.snAmount;
    structRows.push(["Total financing", money(total)]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      body: structRows,
      bodyStyles: { fontSize: 9, textColor: NAVY },
      alternateRowStyles: { fillColor: [248, 252, 251] },
      columnStyles: {
        0: { halign: "left", cellWidth: 100 },
        1: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Returns metrics ───────────────────────────────────────────────────────────
  if (data.dscr > 0 || data.irr > 0) {
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Return Metrics", margin, y);
    y += 4;

    const retRows = [
      ["DSCR (debt service coverage)", data.dscr > 0 ? data.dscr.toFixed(2) + "x" : "—"],
      ["Est. 5-year IRR (3.8x exit)", data.irr > 0 ? pct(data.irr * 100) : "—"],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      body: retRows,
      bodyStyles: { fontSize: 9, textColor: NAVY },
      alternateRowStyles: { fillColor: [248, 252, 251] },
      columnStyles: {
        0: { halign: "left", cellWidth: 100 },
        1: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Disclaimer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 16, W, 16, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Pre-tax estimates for illustrative purposes only. Not financial or legal advice. Consult a qualified advisor before any acquisition decision.",
    W / 2, pageH - 7, { align: "center", maxWidth: W - margin * 2 }
  );

  const filename = `${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-deal-analysis.pdf`;
  doc.save(filename);
}

// ─── QoE PDF ──────────────────────────────────────────────────────────────────

export interface QoEPDFData {
  years: string[];
  revRaw: Record<string, number>;
  revAdj: Record<string, number>;
  expRaw: Record<string, number>;
  expAdj: Record<string, number>;
  noiRaw: Record<string, number>;
  noiAdj: Record<string, number>;
  revenueRows: { label: string; rawVals: Record<string, number>; adjVals: Record<string, number> }[];
  expenseRows: { label: string; rawVals: Record<string, number>; adjVals: Record<string, number> }[];
}

export async function exportQoEPDF(data: QoEPDFData) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const { years, revRaw, revAdj, expRaw, expAdj, noiRaw, noiAdj } = data;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // ── Header ────────────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 24, "F");

  doc.setTextColor(...TEAL);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TETHER", margin, 10);

  doc.setTextColor(...WARM);
  doc.setFontSize(13);
  doc.text("Quality of Earnings Report", margin, 18);

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W - margin, 18, { align: "right" });
  y = 32;

  // ── Summary cards ─────────────────────────────────────────────────────────────
  const cards = years.flatMap((yr) => [
    { label: `${yr} Revenue (adj)`, value: money(revAdj[yr]) },
    { label: `${yr} SDE (adj)`, value: money(noiAdj[yr]) },
  ]);

  const boxW = (W - margin * 2 - (cards.length - 1) * 3) / cards.length;
  cards.forEach((c, i) => {
    const bx = margin + i * (boxW + 3);
    doc.setFillColor(240, 248, 246);
    doc.roundedRect(bx, y, boxW, 16, 2, 2, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(c.label.toUpperCase(), bx + boxW / 2, y + 5, { align: "center" });
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(c.value, bx + boxW / 2, y + 12, { align: "center" });
  });
  y += 22;

  // ── Build year column headers ─────────────────────────────────────────────────
  const yearCols = years.flatMap((yr) => [`${yr} Actual`, `${yr} Adjusted`]);

  // ── Revenue table ─────────────────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Revenue", margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Line Item", ...yearCols]],
    body: [
      ...data.revenueRows
        .filter((r) => years.some((yr) => r.rawVals[yr] || r.adjVals[yr]))
        .map((r) => [
          r.label,
          ...years.flatMap((yr) => [money(r.rawVals[yr]), money(r.adjVals[yr])]),
        ]),
      // Total row
      ["TOTAL REVENUE", ...years.flatMap((yr) => [money(revRaw[yr]), money(revAdj[yr])])],
    ],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 252, 251] },
    didParseCell: (hookData) => {
      if (hookData.row.index === data.revenueRows.filter((r) => years.some((yr) => r.rawVals[yr] || r.adjVals[yr])).length) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [220, 244, 238];
      }
    },
    columnStyles: Object.fromEntries([
      [0, { halign: "left" }],
      ...yearCols.map((_, i) => [i + 1, { halign: "right" }]),
    ]),
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Expenses table ────────────────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Expenses", margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Line Item", ...yearCols]],
    body: [
      ...data.expenseRows
        .filter((r) => years.some((yr) => r.rawVals[yr] || r.adjVals[yr]))
        .map((r) => [
          r.label,
          ...years.flatMap((yr) => [money(r.rawVals[yr]), money(r.adjVals[yr])]),
        ]),
      ["TOTAL EXPENSES", ...years.flatMap((yr) => [money(expRaw[yr]), money(expAdj[yr])])],
    ],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 252, 251] },
    didParseCell: (hookData) => {
      if (hookData.row.index === data.expenseRows.filter((r) => years.some((yr) => r.rawVals[yr] || r.adjVals[yr])).length) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [248, 230, 230];
      }
    },
    columnStyles: Object.fromEntries([
      [0, { halign: "left" }],
      ...yearCols.map((_, i) => [i + 1, { halign: "right" }]),
    ]),
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── SDE summary ───────────────────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Adjusted SDE Summary", margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["", ...yearCols]],
    body: [
      ["Total Revenue (adj)", ...years.flatMap((yr) => ["", money(revAdj[yr])])],
      ["Total Expenses (adj)", ...years.flatMap((yr) => ["", money(expAdj[yr])])],
      ["Adjusted SDE / NOI", ...years.flatMap((yr) => [money(noiRaw[yr]), money(noiAdj[yr])])],
      ["SDE Margin", ...years.flatMap((yr) => [
        revRaw[yr] ? pct((noiRaw[yr] / revRaw[yr]) * 100) : "—",
        revAdj[yr] ? pct((noiAdj[yr] / revAdj[yr]) * 100) : "—",
      ])],
    ],
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8.5, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 252, 251] },
    didParseCell: (hookData) => {
      if (hookData.row.index === 2) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [220, 244, 238];
        hookData.cell.styles.fontSize = 9;
      }
    },
    columnStyles: Object.fromEntries([
      [0, { halign: "left", cellWidth: 60 }],
      ...yearCols.map((_, i) => [i + 1, { halign: "right" }]),
    ]),
  });

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 14, W, 14, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Pre-tax estimates for illustrative purposes only. AI-mapped figures should be verified against source documents. Not financial advice.",
    W / 2, pageH - 6, { align: "center" }
  );

  doc.save(`qoe-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
