import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { isPMUser } from "@/lib/pm-auth";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "./tool-grid";
import { TrainingWaitlist } from "./training-waitlist";
import { FeedbackWidget } from "./feedback-widget";
import { PipelineSnapshot } from "./pipeline-snapshot";
import { TrialCountdown } from "./trial-countdown";

export const metadata = {
  title: "Dashboard — Tether",
  description: "Your acquisition system. Every tool in one place.",
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");
  const subscribed = await hasActiveSubscription(user.id);
  if (!subscribed) redirect("/pricing");

  const supabase = await createClient();

  // Load pipeline deals for snapshot
  const { data: deals } = await supabase
    .from("deals")
    .select("id, name, stage, sde, asking_price, offer_low, offer_high, dscr, irr, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  // Check if already on training waitlist
  const { data: waitlistRow } = await supabase
    .from("training_waitlist")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Load subscription to check for trial
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active"])
    .maybeSingle();
  const trialEnd = sub?.status === "trialing" ? sub.current_period_end : null;

  const firstName = user.email?.split("@")[0] ?? "there";
  const activeDeals = (deals ?? []).filter(
    (d) => !["closed", "pass", "Closed", "Passed"].includes(d.stage)
  );

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 1.5rem) 5rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "#00C9A7", marginBottom: 8 }}>
            Tether Solo
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, letterSpacing: "-.5px", color: "#F5F2EC", marginBottom: 6 }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ fontSize: 14, color: "#9AA5B4" }}>
            Your full acquisition system — sourcing to close.
          </p>
        </div>

        {/* Trial countdown */}
        <TrialCountdown trialEnd={trialEnd ?? null} />

        {/* Training waitlist banner */}
        <TrainingWaitlist alreadyJoined={!!waitlistRow} />

        {/* Pipeline snapshot */}
        {deals && deals.length > 0 && (
          <PipelineSnapshot deals={deals} activeCount={activeDeals.length} />
        )}

        {/* New deal CTA — only show if no deals yet */}
        {(!deals || deals.length === 0) && (
          <div style={{ background: "rgba(0,201,167,0.06)", border: "0.5px solid rgba(0,201,167,0.18)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#F5F2EC", marginBottom: 2 }}>Start your first deal</div>
              <div style={{ fontSize: 12, color: "#9AA5B4" }}>Run the Deal Analyzer, save it to your pipeline, and track it all the way to close.</div>
            </div>
            <Link href="/napkin" style={{ background: "#00C9A7", color: "#0A1628", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              Analyze a deal →
            </Link>
          </div>
        )}

        {/* PM Portal — only visible to Hunter's account */}
        {isPMUser(user.email) && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9AA5B4", marginBottom: 12 }}>Private</div>
            <Link href="/pm-portal" style={{ textDecoration: "none" }}>
              <div style={{ background: "rgba(0,201,167,0.05)", border: "0.5px solid rgba(0,201,167,0.25)", borderRadius: 14, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,201,167,0.5)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,201,167,0.25)")}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,201,167,0.08)", border: "0.5px solid rgba(0,201,167,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏠</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#F5F2EC", marginBottom: 3 }}>PM Acquisition Portal</div>
                    <div style={{ fontSize: 12, color: "#9AA5B4" }}>Questionnaire · QoE · Expert Opinion of Value — your private PM deal workspace.</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#00C9A7", whiteSpace: "nowrap", flexShrink: 0 }}>Open portal →</div>
              </div>
            </Link>
          </div>
        )}

        {/* Tool grid */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9AA5B4", marginBottom: 12 }}>Your tools</div>
          <ToolGrid />
        </div>

        {/* Feedback widget */}
        <FeedbackWidget />

        {/* Account footer */}
        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "0.5px solid #1E3A5F", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#9AA5B4" }}>
            Signed in as <span style={{ color: "#F5F2EC" }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/account" style={{ fontSize: 12, color: "#9AA5B4", textDecoration: "none" }}>Manage billing</Link>
            <Link href="/pricing" style={{ fontSize: 12, color: "#9AA5B4", textDecoration: "none" }}>Plan details</Link>
          </div>
        </div>

      </main>
    </>
  );
}
