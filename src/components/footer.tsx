import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[0.5px] border-border bg-navy px-10 py-10 text-sm text-muted">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[18px] font-bold text-warm">Tether</span>
          <span className="text-xs">— Buy a business without guessing.</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/napkin" className="hover:text-warm">
            Napkin Value
          </Link>
          <Link href="/qoe" className="hover:text-warm">
            QoE Mapper
          </Link>
          <Link href="/dd-demo" className="hover:text-warm">
            Deal Workspace
          </Link>
          <Link href="/pricing" className="hover:text-warm">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-warm">
            Log in
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-5xl text-xs text-muted/70">
        © {new Date().getFullYear()} Tether. All rights reserved.
      </div>
    </footer>
  );
}
