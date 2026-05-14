import Link from "next/link";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { NavMobileMenu } from "./nav-mobile-menu";

function TetherLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <line x1="14" y1="1" x2="14" y2="7" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
      <line x1="14" y1="21" x2="14" y2="27" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
      <circle cx="14" cy="14" r="8" fill="none" stroke="#00C9A7" strokeWidth="2"/>
      <circle cx="14" cy="14" r="3" fill="#00C9A7"/>
    </svg>
  );
}

export async function Nav() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  const subscriberLinks = [
    { label: "Sourcing", href: "/sourcing" },
    { label: "QoE", href: "/qoe" },
    { label: "Deal Analyzer", href: "/napkin" },
    { label: "Pipeline", href: "/pipeline" },
    { label: "Workspace", href: "/dd-demo" },
    { label: "Account", href: "/account" },
  ];

  const marketingLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "See examples", href: "#examples" },
    { label: "Pricing", href: "#pricing" },
  ];

  const ctaHref = subscribed ? "/dashboard" : "/pricing";
  const ctaLabel = subscribed ? "My tools" : user ? "Start free trial →" : "Try free for 30 days";

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between border-b border-[0.5px] border-border px-5 py-[1.1rem] md:px-10"
      style={{ background: "rgba(10,22,40,0.97)" }}
    >
      <Link href={subscribed ? "/dashboard" : "/"} className="flex items-center gap-2.5 no-underline">
        <TetherLogo />
        <span className="text-[20px] font-bold tracking-tether-tight text-warm">tether</span>
      </Link>

      {/* Desktop nav links */}
      {subscribed ? (
        <div className="hidden items-center gap-8 md:flex">
          {subscriberLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] text-muted transition-colors hover:text-warm">
              {l.label}
            </Link>
          ))}
        </div>
      ) : (
        <div className="hidden items-center gap-8 md:flex">
          {marketingLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] text-muted transition-colors hover:text-warm">
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Desktop CTA */}
      <div className="hidden md:flex items-center gap-3">
        {!user && (
          <Link
            href="/login"
            className="text-[13px] text-muted transition-colors hover:text-warm"
          >
            Log in
          </Link>
        )}
        <Link
          href={ctaHref}
          className="rounded-lg bg-teal px-[18px] py-[7px] text-[13px] font-semibold text-navy transition-colors hover:bg-teal-dim"
        >
          {ctaLabel}
        </Link>
      </div>

      {/* Mobile hamburger */}
      <NavMobileMenu
        links={subscribed ? subscriberLinks : marketingLinks}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
        showLogin={!user}
      />
    </nav>
  );
}
