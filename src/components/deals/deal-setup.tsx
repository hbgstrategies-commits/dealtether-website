"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Colors ────────────────────────────────────────────────────────────────────
const TEAL = "#00C9A7";
const TEAL_DIM = "#00A388";
const TEAL_BG = "rgba(0,201,167,0.08)";
const TEAL_BD = "rgba(0,201,167,0.22)";
const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const WARM = "#F5F2EC";
const MUTED = "#8A97AA";
const BORDER2 = "#243E65";
const DANGER = "#E24B4A";
const CARD = "#141F35";

// ── Data ──────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { type: "general", icon: "🏢", name: "General Business", desc: "Service businesses, B2B, retail, professional services, home services, and most non-PM acquisitions.", badge: "130+ tasks · general template", url: "/dd-demo" },
  { type: "property-management", icon: "🏘️", name: "Property Management", desc: "Residential or commercial PM companies, HOA management, or any real estate operations business.", badge: "110+ tasks · PM template", url: "/dd-pm" },
  { type: "ecommerce", icon: "🛒", name: "E-Commerce / DTC", desc: "Online retail, Shopify stores, Amazon FBA, subscription boxes, and direct-to-consumer brands.", badge: "General template + ecomm tasks", url: "/dd-demo" },
  { type: "franchise", icon: "🔑", name: "Franchise Resale", desc: "Buying an existing franchise unit. Includes FDD review, franchisor approval, and transfer tasks.", badge: "General template + franchise tasks", url: "/dd-demo" },
  { type: "saas", icon: "💻", name: "SaaS / Tech", desc: "Software companies, SaaS products, apps, and technology-enabled service businesses.", badge: "General template + tech tasks", url: "/dd-demo" },
  { type: "other", icon: "⚙️", name: "Other / Not Sure", desc: "Start with the general template — you can customize your task list from inside the workspace.", badge: "General template · fully editable", url: "/dd-demo" },
] as const;

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  Buyer: { bg: "#E6F1FB", color: "#0C447C" },
  Advisor: { bg: "#FAEEDA", color: "#633806" },
  Lawyer: { bg: "#FAECE7", color: "#712B13" },
  Bank: { bg: "#EEF8FF", color: "#0B4F7A" },
  CPA: { bg: "#F0F9E8", color: "#2A5C0A" },
  "Ops Expert": { bg: "#E1F5EE", color: "#085041" },
  "Deal Team": { bg: "#F3EEF9", color: "#4A1875" },
  "Buyer Staff": { bg: "#EEF0FE", color: "#2A3AB8" },
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Participant = { name: string; email: string; role: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}
function fmtDate(s: string): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(n: number): string {
  if (!n) return "—";
  return "$" + n.toLocaleString();
}
const today = new Date();
const DEFAULT_LOI = toDateStr(today);
const DEFAULT_DD = toDateStr(new Date(today.getTime() + 30 * 86400000));
const DEFAULT_CLOSE = toDateStr(new Date(today.getTime() + 90 * 86400000));

// ── Component ─────────────────────────────────────────────────────────────────
export function DealSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [bizName, setBizName] = useState("");
  const [askPrice, setAskPrice] = useState("");
  const [sde, setSde] = useState("");
  const [loiDate, setLoiDate] = useState(DEFAULT_LOI);
  const [ddDate, setDdDate] = useState(DEFAULT_DD);
  const [closeDate, setCloseDate] = useState(DEFAULT_CLOSE);
  const [dealStage, setDealStage] = useState("loi");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  // Step 2
  const [industry, setIndustry] = useState("");

  // Step 3
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pRole, setPRole] = useState("Advisor");

  // Step 4
  const [reportDay, setReportDay] = useState("Thursday");
  const [reportTime, setReportTime] = useState("8:00 AM");

  // UI state
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const goToStep = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs: Record<string, boolean> = {};
    if (!bizName.trim()) errs.bizName = true;
    if (!loiDate) errs.loiDate = true;
    if (!buyerName.trim()) errs.buyerName = true;
    if (!buyerEmail.trim() || !buyerEmail.includes("@")) errs.buyerEmail = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const validateStep2 = () => {
    if (!industry) { setErrors({ industry: true }); return false; }
    setErrors({});
    return true;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const advanceStep1 = () => {
    if (!validateStep1()) return;
    // Sync buyer into participants
    setParticipants((prev) => {
      const existing = prev.find((p) => p.role === "Buyer");
      if (existing) return prev.map((p) => p.role === "Buyer" ? { ...p, name: buyerName, email: buyerEmail } : p);
      return [{ name: buyerName, email: buyerEmail, role: "Buyer" }, ...prev];
    });
    goToStep(2);
  };
  const advanceStep2 = () => { if (!validateStep2()) return; goToStep(3); };

  // ── Participants ────────────────────────────────────────────────────────────
  const addParticipant = () => {
    if (!pName.trim() || !pEmail.trim()) { showToast("Enter name and email"); return; }
    if (!pEmail.includes("@")) { showToast("Enter a valid email"); return; }
    setParticipants((prev) => [...prev, { name: pName, email: pEmail, role: pRole }]);
    setPName(""); setPEmail(""); setPRole("Advisor");
    showToast(pName + " added to the deal");
  };
  const removeParticipant = (i: number) => {
    if (participants[i].role === "Buyer") return;
    setParticipants((prev) => prev.filter((_, j) => j !== i));
  };

  // ── Copy link ───────────────────────────────────────────────────────────────
  const copyLink = async (link: string, idx: number) => {
    try { await navigator.clipboard.writeText(link); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = link; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // ── Launch ──────────────────────────────────────────────────────────────────
  const launchWorkspace = () => {
    const ind = INDUSTRIES.find((i) => i.type === industry);
    router.push((ind?.url || "/dd-demo") + "?deal=" + encodeURIComponent(bizName) + "&buyer=" + encodeURIComponent(buyerName));
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const progressPct = [25, 50, 75, 100, 100][step - 1] ?? 25;
  const progressLabels = ["Step 1 of 4 — Deal basics", "Step 2 of 4 — Industry type", "Step 3 of 4 — Your team", "Step 4 of 4 — Report schedule", "Your deal is ready"];
  const nonBuyers = participants.filter((p) => p.role !== "Buyer");
  const indObj = INDUSTRIES.find((i) => i.type === industry);

  // ── Shared styles ───────────────────────────────────────────────────────────
  const inp: React.CSSProperties = { width: "100%", fontSize: 14, padding: "10px 14px", borderRadius: 9, border: `.5px solid ${BORDER2}`, background: CARD, color: WARM, outline: "none", fontFamily: "inherit" };
  const inpErr: React.CSSProperties = { ...inp, borderColor: DANGER };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: MUTED, marginBottom: 5 };
  const fieldStyle: React.CSSProperties = { marginBottom: "1.25rem" };
  const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: TEAL, marginBottom: ".5rem" };
  const h2Style: React.CSSProperties = { fontSize: 28, fontWeight: 700, letterSpacing: "-.5px", color: WARM, marginBottom: ".5rem", lineHeight: 1.2 };
  const subStyle: React.CSSProperties = { fontSize: 14, color: MUTED, marginBottom: "2rem", lineHeight: 1.6 };
  const btnPrimary: React.CSSProperties = { flex: 1, padding: "13px 24px", borderRadius: 10, background: TEAL, color: NAVY, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: "-.1px" };
  const btnSecondary: React.CSSProperties = { padding: "13px 20px", borderRadius: 10, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, fontSize: 14, cursor: "pointer" };
  const btnRow: React.CSSProperties = { display: "flex", gap: 10, marginTop: "2rem" };
  const errMsg: React.CSSProperties = { fontSize: 11, color: DANGER, marginTop: 4 };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: WARM, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Toast */}
      <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", background: TEAL, color: NAVY, fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 99, opacity: toastVisible ? 1 : 0, transition: "opacity .3s", pointerEvents: "none", zIndex: 999 }}>
        {toastMsg}
      </div>

      {/* Progress bar */}
      <div style={{ padding: "1.5rem 2rem 0", opacity: step === 5 ? 0.4 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".6rem" }}>
          <span style={{ fontSize: 12, color: MUTED }}>{progressLabels[step - 1]}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 32, height: 3, borderRadius: 99, background: i < step ? TEAL : i === step ? "rgba(0,201,167,0.5)" : BORDER2, transition: "background .4s" }} />
            ))}
          </div>
        </div>
        <div style={{ height: 2, background: BORDER2, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${TEAL},#00E5C4)`, width: progressPct + "%", transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>

        {/* ── STEP 1: DEAL BASICS ──────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={eyebrow}>Step 1 of 4</div>
            <h2 style={h2Style}>Tell us about the deal</h2>
            <p style={subStyle}>This creates your workspace. You can edit any of these details later from inside your DD workspace.</p>

            <div style={fieldStyle}>
              <label style={labelStyle}>Business name <span style={{ color: TEAL }}>*</span></label>
              <input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="e.g. Apex Property Services" style={errors.bizName ? inpErr : inp} />
              {errors.bizName && <div style={errMsg}>Business name is required</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Asking price</label>
                <input type="number" value={askPrice} onChange={(e) => setAskPrice(e.target.value)} placeholder="e.g. 850000" style={inp} />
              </div>
              <div>
                <label style={labelStyle}>SDE / Annual earnings</label>
                <input type="number" value={sde} onChange={(e) => setSde(e.target.value)} placeholder="e.g. 220000" style={inp} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
              <div>
                <label style={labelStyle}>LOI signed date <span style={{ color: TEAL }}>*</span></label>
                <input type="date" value={loiDate} onChange={(e) => setLoiDate(e.target.value)} style={errors.loiDate ? inpErr : inp} />
                {errors.loiDate && <div style={errMsg}>LOI date is required</div>}
              </div>
              <div>
                <label style={labelStyle}>DD deadline</label>
                <input type="date" value={ddDate} onChange={(e) => setDdDate(e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Target close date</label>
                <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={labelStyle}>Deal stage</label>
                <select value={dealStage} onChange={(e) => setDealStage(e.target.value)} style={inp}>
                  <option value="loi">LOI signed — in diligence</option>
                  <option value="pre-loi">Pre-LOI — evaluating</option>
                  <option value="under-contract">Under contract</option>
                  <option value="closing">Closing soon</option>
                </select>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Your name <span style={{ color: TEAL }}>*</span></label>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Your full name" style={errors.buyerName ? inpErr : inp} />
              {errors.buyerName && <div style={errMsg}>Your name is required</div>}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Your email <span style={{ color: TEAL }}>*</span></label>
              <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="you@example.com" style={errors.buyerEmail ? inpErr : inp} />
              {errors.buyerEmail && <div style={errMsg}>Valid email is required</div>}
            </div>

            <div style={btnRow}>
              <button onClick={advanceStep1} style={btnPrimary}>Continue — Industry type →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: INDUSTRY ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={eyebrow}>Step 2 of 4</div>
            <h2 style={h2Style}>What type of business is this?</h2>
            <p style={subStyle}>This loads the right due diligence task list for your deal. Every industry has different risks — your workspace will reflect that.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
              {INDUSTRIES.map((ind) => (
                <div key={ind.type} onClick={() => { setIndustry(ind.type); setErrors({}); }}
                  style={{ padding: "1rem 1.1rem", borderRadius: 10, border: `.5px solid ${industry === ind.type ? TEAL : BORDER2}`, background: industry === ind.type ? TEAL_BG : CARD, cursor: "pointer", transition: "all .15s", position: "relative" }}>
                  {industry === ind.type && <span style={{ position: "absolute", top: 10, right: 12, fontSize: 12, fontWeight: 700, color: TEAL }}>✓</span>}
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{ind.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: WARM, marginBottom: 3 }}>{ind.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{ind.desc}</div>
                  <div style={{ display: "inline-block", fontSize: 10, padding: "2px 7px", borderRadius: 99, background: TEAL_BG, color: TEAL, border: `.5px solid ${TEAL_BD}`, marginTop: 5 }}>{ind.badge}</div>
                </div>
              ))}
            </div>
            {errors.industry && <div style={{ ...errMsg, marginBottom: "1rem" }}>Please select an industry type</div>}

            <div style={btnRow}>
              <button onClick={() => goToStep(1)} style={btnSecondary}>← Back</button>
              <button onClick={advanceStep2} style={btnPrimary}>Continue — Build your team →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: TEAM ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={eyebrow}>Step 3 of 4</div>
            <h2 style={h2Style}>Who&apos;s on this deal?</h2>
            <p style={subStyle}>Add your attorney, advisor, CPA, and anyone else involved. They&apos;ll get a magic link — no account needed. You can skip this and invite people from inside the workspace.</p>

            {/* Participant list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1rem" }}>
              {participants.map((p, i) => {
                const rs = ROLE_STYLES[p.role] ?? ROLE_STYLES.Buyer;
                const isBuyer = p.role === "Buyer";
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center", padding: "10px 12px", borderRadius: 9, background: CARD, border: `.5px solid ${BORDER2}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: WARM }}>
                        {p.name}{isBuyer && <span style={{ fontSize: 10, color: TEAL }}> · you</span>}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED }}>{p.email}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 500, background: rs.bg, color: rs.color, display: "inline-block", whiteSpace: "nowrap" }}>{p.role}</span>
                    {isBuyer
                      ? <div style={{ width: 28 }} />
                      : <button onClick={() => removeParticipant(i)} style={{ width: 28, height: 28, borderRadius: 6, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, cursor: "pointer", fontSize: 14 }}>×</button>}
                  </div>
                );
              })}
            </div>

            {/* Add form */}
            <div style={{ background: CARD, border: `.5px solid ${BORDER2}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: WARM, marginBottom: ".75rem" }}>Add a participant</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ".75rem" }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Sarah Johnson" style={inp} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="sarah@example.com" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: ".75rem" }}>
                <label style={labelStyle}>Role on this deal</label>
                <select value={pRole} onChange={(e) => setPRole(e.target.value)} style={inp}>
                  {["Advisor", "Lawyer", "Bank", "CPA", "Ops Expert", "Deal Team", "Buyer Staff"].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addParticipant} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "none", background: TEAL, color: NAVY, fontWeight: 600, cursor: "pointer" }}>Add to deal</button>
                <button onClick={() => { setPName(""); setPEmail(""); setPRole("Advisor"); }} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: `.5px solid ${BORDER2}`, background: "transparent", color: MUTED, cursor: "pointer" }}>Clear</button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>Not sure yet? Skip for now — invite from your workspace anytime.</div>

            <div style={btnRow}>
              <button onClick={() => goToStep(2)} style={btnSecondary}>← Back</button>
              <button onClick={() => goToStep(4)} style={btnPrimary}>Continue — Report schedule →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: REPORT SCHEDULE ──────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <div style={eyebrow}>Step 4 of 4</div>
            <h2 style={h2Style}>When should we send your weekly report?</h2>
            <p style={subStyle}>Every week Tether sends a progress report to your entire team — flagged issues, completed tasks, and what&apos;s coming due. Set when it goes out.</p>

            <div style={fieldStyle}>
              <label style={labelStyle}>Day of the week</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                  <div key={day} onClick={() => setReportDay(day)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `.5px solid ${reportDay === day ? TEAL_BD : BORDER2}`, background: reportDay === day ? TEAL_BG : CARD, cursor: "pointer", fontSize: 13, color: reportDay === day ? TEAL : MUTED, fontWeight: reportDay === day ? 500 : 400, transition: "all .15s" }}>
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Time</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={reportTime} onChange={(e) => setReportTime(e.target.value)} style={{ ...inp, width: 160 }}>
                  {["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "12:00 PM"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <span style={{ fontSize: 12, color: MUTED }}>in your local timezone</span>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Report recipients</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", borderRadius: 9, background: CARD, border: `.5px solid ${BORDER2}`, minHeight: 42 }}>
                {participants.map((p, i) => (
                  <span key={i} style={{ padding: "3px 9px", borderRadius: 99, background: NAVY2, border: `.5px solid ${BORDER2}`, color: WARM, fontSize: 12 }}>{p.name}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>All participants added to the deal will receive the weekly report automatically.</div>
            </div>

            <div style={btnRow}>
              <button onClick={() => goToStep(3)} style={btnSecondary}>← Back</button>
              <button onClick={() => goToStep(5)} style={btnPrimary}>Review &amp; launch workspace →</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: SUMMARY + LAUNCH ─────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <div style={eyebrow}>Your deal is ready</div>
            <h2 style={h2Style}>{bizName}</h2>
            <p style={subStyle}>Review your setup below. Everything can be edited from inside your workspace.</p>

            {/* Success banner */}
            <div style={{ background: TEAL_BG, border: `.5px solid ${TEAL_BD}`, borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>✓</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEAL, marginBottom: 3 }}>Workspace created successfully</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                  {indObj?.name ?? "General Business"} template loaded ·{" "}
                  {nonBuyers.length > 0 ? `${nonBuyers.length} team member${nonBuyers.length > 1 ? "s" : ""} will receive magic links · ` : "No team members added yet · "}
                  Weekly reports every {reportDay} at {reportTime}.
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div style={{ background: CARD, border: `.5px solid ${BORDER2}`, borderRadius: 12, overflow: "hidden", marginBottom: "1rem" }}>
              {/* Deal details */}
              <div style={{ padding: "1rem 1.25rem", borderBottom: `.5px solid ${BORDER2}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: MUTED, marginBottom: ".75rem" }}>Deal details</div>
                {([
                  ["Business", bizName],
                  ["Asking price", fmtMoney(Number(askPrice))],
                  ["SDE", fmtMoney(Number(sde))],
                  ["LOI signed", fmtDate(loiDate)],
                  ["DD deadline", fmtDate(ddDate)],
                  ["Target close", fmtDate(closeDate)],
                  ["Industry type", indObj?.name ?? "—"],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem", fontSize: 13 }}>
                    <span style={{ color: MUTED }}>{k}</span>
                    <span style={{ color: WARM, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Team */}
              <div style={{ padding: "1rem 1.25rem", borderBottom: `.5px solid ${BORDER2}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: MUTED, marginBottom: ".75rem" }}>Deal team</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {participants.map((p, i) => {
                    const rs = ROLE_STYLES[p.role] ?? ROLE_STYLES.Buyer;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: NAVY2, border: `.5px solid ${BORDER2}`, fontSize: 12 }}>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: rs.bg, color: rs.color, fontWeight: 500 }}>{p.role}</span>
                        <span style={{ color: WARM }}>{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Report */}
              <div style={{ padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: MUTED, marginBottom: ".75rem" }}>Weekly report</div>
                {([
                  ["Sends every", reportDay],
                  ["Time", reportTime],
                  ["Recipients", `${participants.length} participant${participants.length !== 1 ? "s" : ""}`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem", fontSize: 13 }}>
                    <span style={{ color: MUTED }}>{k}</span>
                    <span style={{ color: WARM, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Magic links */}
            {nonBuyers.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: WARM, marginBottom: ".5rem" }}>Magic links for your team</div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: ".75rem" }}>Each participant gets their own link — no login required. Copy and send individually.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {nonBuyers.map((p, i) => {
                    const ini = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const rs = ROLE_STYLES[p.role] ?? ROLE_STYLES.Buyer;
                    const link = "https://dealtether.com" + (indObj?.url ?? "/dd-demo") + "?deal=" + encodeURIComponent(bizName) + "&participant=" + encodeURIComponent(p.name) + "&role=" + encodeURIComponent(p.role);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: CARD, border: `.5px solid ${BORDER2}` }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: rs.bg, color: rs.color }}>{ini}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: WARM, marginBottom: 2 }}>
                            {p.name}{" "}
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: rs.bg, color: rs.color, fontWeight: 500 }}>{p.role}</span>
                          </div>
                          <div style={{ fontSize: 11, color: TEAL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link}</div>
                        </div>
                        <button onClick={() => copyLink(link, i)}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `.5px solid ${copiedIdx === i ? TEAL : BORDER2}`, background: copiedIdx === i ? TEAL_BG : "transparent", color: copiedIdx === i ? TEAL : MUTED, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>
                          {copiedIdx === i ? "Copied!" : "Copy link"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Launch */}
            <button onClick={launchWorkspace}
              style={{ width: "100%", padding: 15, borderRadius: 11, background: TEAL, color: NAVY, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5L8 1z" stroke="#0A1628" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              Launch my DD workspace
            </button>
            <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: ".75rem" }}>
              You&apos;ll be taken to your workspace immediately. Bookmark it — it&apos;s your deal&apos;s home base.
            </div>
          </div>
        )}

      </div>

      {/* Suppress unused var warning */}
      {void TEAL_DIM}
    </div>
  );
}
