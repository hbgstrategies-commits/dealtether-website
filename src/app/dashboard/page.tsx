import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

export const metadata = {
  title: "Dashboard — Tether",
  description: "Your acquisition system. Every tool in one place.",
};

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
  {
    stage: "05",
    label: "PM Deal Workspace",
    desc: "The full property management acquisition playbook — every phase from diligence through 90-day transition.",
    href: "/dd-pm",
    cta: "Open PM workspace →",
    color: "#AFA9EC",
    colorBg: "rgba(175,169,236,0.08)",
    colorBd: "rgba(175,169,236,0.2)",
  },
];

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 12,
          }}
        >
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#1A2F50",
                  border: "0.5px solid #1E3A5F",
                  borderRadius: 14,
                  padding: "1.25rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color .15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = tool.colorBd)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = "#1E3A5F")
                }
              >
                {/* Stage + beta */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: tool.color,
                      background: tool.colorBg,
                      border: `0.5px solid ${tool.colorBd}`,
                      borderRadius: 99,
                      padding: "2px 9px",
                    }}
                  >
                    Stage {tool.stage}
                  </div>
                  {tool.beta && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: ".03em",
                        color: "#E8A020",
                        background: "rgba(232,160,32,0.08)",
                        border: "0.5px solid rgba(232,160,32,0.2)",
                        borderRadius: 99,
                        padding: "2px 8px",
                      }}
                    >
                      Beta
                    </div>
                  )}
                </div>

                {/* Name */}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#F5F2EC",
                    letterSpacing: "-.2px",
                  }}
                >
                  {tool.label}
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: 12,
                    color: "#9AA5B4",
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {tool.desc}
                </div>

                {/* CTA */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: tool.color,
                    marginTop: 4,
                  }}
                >
                  {tool.cta}
                </div>
              </div>
            </Link>
          ))}
        </div>

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
