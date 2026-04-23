import Link from "next/link";
import { Check } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { CheckoutButton } from "./checkout-button";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const user = await getUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-14 text-center">
          <span className="eyebrow-pill">Pricing</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tether-tight text-warm md:text-5xl">
            One subscription. Every diligence tool.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Napkin Value is free forever. Upgrade to Tether Pro to unlock the
            full diligence suite.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PlanCard
            name="Free"
            price="$0"
            cadence="forever"
            description="The napkin-math valuation that starts every deal conversation."
            features={[
              "Napkin Value calculator",
              "Save unlimited valuations",
              "Shareable deal summaries",
            ]}
            cta={
              <Link href="/napkin" className="btn-secondary w-full text-center">
                Use Napkin Value
              </Link>
            }
          />
          <PlanCard
            name="Tether Pro"
            price="$—"
            cadence="/month"
            description="Everything you need to run a real acquisition, end-to-end."
            features={[
              "Everything in Free",
              "Quality of Earnings Mapper",
              "Deal Workspace (DD Demo)",
              "Property Management Playbook",
              "Priority support",
            ]}
            highlight
            cta={
              <CheckoutButton
                isAuthenticated={!!user}
                label="Start Tether Pro"
              />
            }
          />
        </div>

        <p className="mx-auto mt-12 max-w-lg text-center text-xs text-muted">
          All plans billed by Stripe. Cancel anytime from your account — you
          keep access through the end of the billing period.
        </p>
      </main>
      <Footer />
    </>
  );
}

function PlanCard({
  name,
  price,
  cadence,
  description,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-6 rounded-2xl p-8 ${
        highlight
          ? "border border-teal-bd bg-teal-bg"
          : "border border-[0.5px] border-border bg-navy-100"
      }`}
    >
      <div>
        <div className="text-sm font-semibold uppercase tracking-wider text-teal">
          {name}
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-5xl font-bold tracking-tether-tighter text-warm">
            {price}
          </span>
          <span className="text-sm text-muted">{cadence}</span>
        </div>
        <p className="mt-3 text-sm text-muted">{description}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-warm">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{cta}</div>
    </div>
  );
}
