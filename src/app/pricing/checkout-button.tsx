"use client";

import { useState } from "react";

export function CheckoutButton({
  isAuthenticated,
  label,
}: {
  isAuthenticated: boolean;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <a
        href="/login?next=/pricing"
        className="btn-primary block w-full text-center"
      >
        Sign in to subscribe
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
        body: JSON.stringify({ next: "/qoe" }),
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
      <button
        onClick={start}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "Opening checkout…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </>
  );
}
