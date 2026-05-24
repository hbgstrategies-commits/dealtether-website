"use client";

import { useState, useCallback, useRef } from "react";

const NAVY = "#0A1628";
const NAVY2 = "#1A2F50";
const TEAL = "#00C9A7";
const WARM = "#F5F2EC";
const MUTED = "#9AA5B4";
const BORDER = "#1E3A5F";
const TEAL_BG = "rgba(0,201,167,0.08)";
const TEAL_BD = "rgba(0,201,167,0.22)";
const AMBER = "#E8A020";

type Q = Record<string, string>;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  border: `1px solid ${BORDER}`,
  borderRadius: 7,
  background: NAVY,
  color: WARM,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: MUTED,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 5,
};

const sectionStyle: React.CSSProperties = {
  padding: "20px 24px",
  background: NAVY2,
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  marginBottom: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: WARM,
  marginBottom: 16,
  paddingBottom: 10,
  borderBottom: `1px solid ${BORDER}`,
  letterSpacing: ".02em",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px 20px",
};

function Field({
  label, name, value, onChange, type = "text", placeholder = "", hint = "", full = false,
}: {
  label: string; name: string; value: string; onChange: (name: string, val: string) => void;
  type?: string; placeholder?: string; hint?: string; full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label style={labelStyle}>{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
      {hint && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function SelectField({
  label, name, value, onChange, options, full = false,
}: {
  label: string; name: string; value: string; onChange: (name: string, val: string) => void;
  options: string[]; full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        <option value="">— select —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function PMQuestionnaire({
  data,
  onSave,
  saving,
}: {
  data: Q;
  onSave: (q: Q) => void;
  saving: boolean;
}) {
  const [q, setQ] = useState<Q>(data);
  const [dirty, setDirty] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback((name: string, val: string) => {
    setQ((prev) => ({ ...prev, [name]: val }));
    setDirty(true);
  }, []);

  const v = (key: string) => q[key] ?? "";

  const handleSave = () => {
    onSave(q);
    setDirty(false);
  };

  const handleUpload = async (file: File) => {
    setParsing(true);
    setParseError(null);
    setParsedCount(null);
    try {
      let content: string;
      if (file.type === "application/pdf") {
        content = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
      } else {
        content = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsText(file);
        });
      }

      const resp = await fetch("/api/pm/parse-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type, content }),
      });
      const data = await resp.json() as { fields?: Q; error?: string };
      if (data.error) throw new Error(data.error);

      const fields = data.fields ?? {};
      // Merge extracted fields — only overwrite fields that have a real value
      const filled = Object.entries(fields).filter(([, v]) => v !== "" && v !== null && v !== undefined);
      setQ((prev) => {
        const next = { ...prev };
        for (const [k, v] of filled) next[k] = String(v);
        return next;
      });
      setDirty(true);
      setParsedCount(filled.length);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Upload failed");
    }
    setParsing(false);
  };

  return (
    <div>
      {/* Auto-fill from uploaded form */}
      <div style={{ padding: "16px 20px", background: TEAL_BG, border: `1px solid ${TEAL_BD}`, borderRadius: 10, marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: WARM, marginBottom: 2 }}>Auto-fill from seller&apos;s form</div>
          <div style={{ fontSize: 12, color: MUTED }}>Upload the completed questionnaire PDF — AI will read it and fill in the fields automatically.</div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: parsing ? "rgba(0,201,167,0.3)" : TEAL, color: NAVY, cursor: parsing ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const, flexShrink: 0 }}
        >
          {parsing ? "Reading form…" : "Upload filled form"}
        </button>

        {parsedCount !== null && !parsing && (
          <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            ✓ {parsedCount} fields filled in
          </div>
        )}
        {parseError && (
          <div style={{ fontSize: 12, color: AMBER }}>{parseError}</div>
        )}
      </div>

      {/* General Information */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>General Information</div>
        <div style={gridStyle}>
          <Field label="Legal Business Name" name="businessName" value={v("businessName")} onChange={set} placeholder="Sunshine Property Management LLC" full />
          <Field label="Doing Business As (DBA)" name="dba" value={v("dba")} onChange={set} placeholder="Sunshine PM" />
          <Field label="Business Website" name="website" value={v("website")} onChange={set} type="url" placeholder="https://sunshinepm.com" />
          <Field label="City, State" name="city" value={v("city")} onChange={set} placeholder="Phoenix, AZ" />
          <Field label="Years in Business" name="yearsInBusiness" value={v("yearsInBusiness")} onChange={set} type="number" placeholder="12" />
          <SelectField label="Target Exit Timeline" name="exitTimeline" value={v("exitTimeline")} onChange={set} options={["ASAP (0–6 months)", "Within 1 year", "1–2 years", "2–5 years", "Just exploring"]} />
          <Field label="Owner(s) Name(s)" name="ownerNames" value={v("ownerNames")} onChange={set} placeholder="John Smith, Jane Doe" />
          <Field label="Owner Annual Salary / Draw ($)" name="ownerSalary" value={v("ownerSalary")} onChange={set} type="number" placeholder="120000" />
          <Field label="Competitive Edge" name="competitiveEdge" value={v("competitiveEdge")} onChange={set} type="textarea" placeholder="What makes this business stand out in its market?" full />
          <Field label="What does the owner plan to do after the sale?" name="postSalePlans" value={v("postSalePlans")} onChange={set} type="textarea" placeholder="Retire, start another venture, etc." full />
        </div>
      </div>

      {/* Portfolio Software */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Portfolio Software</div>
        <div style={gridStyle}>
          <SelectField label="Property Management Software" name="pmSoftware" value={v("pmSoftware")} onChange={set}
            options={["AppFolio", "Buildium", "Rent Manager", "Propertyware", "Yardi", "RealPage", "DoorLoop", "Hemlane", "TenantCloud", "Other"]} />
          {v("pmSoftware") === "Other" && (
            <Field label="Other Software Name" name="pmSoftwareOther" value={v("pmSoftwareOther")} onChange={set} placeholder="Software name" />
          )}
          <Field label="Accounting Software" name="accountingSoftware" value={v("accountingSoftware")} onChange={set} placeholder="QuickBooks, Xero, etc." />
        </div>
      </div>

      {/* Portfolio Overview */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Portfolio Overview</div>
        <div style={gridStyle}>
          <Field label="Residential Single-Family Doors (#)" name="doors" value={v("doors")} onChange={set} type="number" placeholder="350" />
          <Field label="HOA Contracts (#)" name="hoaContracts" value={v("hoaContracts")} onChange={set} type="number" placeholder="4" />
          <Field label="HOA Units Total (#)" name="hoaUnits" value={v("hoaUnits")} onChange={set} type="number" placeholder="640" />
          <Field label="Short-Term Rental (STR) Properties (#)" name="strProperties" value={v("strProperties")} onChange={set} type="number" placeholder="0" />
          <Field label="Commercial Buildings (#)" name="commercialBuildings" value={v("commercialBuildings")} onChange={set} type="number" placeholder="0" />
          <Field label="Multi-Family Units (#)" name="multiFamilyUnits" value={v("multiFamilyUnits")} onChange={set} type="number" placeholder="0" />
          <Field label="Average Management Fee (%)" name="mgmtFee" value={v("mgmtFee")} onChange={set} type="number" placeholder="10" hint="Typical residential management fee percentage" />
          <Field label="Owner-Managed Properties (#)" name="ownerManagedProps" value={v("ownerManagedProps")} onChange={set} type="number" placeholder="0" hint="Properties the owner manages personally" />
          <Field label="Total Number of Clients" name="totalClients" value={v("totalClients")} onChange={set} type="number" placeholder="310" />
          <Field label="Top 3 Clients (name, units, % of revenue)" name="topClients" value={v("topClients")} onChange={set} type="textarea"
            placeholder="1. HOA Name — 200 units — 18% of revenue&#10;2. Client B — 45 doors — 8% of revenue&#10;3. Client C — 30 doors — 5% of revenue" full />
        </div>
      </div>

      {/* Team & Organization */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Team & Organization</div>
        <div style={gridStyle}>
          <Field label="Owner's Primary Responsibilities" name="ownerResponsibilities" value={v("ownerResponsibilities")} onChange={set} type="textarea"
            placeholder="Leasing, maintenance oversight, client relations..." full />
          <Field label="Hours/Week Owner Works" name="ownerHours" value={v("ownerHours")} onChange={set} type="number" placeholder="45" />
          <Field label="Total Team Members (#)" name="teamCount" value={v("teamCount")} onChange={set} type="number" placeholder="6" />
          <SelectField label="Dedicated Call Handler?" name="hasCallHandler" value={v("hasCallHandler")} onChange={set} options={["Yes", "No", "Part-time"]} />
          <SelectField label="Dedicated Salesperson / BDM?" name="hasSalesPerson" value={v("hasSalesPerson")} onChange={set} options={["Yes", "No", "Owner handles sales"]} />
          <Field label="Key Team Members (role, years with company)" name="keyStaff" value={v("keyStaff")} onChange={set} type="textarea"
            placeholder="Property Manager — 5 years&#10;Maintenance Coordinator — 3 years" full />
          <Field label="Additional Notes on Organization / Operations" name="orgNotes" value={v("orgNotes")} onChange={set} type="textarea"
            placeholder="SOP documentation, training materials, systems in place..." full />
        </div>
      </div>

      {/* Financials Context */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Financial Context</div>
        <div style={gridStyle}>
          <Field label="Asking Price (if known)" name="askPrice" value={v("askPrice")} onChange={set} type="number" placeholder="850000" />
          <Field label="Reason for Selling" name="reasonForSelling" value={v("reasonForSelling")} onChange={set} placeholder="Retirement, lifestyle change, partnership split…" />
          <Field label="Documents Provided" name="documentsProvided" value={v("documentsProvided")} onChange={set} type="textarea"
            placeholder="✓ Rent Roll&#10;✓ P&L 2022, 2023, 2024&#10;✗ YTD 2025&#10;✗ Sample Management Agreement" full />
          <Field label="Additional Notes" name="generalNotes" value={v("generalNotes")} onChange={set} type="textarea"
            placeholder="Anything else relevant to the deal…" full />
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {dirty && (
          <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: MUTED }}>
            Unsaved changes
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "10px 28px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: TEAL, color: NAVY, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : dirty ? "Save Changes" : "Saved ✓"}
        </button>
      </div>
    </div>
  );
}
