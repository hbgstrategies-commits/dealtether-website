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

import { redirect } from "next/navigation";

type SearchParams = Promise<{ error?: string; error_code?: string; error_description?: string }>;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  otp_expired: "Your sign-in link has expired. Enter your email to get a new one.",
  access_denied: "Sign-in was denied or the link is no longer valid. Please try again.",
};

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (params.error || params.error_code) {
    const code = params.error_code ?? params.error ?? "access_denied";
    const message = AUTH_ERROR_MESSAGES[code] ?? (params.error_description?.replace(/\+/g, " ") ?? "Something went wrong. Please try signing in again.");
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

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
