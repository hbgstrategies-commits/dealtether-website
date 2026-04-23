import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Paywall } from "@/components/paywall";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { DdPmTool } from "@/components/dd-pm/dd-pm-tool";

export const metadata = {
  title: "Property Management Deal Workspace",
  description:
    "Purpose-built deal workspace for property management acquisitions. Every task, every phase, from LOI to transition.",
};

export default async function DdPmPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  return (
    <>
      <Nav />
      <main className="min-h-[60vh]">
        {subscribed ? (
          <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
            <div className="mb-8 flex items-center gap-3">
              <span className="eyebrow-pill">Property Management</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tether-tight text-warm">
              Property Management Deal Workspace
            </h1>
            <p className="mt-2 text-muted">
              The full PM acquisition playbook — diligence, closing, and 90-day
              transition.
            </p>
            <div className="mt-8">
              <DdPmTool />
            </div>
          </div>
        ) : (
          <Paywall
            toolName="Property Management Deal Workspace"
            nextPath="/dd-pm"
            isAuthenticated={!!user}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
