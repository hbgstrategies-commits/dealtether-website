"use client";

import Link from "next/link";
import { useState } from "react";

const TOOLS = [
  {
    stage: "01",
    beta: true,
    label: "Sourcing",
    desc: "Find acquisition targets by industry and location. Owner info, ratings, and acquisition signals included.",
    href: "/sourcing",
    cta: "Find targets →",
    color: "#E8A020",
    colorBg: "rgba(232,160,32,0.08)",
    colorBd: "rgba(232,160,32,0.2)",
  },
  {
    stage: "02",
    label: "Financial Normalizer",
    desc: "Upload the seller's P&Ls. AI maps every line item, finds add-backs, and shows you the real adjusted SDE.",
    href: "/qoe",
    cta: "Normalize financials →",
    color: "#00C9A7",
    colorBg: "rgba(0,201,167,0.08)",
    colorBd: "rgba(0,201,167,0.18)",
  },
  {
    stage: "03",
    label: "Deal Analyzer",
    desc: "Enter the SDE and get a market-benchmarked offer range, financing model, DSCR, and 5-year IRR.",
    href: "/napkin",
    cta: "Value a deal →",
    color: "#00C9A7",
    colorBg: "rgba(0,201,167,0.08)",
    colorBd: "rgba(0,201,167,0.18)",
  },
  {
    stage: "04",
    label: "Pipeline",
    desc: "Every deal side by side. Compare DSCR, IRR, and offer ranges at a glance. Push the winner to due diligence.",
    href: "/pipeline",
    cta: "Open pipeline →",
    color: "#5BA3E8",
    colorBg: "rgba(91,163,232,0.08)",
    colorBd: "rgba(91,163,232,0.2)",
  },
  {
    stage: "05",
    label: "Deal Workspace",
    desc: "130+ tasks, team access, issue flags, and a weekly report that writes itself. From LOI to close.",
    href: "/dd-demo",
    cta: "Open workspace →",
    color: "#AFA9EC",
    colorBg: "rgba(175,169,236,0.08)",
    colorBd: "rgba(175,169,236,0.2)",
  },
];

function ToolCard({ tool }: { tool: typeof TOOLS[number] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={tool.href} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#1A2F50",
          border: `0.5px solid ${hovered ? tool.colorBd : "#1E3A5F"}`,
          borderRadius: 14,
          padding: "1.25rem",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          transition: "border-color .15s",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: tool.color, background: tool.colorBg, border: `0.5px solid ${tool.colorBd}`, borderRadius: 99, padding: "2px 9px" }}>
            Stage {tool.stage}
          </div>
          {tool.beta && (
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em", color: "#E8A020", background: "rgba(232,160,32,0.08)", border: "0.5px solid rgba(232,160,32,0.2)", borderRadius: 99, padding: "2px 8px" }}>
              Beta
            </div>
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#F5F2EC", letterSpacing: "-.2px" }}>
          {tool.label}
        </div>
        <div style={{ fontSize: 12, color: "#9AA5B4", lineHeight: 1.6, flex: 1 }}>
          {tool.desc}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: tool.color, marginTop: 4 }}>
          {tool.cta}
        </div>
      </div>
    </Link>
  );
}

export function ToolGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: 12 }}>
      {TOOLS.map((tool) => (
        <ToolCard key={tool.href} tool={tool} />
      ))}
    </div>
  );
}
