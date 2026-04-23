import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Paywall } from "@/components/paywall";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { QoETool } from "@/components/qoe/qoe-tool";

export const metadata = {
  title: "Quality of Earnings Mapper",
  description:
    "AI-powered P&L normalizer for business acquisitions. Upload financials, map add-backs, calculate adjusted SDE.",
};

export default async function QoEPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  return (
    <>
      <Nav />
      <main className="min-h-[60vh]">
        {subscribed ? (
          <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
            <div className="mb-8">
              <span className="eyebrow-pill">Tether Pro</span>
              <h1 className="mt-5 text-4xl font-bold tracking-tether-tight text-warm">
                Quality of Earnings Mapper
              </h1>
              <p className="mt-2 text-muted">
                Upload P&amp;Ls, map add-backs, calculate adjusted SDE.
              </p>
            </div>
            <QoETool />
          </div>
        ) : (
          <Paywall
            toolName="Quality of Earnings Mapper"
            nextPath="/qoe"
            isAuthenticated={!!user}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
