import Link from "next/link";

function TetherLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <line x1="14" y1="1" x2="14" y2="7" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
      <line x1="14" y1="21" x2="14" y2="27" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
      <circle cx="14" cy="14" r="8" fill="none" stroke="#00C9A7" strokeWidth="2"/>
      <circle cx="14" cy="14" r="3" fill="#00C9A7"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[0.5px] border-border px-10 py-8 bg-navy">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <TetherLogo />
        <span className="text-[15px] font-bold text-warm">tether</span>
      </Link>
      <div className="text-[12px] text-muted">© 2026 Deal Tether · dealtether.com</div>
      <div className="flex gap-6">
        <Link href="/privacy" className="text-[12px] text-muted transition-colors hover:text-warm no-underline">Privacy</Link>
        <Link href="/terms" className="text-[12px] text-muted transition-colors hover:text-warm no-underline">Terms</Link>
        <a href="mailto:hbgstrategies@gmail.com" className="text-[12px] text-muted transition-colors hover:text-warm no-underline">Contact</a>
      </div>
    </footer>
  );
}
