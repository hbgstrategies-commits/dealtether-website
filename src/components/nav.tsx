import Link from "next/link";

/**
 * Shared site navigation. Sticky, translucent over navy background.
 * Matches the original index.html wordmark + link structure.
 */
export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[0.5px] border-border px-10 py-4 backdrop-blur-nav"
         style={{ background: "rgba(10,22,40,0.97)" }}>
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <span className="text-[20px] font-bold tracking-tether-tight text-warm">
          Tether
        </span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <Link
          href="/napkin"
          className="text-[13px] text-muted transition-colors hover:text-warm"
        >
          Napkin Value
        </Link>
        <Link
          href="/qoe"
          className="text-[13px] text-muted transition-colors hover:text-warm"
        >
          QoE Mapper
        </Link>
        <Link
          href="/dd-demo"
          className="text-[13px] text-muted transition-colors hover:text-warm"
        >
          Deal Workspace
        </Link>
        <Link
          href="/pricing"
          className="text-[13px] text-muted transition-colors hover:text-warm"
        >
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-[13px] text-muted transition-colors hover:text-warm md:inline"
        >
          Log in
        </Link>
        <Link href="/signup" className="btn-nav-cta">
          Get started
        </Link>
      </div>
    </nav>
  );
}
