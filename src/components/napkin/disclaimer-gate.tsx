"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "tether_disclaimer_accepted";

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAccepted(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (accepted === null) return null; // avoid flash before localStorage is read

  if (accepted) return <>{children}</>;

  return (
    <div style={{
      background: "#1A2F50",
      border: "0.5px solid #1E3A5F",
      borderRadius: 14,
      padding: "2rem 2rem",
      maxWidth: 560,
      margin: "0 auto",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#00C9A7", marginBottom: 10 }}>
        Before you begin
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F5F2EC", marginBottom: 12, letterSpacing: "-.3px" }}>
        This tool provides estimates, not advice
      </h2>
      <p style={{ fontSize: 13, color: "#9AA5B4", lineHeight: 1.7, marginBottom: 16 }}>
        Tether&apos;s Deal Analyzer calculates valuation estimates, offer ranges, DSCR, and IRR projections based on the numbers you enter. These are <strong style={{ color: "#F5F2EC" }}>pre-tax estimates for informational purposes only</strong> — not financial, legal, investment, or tax advice.
      </p>
      <p style={{ fontSize: 13, color: "#9AA5B4", lineHeight: 1.7, marginBottom: 20 }}>
        Actual business value and investment outcomes may differ materially from these estimates. SBA loan eligibility is subject to lender approval. <strong style={{ color: "#F5F2EC" }}>You are solely responsible for any acquisition decisions you make.</strong> We strongly recommend consulting a qualified M&amp;A advisor, CPA, and lender before executing any transaction.
      </p>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: 2, accentColor: "#00C9A7", width: 15, height: 15, flexShrink: 0, cursor: "pointer" }}
        />
        <span style={{ fontSize: 13, color: "#F5F2EC", lineHeight: 1.6 }}>
          I understand that Tether is an analytical tool, not a financial advisor, and that I am solely responsible for any acquisition decisions I make.
        </span>
      </label>

      <button
        disabled={!checked}
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setAccepted(true);
        }}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 8,
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: checked ? "pointer" : "default",
          background: checked ? "#00C9A7" : "#1E3A5F",
          color: checked ? "#0A1628" : "#9AA5B4",
          transition: "background .15s, color .15s",
        }}
      >
        I understand — open the Deal Analyzer
      </button>
    </div>
  );
}
