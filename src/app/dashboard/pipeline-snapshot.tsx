"use client";

import Link from "next/link";

type DealRow = {
  id: string;
  name: string;
  stage: string;
  sde: number | null;
  asking_price: number | null;
  offer_low: number | null;
  offer_high: number | null;
  dscr: number | null;
  irr: number | null;
  updated_at: string;
};

const STAGE_META: Record<string, { label: string; color: string }> = {
  sourcing:   { label: "Sourcing",      color: "#5BA3E8" },
  discovery:  { label: "Discovery",     color: "#AFA9EC" },
  qoe:        { label: "QoE",           color: "#E8A020" },
  valuation:  { label: "Valuation",     color: "#E8A020" },
  "Valuation":{ label: "Valuation",     color: "#E8A020" },
  offer:      { label: "Offer made",    color: "#00C9A7" },
  diligence:  { label: "Due diligence", color: "#00C9A7" },
  closed:     { label: "Closed",        color: "#39D17A" },
  pass:       { label: "Passed",        color: "#E24B4A" },
};

function fmt(n: number | null | undefined): string {
  if (!n) return "—";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + v.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function PipelineSnapshot({ deals, activeCount }: { deals: DealRow[]; activeCount: number }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9AA5B4" }}>
          Your pipeline
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "#00C9A7", background: "rgba(0,201,167,0.1)", padding: "2px 8px", borderRadius: 20, textTransform: "none", letterSpacing: 0 }}>
            {activeCount} active
          </span>
        </div>
        <Link href="/pipeline" style={{ fontSize: 12, color: "#9AA5B4", textDecoration: "none" }}>
          View all →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {deals.map((deal) => {
          const sm = STAGE_META[deal.stage] ?? STAGE_META.sourcing;
          const offerStr = deal.offer_low && deal.offer_high
            ? `${fmt(deal.offer_low)} – ${fmt(deal.offer_high)}`
            : deal.offer_high ? fmt(deal.offer_high)
            : null;
          return (
            <Link key={deal.id} href="/pipeline" style={{ textDecoration: "none" }}>
              <div style={{
                background: "#1A2F50",
                border: "0.5px solid #1E3A5F",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                overflowX: "auto",
                transition: "border-color .15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#243E65")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E3A5F")}
              >
                {/* Stage dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.color, flexShrink: 0 }} />

                {/* Name */}
                <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F2EC", flex: 1, minWidth: 120 }}>{deal.name}</div>

                {/* Stage badge */}
                <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: sm.color + "18", color: sm.color, border: `0.5px solid ${sm.color}33`, whiteSpace: "nowrap" }}>
                  {sm.label}
                </div>

                {/* Metrics */}
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  {deal.sde && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#9AA5B4", textTransform: "uppercase", letterSpacing: ".04em" }}>SDE</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#00C9A7" }}>{fmt(deal.sde)}</div>
                    </div>
                  )}
                  {offerStr && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#9AA5B4", textTransform: "uppercase", letterSpacing: ".04em" }}>Offer range</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#F5F2EC" }}>{offerStr}</div>
                    </div>
                  )}
                  {deal.dscr && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#9AA5B4", textTransform: "uppercase", letterSpacing: ".04em" }}>DSCR</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: deal.dscr >= 1.5 ? "#00C9A7" : deal.dscr >= 1.25 ? "#E8A020" : "#E24B4A" }}>{deal.dscr.toFixed(2)}x</div>
                    </div>
                  )}
                </div>

                {/* Last updated */}
                <div style={{ fontSize: 10, color: "#9AA5B4", whiteSpace: "nowrap" }}>{timeAgo(deal.updated_at)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
