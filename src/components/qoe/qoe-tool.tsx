"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { fmt } from "@/lib/valuation";

/**
 * QoE Mapper — React port.
 *
 * This is a working, simplified port of legacy/qoe.html. It covers the
 * core interaction: list P&L line items across 3 years, flag add-backs
 * with a reason, and compute Adjusted SDE in real time.
 *
 * Follow-up work to port from legacy:
 *   - AI-assisted P&L upload (PDF/CSV + OpenAI prompt)
 *   - Section grouping (Revenue / COGS / Opex / Below-the-line)
 *   - Unmapped item triage
 *   - CSV export
 */

type RowKind = "revenue" | "expense";

type Row = {
  id: string;
  label: string;
  kind: RowKind;
  values: [number, number, number]; // three years
  addbacks: [number, number, number]; // positive = add back (reduces expense)
  reason: string;
};

const DEFAULT_ROWS: Row[] = [
  {
    id: "rev-mgmt",
    label: "Management Income",
    kind: "revenue",
    values: [712000, 758000, 804000],
    addbacks: [0, 0, 0],
    reason: "",
  },
  {
    id: "rev-maint",
    label: "Maintenance Income",
    kind: "revenue",
    values: [142000, 151000, 161000],
    addbacks: [0, 0, 0],
    reason: "",
  },
  {
    id: "exp-payroll",
    label: "Payroll",
    kind: "expense",
    values: [287000, 298000, 309000],
    addbacks: [42000, 45000, 48000],
    reason: "Family members on payroll — won't continue post-close",
  },
  {
    id: "exp-auto",
    label: "Auto",
    kind: "expense",
    values: [26000, 27000, 28000],
    addbacks: [18000, 18000, 18000],
    reason: "Owner personal vehicles",
  },
  {
    id: "exp-travel",
    label: "Travel",
    kind: "expense",
    values: [14000, 15000, 15000],
    addbacks: [8000, 9000, 9000],
    reason: "Personal travel run through the business",
  },
  {
    id: "exp-sw",
    label: "Software",
    kind: "expense",
    values: [22000, 24000, 26000],
    addbacks: [0, 0, 0],
    reason: "",
  },
];

export function QoETool() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [labels] = useState<[string, string, string]>(["2022", "2023", "2024"]);

  const totals = useMemo(() => {
    const rev: [number, number, number] = [0, 0, 0];
    const exp: [number, number, number] = [0, 0, 0];
    const addbacks: [number, number, number] = [0, 0, 0];
    for (const r of rows) {
      for (let i = 0; i < 3; i++) {
        if (r.kind === "revenue") rev[i] += r.values[i];
        else exp[i] += r.values[i];
        addbacks[i] += r.addbacks[i];
      }
    }
    const statedSDE: [number, number, number] = [
      rev[0] - exp[0],
      rev[1] - exp[1],
      rev[2] - exp[2],
    ];
    const adjustedSDE: [number, number, number] = [
      statedSDE[0] + addbacks[0],
      statedSDE[1] + addbacks[1],
      statedSDE[2] + addbacks[2],
    ];
    const totalAddbacks = addbacks.reduce((a, b) => a + b, 0);
    return { rev, exp, addbacks, statedSDE, adjustedSDE, totalAddbacks };
  }, [rows]);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow(kind: RowKind) {
    setRows((prev) => [
      ...prev,
      {
        id: `${kind}-${Date.now()}`,
        label: "",
        kind,
        values: [0, 0, 0],
        addbacks: [0, 0, 0],
        reason: "",
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="rounded-2xl border border-[0.5px] border-border bg-navy-100 p-6 md:p-8">
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {labels.map((y, i) => (
          <div
            key={y}
            className="rounded-xl border border-[0.5px] border-border bg-navy p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              {y}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              Stated SDE {fmt(totals.statedSDE[i])} →{" "}
              <span className="font-semibold text-teal">
                {fmt(totals.adjustedSDE[i])} adj
              </span>
            </div>
          </div>
        ))}
      </div>

      <RowGroup
        title="Revenue"
        rows={rows.filter((r) => r.kind === "revenue")}
        labels={labels}
        onChange={updateRow}
        onRemove={removeRow}
        onAdd={() => addRow("revenue")}
      />
      <RowGroup
        title="Expenses — flag add-backs"
        rows={rows.filter((r) => r.kind === "expense")}
        labels={labels}
        onChange={updateRow}
        onRemove={removeRow}
        onAdd={() => addRow("expense")}
      />

      <div className="mt-6 rounded-2xl border border-teal-bd bg-teal-bg p-5">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="text-sm font-semibold text-teal">Adjusted SDE</span>
          <div className="flex gap-6 text-right font-bold text-teal">
            <span>{fmt(totals.adjustedSDE[0])}</span>
            <span>{fmt(totals.adjustedSDE[1])}</span>
            <span>{fmt(totals.adjustedSDE[2])}</span>
          </div>
        </div>
        <p className="text-xs text-muted">
          {totals.totalAddbacks > 0 ? (
            <>
              <strong className="text-warm">
                {fmt(totals.totalAddbacks)}
              </strong>{" "}
              in add-backs identified across 3 years. At a 3x multiple that&apos;s{" "}
              <strong className="text-warm">
                {fmt(totals.totalAddbacks * 3)}
              </strong>{" "}
              in deal value you&apos;d have missed.
            </>
          ) : (
            <>Flag add-backs above to see your adjusted SDE.</>
          )}
        </p>
      </div>
    </div>
  );
}

// --- RowGroup ---------------------------------------------------------------
function RowGroup({
  title,
  rows,
  labels,
  onChange,
  onRemove,
  onAdd,
}: {
  title: string;
  rows: Row[];
  labels: [string, string, string];
  onChange: (id: string, patch: Partial<Row>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-warm">{title}</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-teal hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[0.5px] border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-navy/40 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Line item</th>
              {labels.map((l) => (
                <th key={l} className="px-3 py-2 text-right">
                  {l}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Add-back</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <RowEditor
                key={r.id}
                row={r}
                onChange={(patch) => onChange(r.id, patch)}
                onRemove={() => onRemove(r.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const totalAddback = row.addbacks.reduce((a, b) => a + b, 0);
  return (
    <>
      <tr className="border-t border-[0.5px] border-border">
        <td className="px-3 py-2">
          <input
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Line item"
            className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-warm outline-none focus:border-border"
          />
        </td>
        {row.values.map((v, i) => (
          <td key={i} className="px-3 py-2 text-right">
            <input
              type="number"
              value={v || ""}
              onChange={(e) => {
                const next = [...row.values] as [number, number, number];
                next[i] = parseFloat(e.target.value) || 0;
                onChange({ values: next });
              }}
              className="w-24 rounded border border-border bg-navy px-2 py-1 text-right text-warm outline-none focus:border-teal"
            />
          </td>
        ))}
        <td className="px-3 py-2 text-right">
          <input
            type="number"
            value={totalAddback || ""}
            onChange={(e) => {
              const per = (parseFloat(e.target.value) || 0) / 3;
              onChange({ addbacks: [per, per, per] });
            }}
            className={`w-24 rounded border px-2 py-1 text-right outline-none ${
              totalAddback > 0
                ? "border-teal-bd bg-teal-bg text-teal"
                : "border-border bg-navy text-warm"
            }`}
            placeholder="$0"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <button
            onClick={onRemove}
            className="text-muted hover:text-danger"
            aria-label="Remove row"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {totalAddback > 0 && (
        <tr className="border-t border-[0.5px] border-border bg-teal-bg/30">
          <td colSpan={6} className="px-3 py-2">
            <input
              value={row.reason}
              onChange={(e) => onChange({ reason: e.target.value })}
              placeholder="Reason for add-back (will appear in the report)…"
              className="w-full rounded border border-teal-bd bg-navy/50 px-3 py-1.5 text-xs text-warm outline-none"
            />
          </td>
        </tr>
      )}
    </>
  );
}
