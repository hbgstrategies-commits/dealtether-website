import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

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
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <div className="mb-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ background: "rgba(175,169,236,0.1)", color: "#AFA9EC", border: "0.5px solid rgba(175,169,236,0.25)" }}>
          Coming soon
        </div>
        <h1 className="mb-3 text-[32px] font-bold tracking-tighter text-warm">
          Sourcing Tool
        </h1>
        <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-muted">
          Search for acquisition targets by industry and location — real businesses, owner info, ratings, and acquisition signals. Launching shortly.
        </p>
      </main>
      <Footer />
    </>
  );
}
