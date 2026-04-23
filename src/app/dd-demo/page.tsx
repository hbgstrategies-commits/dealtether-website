import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Paywall } from "@/components/paywall";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { DdDemoTool } from "@/components/dd-demo/dd-demo-tool";

export const metadata = {
  title: "Deal Workspace",
  description:
    "Keep the whole deal team aligned from LOI to close. Phases, tasks, flags, and a weekly report that writes itself.",
};

export default async function DdDemoPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  return (
    <>
      <Nav />
      <main className="min-h-[60vh]">
        {subscribed ? (
          <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
            <div className="mb-8">
              <span className="eyebrow-pill">Tether Pro</span>
              <h1 className="mt-5 text-4xl font-bold tracking-tether-tight text-warm">
                Deal Workspace
              </h1>
              <p className="mt-2 text-muted">
                Track every task, flag every risk, and send the weekly report automatically.
              </p>
            </div>
            <DdDemoTool />
          </div>
        ) : (
          <Paywall
            toolName="Deal Workspace"
            nextPath="/dd-demo"
            isAuthenticated={!!user}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
