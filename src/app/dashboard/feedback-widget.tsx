"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus("sending");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      setStatus("sent");
      setMessage("");
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 2500);
    } else {
      setStatus("error");
    }
  };

  return (
    <div style={{ background: "#1A2F50", border: "0.5px solid #1E3A5F", borderRadius: 12, padding: "1.1rem 1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F2EC", marginBottom: 2 }}>Share feedback or ideas</div>
          <div style={{ fontSize: 12, color: "#9AA5B4" }}>What would make Tether more useful for you? Every message goes directly to the founder.</div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{ background: "transparent", border: "0.5px solid #243E65", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 500, color: "#9AA5B4", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Leave feedback →
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {status === "sent" ? (
            <div style={{ fontSize: 13, color: "#00C9A7", fontWeight: 500, padding: "10px 0" }}>
              ✓ Got it — thanks for the feedback!
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's working, what's missing, what would change how you use this..."
                rows={3}
                style={{
                  width: "100%",
                  background: "#0A1628",
                  border: "0.5px solid #243E65",
                  borderRadius: 8,
                  color: "#F5F2EC",
                  padding: "10px 12px",
                  fontSize: 13,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
              />
              {status === "error" && (
                <div style={{ fontSize: 12, color: "#E24B4A", marginTop: 4 }}>Something went wrong — try again.</div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || status === "sending"}
                  style={{
                    background: message.trim() ? "#00C9A7" : "#1E3A5F",
                    color: message.trim() ? "#0A1628" : "#9AA5B4",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: message.trim() && status !== "sending" ? "pointer" : "default",
                  }}
                >
                  {status === "sending" ? "Sending…" : "Send feedback"}
                </button>
                <button
                  onClick={() => { setOpen(false); setMessage(""); setStatus("idle"); }}
                  style={{ background: "transparent", border: "0.5px solid #243E65", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#9AA5B4", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
