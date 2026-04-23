import { redirect } from "next/navigation";

/**
 * Signup and login are the same flow (magic link). Forward to /login.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}
