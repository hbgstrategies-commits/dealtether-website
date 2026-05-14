"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { label: string; href: string };

export function NavMobileMenu({
  links,
  ctaHref,
  ctaLabel,
  showLogin = false,
}: {
  links: NavLink[];
  ctaHref: string;
  ctaLabel: string;
  showLogin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid #1E3A5F" }}
      >
        <span
          className="block h-[1.5px] w-5 rounded-full bg-warm transition-all duration-200"
          style={{ transform: open ? "translateY(6.5px) rotate(45deg)" : "none" }}
        />
        <span
          className="block h-[1.5px] w-5 rounded-full bg-warm transition-all duration-200"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          className="block h-[1.5px] w-5 rounded-full bg-warm transition-all duration-200"
          style={{ transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 flex flex-col px-5 pb-5 pt-3"
          style={{ background: "rgba(10,22,40,0.98)", borderBottom: "0.5px solid #1E3A5F" }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-[0.5px] border-border py-3.5 text-[15px] text-muted transition-colors hover:text-warm"
              style={{ borderColor: "#1E3A5F" }}
            >
              {link.label}
            </Link>
          ))}
          {showLogin && (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-lg py-3 text-center text-[14px] font-medium text-muted transition-colors hover:text-warm"
              style={{ border: "0.5px solid #1E3A5F" }}
            >
              Log in
            </Link>
          )}
          <Link
            href={ctaHref}
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-lg bg-teal py-3 text-center text-[14px] font-semibold text-navy"
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
