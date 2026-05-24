"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PMQuestionnaire } from "./pm-questionnaire";
import { PMEov } from "./pm-eov";
import { QoETool } from "@/components/qoe/qoe-tool";

const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const TEAL = "#00C9A7";
const WARM = "#F5F2EC";
const MUTED = "#9AA5B4";
const BORDER = "#1E3A5F";
const DANGER = "#E24B4A";
const AMBER = "#E8A020";

type Deal = {
  id: string;
  business_name: string;
  status: string;
  questionnaire: Record<string, string>;
  qoe_data: unknown;
  qoe_adjs: unknown;
  qoe_notes: unknown;
  eov_inputs: unknown;
  created_at: string;
  updated_at: string;
};

type Tab = "questionnaire" | "qoe" | "eov";

export function PMDealDetail({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("questionnaire");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/pm/deals/${dealId}`)
      .then((r) => r.json())
      .then((d) => { setDeal(d.deal); setNameInput(d.deal?.business_name ?? ""); })
      .catch(() => router.push("/pm-portal"))
      .finally(() => setLoading(false));
  }, [dealId, router]);

  const save = useCallback(async (updates: Partial<Deal>) => {
    if (!deal) return;
    setSaving(true);
    const r = await fetch(`/api/pm/deals/${dealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const { deal: updated } = await r.json();
    if (updated) setDeal(updated);
    setSaving(false);
    setSaveMsg("Saved ✓");
    setTimeout(() => setSaveMsg(""), 2000);
  }, [deal, dealId]);

  const saveQuestionnaire = useCallback((q: Record<string, string>) => {
    save({ questionnaire: q, business_name: q.businessName || deal?.business_name });
  }, [save, deal]);

  const saveEov = useCallback((inputs: unknown) => {
    save({ eov_inputs: inputs as Record<string, unknown> });
  }, [save]);

  const updateStatus = async (status: string) => {
    await save({ status });
    setDeal((d) => d ? { ...d, status } : d);
  };

  const renameDeal = async () => {
    if (!nameInput.trim()) return;
    await save({ business_name: nameInput.trim() });
    setDeal((d) => d ? { ...d, business_name: nameInput.trim() } : d);
    setEditingName(false);
  };

  const deleteDeal = async () => {
    await fetch(`/api/pm/deals/${dealId}`, { method: "DELETE" });
    router.push("/pm-portal");
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Loading deal…</div>;
  }
  if (!deal) {
    return <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Deal not found.</div>;
  }

  const STATUS_OPTS = ["active", "pass", "closed"];
  const STATUS_COLORS: Record<string, string> = { active: TEAL, pass: DANGER, closed: AMBER };

  const tabs: { key: Tab; label: string }[] = [
    { key: "questionnaire", label: "Questionnaire" },
    { key: "qoe", label: "QoE / P&L" },
    { key: "eov", label: "EOV Report" },
  ];

  return (
    <div>
      {/* Back + header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <button onClick={() => router.push("/pm-portal")}
          style={{ fontSize: 12, color: MUTED, border: "none", background: "none", cursor: "pointer", padding: "0 0 14px", display: "flex", alignItems: "center", gap: 5 }}>
          ← PM Portal
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") renameDeal(); if (e.key === "Escape") setEditingName(false); }}
                  style={{ fontSize: 22, fontWeight: 700, border: `1.5px solid ${TEAL}`, borderRadius: 7, padding: "4px 10px", background: NAVY2, color: WARM, outline: "none", flex: 1 }}
                />
                <button onClick={renameDeal} style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "none", background: TEAL, color: NAVY, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditingName(false)} style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: WARM, margin: 0 }}>{deal.business_name}</h1>
                <button onClick={() => setEditingName(true)} title="Rename"
                  style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 14, padding: "2px 6px" }}>✏️</button>
              </div>
            )}
          </div>

          {/* Status + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {saveMsg && <span style={{ fontSize: 12, color: TEAL }}>{saveMsg}</span>}

            <select value={deal.status} onChange={(e) => updateStatus(e.target.value)}
              style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${STATUS_COLORS[deal.status] ?? BORDER}`, background: "none", color: STATUS_COLORS[deal.status] ?? MUTED, cursor: "pointer", outline: "none", textTransform: "uppercase" as const, letterSpacing: ".04em" }}>
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>

            {confirmDelete ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: DANGER }}>Delete?</span>
                <button onClick={deleteDeal} style={{ padding: "4px 12px", fontSize: 11, borderRadius: 5, border: "none", background: DANGER, color: WARM, cursor: "pointer", fontWeight: 700 }}>Yes</button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 5, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}>No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} title="Delete deal"
                style={{ border: `1px solid ${BORDER}`, background: "none", cursor: "pointer", color: MUTED, fontSize: 12, padding: "5px 10px", borderRadius: 6 }}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "10px 22px", fontSize: 13, fontWeight: tab === t.key ? 600 : 400, border: "none", borderBottom: tab === t.key ? `2px solid ${TEAL}` : "2px solid transparent", marginBottom: -1, background: "none", color: tab === t.key ? TEAL : MUTED, cursor: "pointer", transition: "color 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "questionnaire" && (
        <PMQuestionnaire
          data={deal.questionnaire ?? {}}
          onSave={saveQuestionnaire}
          saving={saving}
        />
      )}

      {tab === "qoe" && (
        <div>
          <div style={{ padding: "12px 16px", background: "rgba(0,201,167,0.06)", border: `1px solid rgba(0,201,167,0.15)`, borderRadius: 8, marginBottom: 18, fontSize: 12, color: MUTED }}>
            <strong style={{ color: TEAL }}>Tip:</strong> Upload 3–4 years of P&Ls plus YTD. After reviewing the normalized numbers, go to the <strong style={{ color: WARM }}>EOV Report</strong> tab and enter those figures to generate the valuation.
          </div>
          <QoETool />
        </div>
      )}

      {tab === "eov" && (
        <PMEov
          businessName={deal.business_name}
          questionnaire={deal.questionnaire ?? {}}
          initialInputs={deal.eov_inputs as Parameters<typeof PMEov>[0]["initialInputs"]}
          onSave={saveEov}
          saving={saving}
        />
      )}
    </div>
  );
}
