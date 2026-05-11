"use client";

import { useState } from "react";

export function TrainingWaitlist({ alreadyJoined }: { alreadyJoined: boolean }) {
  const [joined, setJoined] = useState(alreadyJoined);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (dismissed || joined) return null;

  const handleJoin = async () => {
    setLoading(true);
    const res = await fetch("/api/waitlist", { method: "POST" });
    if (res.ok) setJoined(true);
    setLoading(false);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(175,169,236,0.08) 0%, rgba(91,163,232,0.06) 100%)",
      border: "0.5px solid rgba(175,169,236,0.25)",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>🎓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F2EC", marginBottom: 2 }}>
            Acquisition training program — coming soon
          </div>
          <div style={{ fontSize: 12, color: "#9AA5B4", lineHeight: 1.5 }}>
            Step-by-step training on finding, evaluating, and closing your first business acquisition. Join the waitlist for early access.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            background: "rgba(175,169,236,0.15)",
            color: "#AFA9EC",
            border: "0.5px solid rgba(175,169,236,0.35)",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Joining…" : "Count me in →"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "transparent", border: "none", color: "#9AA5B4", cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1 }}
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
