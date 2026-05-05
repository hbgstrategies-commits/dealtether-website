import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/landing/hero";
import { CredibilityBar } from "@/components/landing/credibility-bar";
import { WhyBuyersFail } from "@/components/landing/why-buyers-fail";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CombinedPromise } from "@/components/landing/combined-promise";
import { SampleOutputs } from "@/components/landing/sample-outputs";
import { FounderCredibility } from "@/components/landing/founder-credibility";
import { WhoItsFor } from "@/components/landing/who-its-for";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { FinalCta } from "@/components/landing/final-cta";

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <CredibilityBar />
      <WhyBuyersFail />
      <HowItWorks />
      <CombinedPromise />
      <SampleOutputs />
      <FounderCredibility />
      <WhoItsFor />
      <PricingPreview />
      <FinalCta />
      <Footer />
    </>
  );
}
