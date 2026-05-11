import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { SourcingTool } from "@/components/sourcing/sourcing-tool";

export const metadata = {
  title: "Sourcing — Tether",
  description: "Find acquisition targets in any industry and location. Owner info, ratings, and signals included.",
};

export default async function SourcingPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/sourcing");
  const subscribed = await hasActiveSubscription(user.id);
  if (!subscribed) redirect("/pricing");

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(232,160,32,0.08)", color: "#E8A020", border: "0.5px solid rgba(232,160,32,0.2)", letterSpacing: ".03em", textTransform: "uppercase" as const }}>
              Beta
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.3px", color: "#F5F2EC", marginBottom: 4 }}>
            Sourcing
          </h1>
          <p style={{ fontSize: 13, color: "#9AA5B4" }}>
            Search for acquisition targets by industry and location. Real businesses, owner info, and acquisition signals.
          </p>
        </div>
        <SourcingTool />
      </div>
    </>
  );
}
