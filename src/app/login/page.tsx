import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { signInWithEmail } from "./actions";

type SearchParams = Promise<{
  next?: string;
  sent?: string;
  email?: string;
  error?: string;
}>;

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";
  const sent = params.sent === "1";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="mb-2 text-3xl font-bold tracking-tether-tight text-warm">
          Log in to Tether
        </h1>
        <p className="mb-8 text-sm text-muted">
          We&apos;ll send you a one-time link. No passwords.
        </p>

        {sent ? (
          <div className="rounded-xl border border-[0.5px] border-teal-bd bg-teal-bg p-5">
            <p className="text-sm text-warm">
              Check <strong>{params.email}</strong> for your sign-in link.
            </p>
          </div>
        ) : (
          <form action={signInWithEmail} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="you@company.com"
                className="rounded-lg border border-border bg-navy-100 px-4 py-3 text-warm outline-none focus:border-teal"
              />
            </label>
            <button type="submit" className="btn-primary mt-2">
              Send magic link
            </button>
            {params.error && (
              <p className="text-sm text-danger">{params.error}</p>
            )}
          </form>
        )}

        <p className="mt-8 text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-teal hover:underline">
            Sign up
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
