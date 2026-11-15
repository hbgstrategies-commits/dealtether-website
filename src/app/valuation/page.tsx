import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Paywall } from "@/components/paywall";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { ValuationTool } from "@/components/valuation/valuation-tool";
import { DisclaimerGate } from "@/components/napkin/disclaimer-gate";

export const metadata = {
  title: "Valuation 3.0",
  description:
    "Trend-weighted SDE, a size-and-comps multiple, a cash-to-creative price window, and a 5-year cash flow forecast.",
};

export default async function ValuationPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  return (
    <>
      <Nav />
      <main className="min-h-[60vh]">
        {subscribed ? (
          <div className="mx-auto max-w-4xl px-6 py-12 md:px-10">
            <div className="mb-10 text-center">
              <span className="eyebrow-pill">New · Version 3.0</span>
              <h1 className="mt-5 text-[42px] font-bold tracking-tether-tight text-warm md:text-[48px]">
                Valuation 3.0
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted">
                Enter revenue and SDE. Get a forecast, a recommended multiple,
                and a price window from cash offer to creative ceiling.
              </p>
            </div>
            <DisclaimerGate>
              <ValuationTool />
            </DisclaimerGate>
          </div>
        ) : (
          <Paywall
            toolName="Valuation 3.0"
            nextPath="/valuation"
            isAuthenticated={!!user}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
