import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session-refresh helper. Called from the root middleware on every request
 * so Supabase auth cookies stay fresh for Server Components.
 *
 * This does NOT gate any routes — paywall/auth gating is done at the page
 * level via `requireUser()` and `<Paywall>`. Middleware just keeps the
 * session cookie alive.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touching getUser() forces Supabase to refresh the session cookie.
  // This is the single most important line for SSR auth — don't remove.
  await supabase.auth.getUser();

  return response;
}
