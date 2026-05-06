import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { ToolGrid } from "./tool-grid";

export const metadata = {
  title: "Dashboard — Tether",
  description: "Your acquisition system. Every tool in one place.",
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");
  const subscribed = await hasActiveSubscription(user.id);
  if (!subscribed) redirect("/pricing");

  const firstName = user.email?.split("@")[0] ?? "there";

  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "3rem 1.5rem 5rem",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "#00C9A7",
              marginBottom: 8,
            }}
          >
            Tether Pro
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-.5px",
              color: "#F5F2EC",
              marginBottom: 6,
            }}
          >
            Welcome back, {firstName}
          </h1>
          <p style={{ fontSize: 14, color: "#9AA5B4" }}>
            Your full acquisition system — sourcing to close.
          </p>
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: "rgba(0,201,167,0.06)",
            border: "0.5px solid rgba(0,201,167,0.18)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#F5F2EC", marginBottom: 2 }}>
              Starting a new deal?
            </div>
            <div style={{ fontSize: 12, color: "#9AA5B4" }}>
              Set up your workspace, add your team, and launch your DD checklist in 2 minutes.
            </div>
          </div>
          <Link
            href="/deals/new"
            style={{
              background: "#00C9A7",
              color: "#0A1628",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Set up a new deal →
          </Link>
        </div>

        {/* Tool grid */}
        <ToolGrid />

        {/* Account footer */}
        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: "0.5px solid #1E3A5F",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#9AA5B4" }}>
            Signed in as <span style={{ color: "#F5F2EC" }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link
              href="/account"
              style={{ fontSize: 12, color: "#9AA5B4", textDecoration: "none" }}
            >
              Manage billing
            </Link>
            <Link
              href="/pricing"
              style={{ fontSize: 12, color: "#9AA5B4", textDecoration: "none" }}
            >
              Plan details
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
