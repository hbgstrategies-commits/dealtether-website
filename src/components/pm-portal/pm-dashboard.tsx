"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const NAVY3 = "#2A4A7A";
const TEAL = "#00C9A7";
const WARM = "#F5F2EC";
const MUTED = "#9AA5B4";
const BORDER = "#1E3A5F";
const AMBER = "#E8A020";
const DANGER = "#E24B4A";

type Deal = {
  id: string;
  business_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  questionnaire: Record<string, string>;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(0,201,167,0.1)", color: TEAL },
  pass: { bg: "rgba(226,75,74,0.1)", color: DANGER },
  closed: { bg: "rgba(232,160,32,0.1)", color: AMBER },
};

export function PMDashboard() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/pm/deals")
      .then((r) => r.json())
      .then((d) => setDeals(d.deals ?? []))
      .finally(() => setLoading(false));
  }, []);

  const createDeal = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const r = await fetch("/api/pm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_name: newName.trim() }),
    });
    const { deal } = await r.json();
    setCreating(false);
    if (deal?.id) router.push(`/pm-portal/${deal.id}`);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(0,201,167,0.08)", color: TEAL, border: "0.5px solid rgba(0,201,167,0.2)", letterSpacing: ".03em", textTransform: "uppercase" as const }}>
            Private
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.3px", color: WARM, marginBottom: 4 }}>
              PM Acquisition Portal
            </h1>
            <p style={{ fontSize: 13, color: MUTED }}>
              Your private deal workspace. Questionnaire · QoE · Expert Opinion of Value.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: TEAL, color: NAVY, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            + New Deal
          </button>
        </div>
      </div>

      {/* New deal modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ background: NAVY, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, width: "100%", maxWidth: 440 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: WARM, marginBottom: 6 }}>New Deal</h2>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>What is the name of the business you&apos;re evaluating?</p>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Sunshine Property Management"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createDeal(); if (e.key === "Escape") setShowNew(false); }}
              style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: `1.5px solid ${BORDER}`, borderRadius: 8, background: NAVY2, color: WARM, outline: "none", boxSizing: "border-box", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowNew(false); setNewName(""); }}
                style={{ flex: 1, padding: "9px 16px", fontSize: 13, borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: MUTED, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={createDeal}
                disabled={creating || !newName.trim()}
                style={{ flex: 2, padding: "9px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: newName.trim() ? TEAL : NAVY3, color: newName.trim() ? NAVY : MUTED, cursor: newName.trim() ? "pointer" : "not-allowed" }}
              >
                {creating ? "Creating…" : "Create Deal →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: MUTED, fontSize: 14 }}>Loading deals…</div>
      ) : deals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", border: `2px dashed ${BORDER}`, borderRadius: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: WARM, marginBottom: 6 }}>No deals yet</div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Create your first deal to start an evaluation.</div>
          <button
            onClick={() => setShowNew(true)}
            style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: TEAL, color: NAVY, cursor: "pointer" }}
          >
            + New Deal
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {deals.map((deal) => {
            const sc = STATUS_COLORS[deal.status] ?? STATUS_COLORS.active;
            const city = deal.questionnaire?.city ?? "";
            const doors = deal.questionnaire?.doors ?? "";
            const mgmtFee = deal.questionnaire?.mgmtFee ?? "";
            return (
              <div
                key={deal.id}
                onClick={() => router.push(`/pm-portal/${deal.id}`)}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: NAVY2, border: `1px solid ${BORDER}`, borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
              >
                {/* Icon */}
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(0,201,167,0.08)", border: `1px solid rgba(0,201,167,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                  🏠
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: WARM, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {deal.business_name}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>
                    {[city, doors && `${doors} doors`, mgmtFee && `${mgmtFee}% mgmt fee`].filter(Boolean).join(" · ") || "No details yet"}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: sc.bg, color: sc.color, letterSpacing: ".04em", textTransform: "uppercase" as const, flexShrink: 0 }}>
                  {deal.status}
                </span>

                {/* Date */}
                <div style={{ fontSize: 11, color: MUTED, flexShrink: 0, minWidth: 80, textAlign: "right" as const }}>
                  {formatDate(deal.updated_at ?? deal.created_at)}
                </div>

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <path d="M9 18l6-6-6-6" stroke={WARM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
