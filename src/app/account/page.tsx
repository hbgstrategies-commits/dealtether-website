import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { SignOutButton } from "./sign-out-button";
import { ManageBillingButton } from "./manage-billing-button";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const subscribed = await hasActiveSubscription(user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="mb-2 text-3xl font-bold tracking-tether-tight text-warm">
          Account
        </h1>
        <p className="mb-10 text-sm text-muted">Signed in as {user.email}</p>

        <section className="card-surface mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal">
            Subscription
          </div>
          <div className="mb-4 text-lg text-warm">
            {subscribed ? "Tether Pro — active" : "Free plan"}
          </div>
          {subscribed ? (
            <ManageBillingButton />
          ) : (
            <a href="/pricing" className="btn-primary">
              Upgrade to Pro
            </a>
          )}
        </section>

        <SignOutButton />
      </main>
      <Footer />
    </>
  );
}
