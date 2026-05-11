import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = { title: "Privacy Policy — Tether" };

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem 6rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#9AA5B4", lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#F5F2EC", marginBottom: 8, letterSpacing: "-0.5px" }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, marginBottom: 40 }}>Last updated: May 2026</p>

        <Section title="What we collect">
          <p>When you create an account, we collect your email address. When you use the tools, we store the data you enter — deal financials, pipeline deals, and analysis results — so you can access them across sessions. We do not sell your data to third parties.</p>
        </Section>

        <Section title="How we use it">
          <p>Your data is used solely to provide the Tether service. Your email is used to send magic link sign-in emails and, if you subscribe, to manage your billing through Stripe. We do not use your deal data for any purpose other than displaying it back to you.</p>
        </Section>

        <Section title="Payments">
          <p>Payments are processed by Stripe. Tether does not store your credit card information. Stripe's privacy policy governs how your payment data is handled. You can review it at stripe.com/privacy.</p>
        </Section>

        <Section title="Data storage">
          <p>Your data is stored in Supabase, hosted on AWS infrastructure in the United States. We use industry-standard encryption in transit and at rest.</p>
        </Section>

        <Section title="Cookies and analytics">
          <p>We use cookies strictly for authentication (keeping you signed in). We do not currently use third-party analytics or advertising cookies.</p>
        </Section>

        <Section title="Data deletion">
          <p>You can request deletion of your account and all associated data at any time by emailing us at hbgstrategies@gmail.com. We will process deletion requests within 30 days.</p>
        </Section>

        <Section title="Changes">
          <p>We may update this policy as the product evolves. If we make material changes, we will notify subscribers by email. Continued use after notice constitutes acceptance.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about this policy? Email us at <a href="mailto:hbgstrategies@gmail.com" style={{ color: "#00C9A7" }}>hbgstrategies@gmail.com</a>.</p>
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
