import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Paywall } from "@/components/paywall";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { NapkinTool } from "@/components/napkin/napkin-tool";

export const metadata = {
  title: "Deal Analyzer",
  description:
    "Weighted SDE, market-benchmarked multiples, risk-adjusted offer ranges, and year-one projections.",
};

export default async function NapkinPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  return (
    <>
      <Nav />
      <main className="min-h-[60vh]">
        {subscribed ? (
          <div className="mx-auto max-w-4xl px-6 py-12 md:px-10">
            <div className="mb-10 text-center">
              <span className="eyebrow-pill">Tether Pro</span>
              <h1 className="mt-5 text-[42px] font-bold tracking-tether-tight text-warm md:text-[48px]">
                Deal Analyzer
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted">
                Weighted SDE. Market-benchmarked multiple. Risk-adjusted offer
                range. In about 3 minutes.
              </p>
            </div>
            <NapkinTool />
          </div>
        ) : (
          <Paywall
            toolName="Deal Analyzer"
            nextPath="/napkin"
            isAuthenticated={!!user}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
