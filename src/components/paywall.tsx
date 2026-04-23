"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

type Props = {
  /** Title of the tool being gated (e.g. "QoE Mapper") */
  toolName: string;
  /** Path to return to after successful checkout */
  nextPath: string;
  /** Whether the user is signed in at all */
  isAuthenticated: boolean;
};

/**
 * Client-side paywall card. Shown on paid tool routes when the user
 * lacks an active subscription. Kicks off Stripe Checkout.
 */
export function Paywall({ toolName, nextPath, isAuthenticated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next: nextPath }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "checkout_failed");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-prose flex-col items-center gap-6 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-bg">
        <Lock className="h-6 w-6 text-teal" />
      </div>
      <h1 className="text-3xl font-bold tracking-tether-tight text-warm md:text-4xl">
        {toolName} is a Tether Pro tool
      </h1>
      <p className="max-w-lg text-muted">
        Unlock the full deal-diligence suite — QoE Mapper, Deal Workspace,
        and the Property Management playbook — with a single subscription.
      </p>

      {isAuthenticated ? (
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : "Unlock for $—"}
        </button>
      ) : (
        <a
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="btn-primary"
        >
          Sign in to continue
        </a>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      <p className="text-xs text-muted">
        Napkin Value is free. Cancel anytime from your account.
      </p>
    </div>
  );
}
