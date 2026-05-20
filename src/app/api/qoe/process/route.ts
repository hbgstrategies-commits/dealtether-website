import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

const PROMPT = `You are a financial analyst for business acquisitions. Extract ALL line items from this P&L and map to the QoE template.
REVENUE CATEGORIES: ${SCHEMA.revenue.join(", ")}
EXPENSE CATEGORIES: ${SCHEMA.expenses.join(", ")}
Rules: 1. Extract EVERY line item and identify the year. 2. Map each to the closest standard category. 3. Items that don't match go in unmapped. 4. Extract COGS separately if present. 5. Return ONLY valid JSON, no markdown.
REQUIRED JSON FORMAT: {"years":["2024"],"revenue":{"Management Income":{"2024":0},"Maintenance Income":{"2024":0},"Brokerage Income":{"2024":0},"Leasing Income":{"2024":0},"HOA Income":{"2024":0},"Late Fee Income":{"2024":0},"Inspection Income":{"2024":0},"Misc Income":{"2024":0}},"cogs":{"2024":0},"expenses":{"Advertising":{"2024":0},"Auto":{"2024":0},"Bank Charge":{"2024":0},"Computer Exp.":{"2024":0},"Continued Education":{"2024":0},"Corporate Taxes":{"2024":0},"Depreciation":{"2024":0},"Dues & Subscriptions":{"2024":0},"Gifts":{"2024":0},"Insurance Exp":{"2024":0},"Interest Exp":{"2024":0},"License":{"2024":0},"Meals":{"2024":0},"Office Supplies":{"2024":0},"Payroll":{"2024":0},"Postage & Delivery":{"2024":0},"Printing":{"2024":0},"Professional Fees":{"2024":0},"Rent":{"2024":0},"Repairs & Maintenance":{"2024":0},"Small Tools & Equipment":{"2024":0},"Software":{"2024":0},"Supplies":{"2024":0},"Telephone":{"2024":0},"Travel":{"2024":0},"Uniforms":{"2024":0},"Utilities":{"2024":0}},"unmapped":[{"label":"Original name","category":"revenue|expense","values":{"2024":0}}],"aiNotes":["brief addback observation"]}`;

type QoeFilePayload = {
  name: string;
  type: string;
  content: string; // base64 for PDF, plain text for CSV/XLS
};

type QoeResult = {
  years: string[];
  revenue: Record<string, Record<string, number>>;
  cogs: Record<string, number>;
  expenses: Record<string, Record<string, number>>;
  unmapped: { label: string; category: string; values: Record<string, number> }[];
  aiNotes: string[];
};

function mergeResults(results: QoeResult[]): QoeResult {
  const m: QoeResult = { years: [], revenue: {}, cogs: {}, expenses: {}, unmapped: [], aiNotes: [] };
  const allY = new Set<string>();
  results.forEach((r) => (r.years || []).forEach((y) => allY.add(y)));
  m.years = Array.from(allY).sort();
  SCHEMA.revenue.forEach((k) => { m.revenue[k] = {}; });
  SCHEMA.expenses.forEach((k) => { m.expenses[k] = {}; });
  results.forEach((r) => {
    (r.years || []).forEach((y) => { m.cogs[y] = (m.cogs[y] || 0) + (r.cogs?.[y] || 0); });
    Object.entries(r.revenue || {}).forEach(([k, v]) => {
      if (!m.revenue[k]) m.revenue[k] = {};
      Object.entries(v).forEach(([y, val]) => { m.revenue[k][y] = (m.revenue[k][y] || 0) + (val || 0); });
    });
    Object.entries(r.expenses || {}).forEach(([k, v]) => {
      if (!m.expenses[k]) m.expenses[k] = {};
      Object.entries(v).forEach(([y, val]) => { m.expenses[k][y] = (m.expenses[k][y] || 0) + (val || 0); });
    });
    (r.unmapped || []).forEach((u) => {
      const ex = m.unmapped.find((x) => x.label === u.label);
      if (ex) Object.assign(ex.values, u.values || {});
      else m.unmapped.push({ ...u, values: { ...(u.values || {}) } });
    });
    (r.aiNotes || []).forEach((n) => { if (!m.aiNotes.includes(n)) m.aiNotes.push(n); });
  });
  return m;
}

export async function POST(req: Request) {
  try {
    const { files }: { files: QoeFilePayload[] } = await req.json();
    if (!files?.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

    const results: QoeResult[] = [];
    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = [{ type: "text", text: PROMPT }];
      if (file.type === "application/pdf") {
        parts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: file.content } });
      } else {
        parts.push({ type: "text", text: `\nFILE: ${file.name}\n\n${file.content}` });
      }

      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8000,
        messages: [{ role: "user", content: parts }],
      });

      const text = message.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .replace(/```json|```/g, "")
        .trim();

      results.push(JSON.parse(text) as QoeResult);
    }

    return NextResponse.json(mergeResults(results));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
