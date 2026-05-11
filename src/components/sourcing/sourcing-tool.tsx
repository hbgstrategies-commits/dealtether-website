"use client";

import { useState, useEffect, useCallback } from "react";

// ── colour tokens (matching legacy CSS variables) ──────────────────────────
const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const NAVY3 = "#2A4A7A";
const TEAL = "#00C9A7";
const TEAL_DIM = "#00A388";
const TEAL_BG = "rgba(0,201,167,0.08)";
const TEAL_BD = "rgba(0,201,167,0.18)";
const WARM = "#F5F2EC";
const MUTED = "#9AA5B4";
const BORDER = "#1E3A5F";
const AMBER = "#E8A020";
const AMBER_BG = "rgba(232,160,32,0.08)";
const DANGER = "#E24B4A";
const BLUE = "#5BA3E8";
const PURPLE = "#AFA9EC";

// suppress unused variable warnings for constants only used in style objects
void NAVY3; void AMBER_BG;

// ── types ──────────────────────────────────────────────────────────────────
type Status = "New" | "Contacted" | "Responded" | "In Diligence" | "Pass";
type Filter = "All" | Status | "Trending up" | "Owner ID'd";

type SResult = {
  name: string;
  city: string;
  distance: string;
  website: string;
  rating: string;
  reviews: string;
  trend: string;
  years: string | number | null;
  revenue: string;
  employees: string;
  owner: string;
  phone: string;
  email: string;
  notes: string;
  status: Status;
};

const STATUS_OPTIONS: Status[] = ["New", "Contacted", "Responded", "In Diligence", "Pass"];
const FILTERS: Filter[] = ["All", "New", "Contacted", "Responded", "In Diligence", "Pass", "Trending up", "Owner ID'd"];

const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  New:           { bg: "rgba(0,201,167,.1)",    color: TEAL,   border: "rgba(0,201,167,.25)" },
  Contacted:     { bg: "rgba(232,160,32,.1)",   color: AMBER,  border: "rgba(232,160,32,.25)" },
  Responded:     { bg: "rgba(91,163,232,.1)",   color: BLUE,   border: "rgba(91,163,232,.25)" },
  "In Diligence":{ bg: "rgba(175,169,236,.1)",  color: PURPLE, border: "rgba(175,169,236,.25)" },
  Pass:          { bg: "rgba(226,75,74,.1)",    color: DANGER, border: "rgba(226,75,74,.25)" },
};

const LOADING_MSGS = [
  "Searching for businesses…",
  "Finding companies and websites…",
  "Researching owner info and contact details…",
  "Analyzing ratings and acquisition signals…",
  "Almost done — compiling results…",
];

const EXAMPLES = ["HVAC", "Roofing", "Landscaping", "Pest control", "Auto repair", "Plumbing"];

// ── helpers ────────────────────────────────────────────────────────────────
function fmtStars(r: string) {
  const n = parseFloat(r) || 0;
  const f = Math.floor(n);
  const h = n - f >= 0.5;
  return "★".repeat(f) + (h ? "½" : "") + "☆".repeat(Math.max(0, 5 - f - (h ? 1 : 0)));
}

function isTrendingUp(r: SResult) {
  return parseFloat(r.trend) > 0;
}
function hasOwner(r: SResult) {
  return r.owner && r.owner !== "—";
}

// ── main component ─────────────────────────────────────────────────────────
export function SourcingTool() {
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("25");
  const [results, setResults] = useState<SResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");

  // cycle loading messages
  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIdx(0);
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => Math.min(i + 1, LOADING_MSGS.length - 1));
    }, 3500);
    return () => clearInterval(id);
  }, [loading]);

  const runSearch = useCallback(async () => {
    if (!industry.trim() || !location.trim()) {
      setError("Please enter both an industry type and a location.");
      return;
    }
    setError(null);
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setFilter("All");

    try {
      const res = await fetch("/api/sourcing/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: industry.trim(), location: location.trim(), radius }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Search failed");
      setResults(data.results ?? []);
    } catch (e) {
      setError((e instanceof Error ? e.message : "Search failed") + ". Please try again.");
    } finally {
      setLoading(false);
    }
  }, [industry, location, radius]);

  function updateStatus(idx: number, val: Status) {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, status: val } : r)));
  }
  function updateNote(idx: number, val: string) {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, notes: val } : r)));
  }

  function exportCSV() {
    const headers = ["#","Company","City","Distance","Website","Rating","Reviews","Trend","Years","Est Revenue","Employees","Owner","Phone","Email","Notes","Status"];
    const rows = results.map((r, i) => [i + 1, r.name, r.city, r.distance, r.website, r.rating, r.reviews, r.trend, r.years ?? "", r.revenue, r.employees, r.owner, r.phone, r.email, r.notes, r.status]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tether_sourcing.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = results.filter((r) => {
    if (filter === "All") return true;
    if (filter === "Trending up") return isTrendingUp(r);
    if (filter === "Owner ID'd") return hasOwner(r);
    return r.status === filter;
  });

  const metrics = {
    total: results.length,
    avgRating: results.length ? (results.reduce((a, b) => a + (parseFloat(b.rating) || 0), 0) / results.length).toFixed(1) : "—",
    trending: results.filter(isTrendingUp).length,
    ownerID: results.filter(hasOwner).length,
    contacted: results.filter((r) => r.status === "Contacted").length,
    pipeline: results.filter((r) => ["Responded", "In Diligence"].includes(r.status)).length,
  };

  const panelBorder: React.CSSProperties = { border: `0.5px solid ${TEAL_BD}` };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: WARM }}>

      {/* ── Search panel ── */}
      <div style={{ background: NAVY2, ...panelBorder, borderRadius: 12, padding: "1rem 1.1rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: MUTED, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".65rem" }}>
          Search parameters
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            placeholder="Industry or business type (e.g. HVAC, roofing, landscaping)"
            style={{ flex: 2, minWidth: 200, background: NAVY3, border: `0.5px solid ${TEAL_BD}`, borderRadius: 8, color: WARM, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            placeholder="City, address, or zip code"
            style={{ flex: 1, minWidth: 140, background: NAVY3, border: `0.5px solid ${TEAL_BD}`, borderRadius: 8, color: WARM, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            style={{ flex: "0 0 auto", minWidth: 130, background: NAVY3, border: `0.5px solid ${TEAL_BD}`, borderRadius: 8, color: WARM, padding: "9px 12px", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="10">10 mile radius</option>
            <option value="25">25 mile radius</option>
            <option value="50">50 mile radius</option>
          </select>
          <button
            onClick={runSearch}
            disabled={loading}
            style={{ background: loading ? BORDER : TEAL, color: loading ? MUTED : NAVY, border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit", transition: "background .15s" }}
          >
            {loading ? "Searching…" : "Run search"}
          </button>
        </div>
        {error && <div style={{ marginTop: ".65rem", fontSize: 12, color: DANGER }}>{error}</div>}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ background: NAVY2, ...panelBorder, borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 22, display: "inline-block", animation: "spin 1.1s linear infinite" }}>⟳</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
          <div style={{ fontSize: 14, color: WARM, margin: "10px 0 5px" }}>{LOADING_MSGS[loadingMsgIdx]}</div>
          <div style={{ fontSize: 12, color: MUTED }}>Researching companies, websites, and owner info via web search</div>
        </div>
      )}

      {/* ── Pre-search ── */}
      {!loading && !hasSearched && (
        <div style={{ background: NAVY2, ...panelBorder, borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: ".85rem" }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: ".5rem" }}>Find your next acquisition target</div>
          <div style={{ fontSize: 13, color: MUTED, maxWidth: 420, margin: "0 auto 1.1rem", lineHeight: 1.6 }}>
            Enter an industry type and location. The tool will research up to 15 real businesses — owner info, contact details, ratings, and acquisition signals included.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setIndustry(ex)}
                style={{ fontSize: 11, padding: "5px 13px", borderRadius: 20, border: `0.5px solid ${TEAL_BD}`, background: "transparent", color: MUTED, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && hasSearched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: MUTED, fontSize: 14 }}>
          No results found. Try a broader search or different location.
        </div>
      )}

      {/* ── Results ── */}
      {!loading && results.length > 0 && (
        <>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 8, marginBottom: "1rem" }}>
            {[
              { label: "Results",     value: metrics.total,      color: TEAL },
              { label: "Avg rating",  value: metrics.avgRating,  color: WARM },
              { label: "Trending up", value: metrics.trending,   color: TEAL },
              { label: "Owner ID'd",  value: metrics.ownerID,    color: WARM },
              { label: "Contacted",   value: metrics.contacted,  color: AMBER },
              { label: "In pipeline", value: metrics.pipeline,   color: TEAL },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: NAVY2, ...panelBorder, borderRadius: 10, padding: ".75rem .9rem" }}>
                <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 21, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: ".85rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: MUTED }}>Filter:</span>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 11, padding: "4px 11px", borderRadius: 20, cursor: "pointer",
                  border: `0.5px solid ${filter === f ? "rgba(0,201,167,.35)" : TEAL_BD}`,
                  background: filter === f ? TEAL_BG : "transparent",
                  color: filter === f ? TEAL : MUTED,
                  fontFamily: "inherit", transition: "all .15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ borderRadius: 10, border: `0.5px solid ${TEAL_BD}`, overflowX: "auto", marginBottom: ".85rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: NAVY2 }}>
                  {["#","Company","Website","Rating","Trend","Yrs in biz","Est. revenue","Employees","Owner","Phone","Email","Notes","Status"].map((h) => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 500, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", padding: "8px 10px", borderBottom: `0.5px solid ${TEAL_BD}`, textAlign: "left", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const ri = results.indexOf(r);
                  const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.New;
                  const trendVal = parseFloat(r.trend);
                  const trendEl = isNaN(trendVal) || r.trend === "flat"
                    ? <span style={{ color: MUTED, fontSize: 11 }}>→ flat</span>
                    : trendVal > 0
                      ? <span style={{ color: TEAL, fontSize: 11, fontWeight: 500 }}>▲ +{trendVal.toFixed(1)}</span>
                      : <span style={{ color: DANGER, fontSize: 11, fontWeight: 500 }}>▼ {trendVal.toFixed(1)}</span>;

                  return (
                    <tr key={ri} style={{ borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
                      <td style={{ padding: "8px 10px", color: MUTED, fontSize: 11 }}>{ri + 1}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ fontWeight: 500, color: WARM, fontSize: 12 }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{r.city} · {r.distance}</div>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        {r.website && r.website !== "—" ? (
                          <a href={r.website.startsWith("http") ? r.website : "https://" + r.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: TEAL, textDecoration: "none" }}>
                            {r.website.replace(/^https?:\/\//, "").split("/")[0]}
                          </a>
                        ) : <span style={{ color: MUTED, fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ color: AMBER, fontSize: 11, letterSpacing: ".5px" }}>{fmtStars(r.rating)}</div>
                        <div style={{ fontSize: 10, color: MUTED }}>{r.rating} · {r.reviews} reviews</div>
                      </td>
                      <td style={{ padding: "8px 10px" }}>{trendEl}</td>
                      <td style={{ padding: "8px 10px", color: MUTED, fontSize: 11 }}>{r.years ? `${r.years} yrs` : "—"}</td>
                      <td style={{ padding: "8px 10px", color: MUTED, fontSize: 11, whiteSpace: "nowrap" }}>{r.revenue || "—"}</td>
                      <td style={{ padding: "8px 10px", color: MUTED, fontSize: 11 }}>{r.employees || "—"}</td>
                      <td style={{ padding: "8px 10px", color: WARM, fontSize: 11 }}>{r.owner || "—"}</td>
                      <td style={{ padding: "8px 10px", color: MUTED, fontSize: 11, whiteSpace: "nowrap" }}>{r.phone || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {r.email && r.email !== "—" ? (
                          <a href={`mailto:${r.email}`} style={{ fontSize: 11, color: TEAL, textDecoration: "none" }}>
                            {r.email.length > 20 ? r.email.slice(0, 18) + "…" : r.email}
                          </a>
                        ) : <span style={{ color: MUTED, fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "8px 10px", minWidth: 150 }}>
                        <input
                          defaultValue={r.notes}
                          onBlur={(e) => updateNote(ri, e.target.value)}
                          placeholder="Add note…"
                          style={{ background: "transparent", border: "none", color: MUTED, fontSize: 11, fontStyle: "italic", width: "100%", outline: "none", cursor: "text", fontFamily: "inherit" }}
                        />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(ri, e.target.value as Status)}
                          style={{
                            borderRadius: 20, fontSize: 10, padding: "2px 8px", fontWeight: 500,
                            cursor: "pointer", outline: "none", appearance: "none", textAlign: "center",
                            fontFamily: "inherit", border: `0.5px solid ${st.border}`,
                            background: st.bg, color: st.color,
                          }}
                        >
                          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, color: MUTED }}>
              Showing {filtered.length} of {results.length} · {industry} near {location} · {radius} mi radius
            </div>
            <button
              onClick={exportCSV}
              style={{ background: "transparent", color: MUTED, border: `0.5px solid ${TEAL_BD}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
            >
              Export CSV
            </button>
          </div>

          {/* CTA */}
          <div style={{ background: TEAL_BG, border: `0.5px solid ${TEAL_BD}`, borderRadius: 10, padding: "1rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>Ready to run due diligence on a target?</div>
              <div style={{ fontSize: 11, color: MUTED }}>Tether gives you a full DD workspace — 130+ tasks, issue flags, weekly reports, and your whole team in one place.</div>
            </div>
            <a
              href="/dd-demo"
              style={{ background: TEAL, color: NAVY, border: "none", borderRadius: 7, padding: "9px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none", transition: "background .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = TEAL_DIM)}
              onMouseLeave={(e) => (e.currentTarget.style.background = TEAL)}
            >
              Open Deal Workspace
            </a>
          </div>
        </>
      )}
    </div>
  );
}
