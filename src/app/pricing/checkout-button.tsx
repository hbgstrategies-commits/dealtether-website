"use client";

import { useState } from "react";

export function CheckoutButton({
  isAuthenticated,
  priceId,
  label,
  variant = "primary",
}: {
  isAuthenticated: boolean;
  priceId: string;
  label: string;
  variant?: "primary" | "outline";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseClass = "block w-full rounded-lg py-3 text-center text-[13px] font-semibold transition-colors";
  const cls = variant === "outline"
    ? `${baseClass} border border-[0.5px] border-border text-warm hover:bg-navy-200`
    : `${baseClass} bg-teal text-navy hover:bg-teal-dim`;

  if (!isAuthenticated) {
    return (
      <a href="/login?next=/pricing" className={cls}>
        Sign in to get started
      </a>
    );
  }

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceId, next: "/pipeline" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "checkout_failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={start} disabled={loading || !priceId} className={`${cls} disabled:opacity-60`}>
        {loading ? "Opening checkout…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </>
  );
}
