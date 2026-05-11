"use client";

import Link from "next/link";

export function TrialCountdown({ trialEnd }: { trialEnd: string | null }) {
  if (!trialEnd) return null;

  const msLeft = new Date(trialEnd).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));

  if (daysLeft > 30) return null; // active paid sub with future renewal, not a trial

  const urgent = daysLeft <= 5;
  const color = urgent ? "#E8A020" : "#9AA5B4";
  const borderColor = urgent ? "rgba(232,160,32,0.25)" : "#1E3A5F";
  const bg = urgent ? "rgba(232,160,32,0.05)" : "#1A2F50";

  return (
    <div style={{
      background: bg,
      border: `0.5px solid ${borderColor}`,
      borderRadius: 10,
      padding: "10px 16px",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color,
          background: urgent ? "rgba(232,160,32,0.12)" : "rgba(154,165,180,0.1)",
          padding: "2px 8px",
          borderRadius: 20,
          flexShrink: 0,
        }}>
          {daysLeft === 0 ? "Trial ends today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
        </div>
        <div style={{ fontSize: 12, color: "#9AA5B4" }}>
          {daysLeft === 0
            ? "Your free trial ends today. Add a card to keep access."
            : urgent
            ? "Your free trial is almost up — subscribe to keep your deals and analysis."
            : "You're on a free trial. $147/mo after it ends."}
        </div>
      </div>
      <Link
        href="/pricing"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: urgent ? "#E8A020" : "#9AA5B4",
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {urgent ? "Subscribe now →" : "View plan →"}
      </Link>
    </div>
  );
}
