import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase session cookie on every response and returns the
 * current user so middleware can make auth decisions without a second round-trip.
 *
 * WHY COOKIES (not localStorage) are required here:
 *   - Next.js middleware runs on the Edge Runtime — there is no DOM, no window,
 *     and therefore no access to localStorage.
 *   - Only HTTP cookies travel with each request and are readable via
 *     `request.cookies` in middleware.
 *   - @supabase/ssr stores the session as an HTTP cookie, making it the only
 *     way to read auth state in middleware, server components, and route handlers.
 *   - A plain @supabase/supabase-js client that defaults to localStorage is
 *     invisible to middleware — the user would always appear unauthenticated.
 */
export async function updateSupabaseSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto the mutated request so subsequent getAll()
          // calls in the same middleware chain see the refreshed values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response so the Set-Cookie headers reach the browser.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called on every request.
  //   - It validates the JWT and silently refreshes the access token when it
  //     is about to expire, writing the new token back via setAll above.
  //   - Skipping this call means expired sessions are never refreshed and
  //     server components will see the user as logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
