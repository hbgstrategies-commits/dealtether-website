import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = { title: "Terms of Service — Tether" };

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem 6rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#9AA5B4", lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#F5F2EC", marginBottom: 8, letterSpacing: "-0.5px" }}>Terms of Service</h1>
        <p style={{ fontSize: 13, marginBottom: 40 }}>Last updated: May 2026</p>

        <Section title="Acceptance">
          <p>By creating an account or using Tether (operated by Deal Tether, accessible at dealtether.com), you agree to these terms. If you do not agree, do not use the service.</p>
        </Section>

        <Section title="What Tether is">
          <p>Tether is a software toolkit for researching, evaluating, and tracking small business acquisitions. It includes tools for sourcing targets, normalizing financials, valuing deals, managing a pipeline, and running due diligence checklists.</p>
        </Section>

        <Section title="Not financial or legal advice">
          <p>Tether provides analytical tools for informational purposes only. Nothing in the service constitutes financial, legal, tax, or investment advice. All valuations, projections, DSCR calculations, IRR estimates, and offer ranges are pre-tax estimates for illustrative purposes. You are solely responsible for any acquisition decisions you make. We strongly recommend consulting a qualified M&A attorney, CPA, and lender before executing any transaction.</p>
        </Section>

        <Section title="Subscription and billing">
          <p>Paid features require an active subscription billed monthly through Stripe. Your first month is free — no charge until the trial ends. You may cancel at any time from your account page. Cancellation takes effect at the end of the current billing period and you retain access until then. We do not issue refunds for partial periods.</p>
        </Section>

        <Section title="Your data">
          <p>You own the data you enter into Tether. We do not claim any rights to your deal information, financials, or analysis results. You grant us a limited license to store and process your data solely to provide the service.</p>
        </Section>

        <Section title="Acceptable use">
          <p>You may not use Tether to violate any law, infringe on others&apos; rights, reverse-engineer the platform, or resell access without permission. Accounts found in violation may be terminated without refund.</p>
        </Section>

        <Section title="Availability">
          <p>We aim for high availability but do not guarantee uninterrupted service. We may modify, suspend, or discontinue features at any time. We will provide reasonable notice for material changes that affect paid subscribers.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>To the maximum extent permitted by law, Deal Tether&apos;s liability to you for any claim arising from use of the service is limited to the amount you paid us in the 3 months preceding the claim. We are not liable for any indirect, consequential, or speculative damages, including losses from acquisition decisions made using Tether&apos;s tools.</p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of the State of Arizona, United States. Any disputes shall be resolved in the courts of Maricopa County, Arizona.</p>
        </Section>

        <Section title="Contact">
          <p>Questions? Email us at <a href="mailto:hbgstrategies@gmail.com" style={{ color: "#00C9A7" }}>hbgstrategies@gmail.com</a>.</p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F5F2EC", marginBottom: 10, letterSpacing: "-0.2px" }}>{title}</h2>
      <div style={{ fontSize: 14 }}>{children}</div>
    </div>
  );
}
