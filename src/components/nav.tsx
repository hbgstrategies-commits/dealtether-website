import Link from "next/link";

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

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between border-b border-[0.5px] border-border px-10 py-[1.1rem] backdrop-blur-nav"
      style={{ background: "rgba(10,22,40,0.97)" }}
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <TetherLogo />
        <span className="text-[20px] font-bold tracking-tether-tight text-warm">tether</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <Link href="#how-it-works" className="text-[13px] text-muted transition-colors hover:text-warm">
          How it works
        </Link>
        <Link href="/pipeline" className="text-[13px] text-muted transition-colors hover:text-warm">
          Pipeline
        </Link>
        <Link href="#examples" className="text-[13px] text-muted transition-colors hover:text-warm">
          See examples
        </Link>
        <Link href="#pricing" className="text-[13px] text-muted transition-colors hover:text-warm">
          Pricing
        </Link>
        <Link href="/napkin" className="text-[13px] text-muted transition-colors hover:text-warm">
          Deal Analyzer
        </Link>
      </div>

      <a
        href="https://buy.stripe.com/14AfZieqPfSp3aR1wxcIE04"
        className="rounded-lg bg-teal px-[18px] py-[7px] text-[13px] font-semibold text-navy transition-colors hover:bg-teal-dim"
      >
        Start free — 1 month free
      </a>
    </nav>
  );
}
