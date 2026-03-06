import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

// ── ADMIN_EMAILS allowlist ────────────────────────────────────────────────────

/**
 * Parse ADMIN_EMAILS from the environment into a normalised Set<string>.
 *
 * Expected format (comma-separated, spaces allowed):
 *   ADMIN_EMAILS=alice@example.com, bob@example.com
 *
 * Rules applied:
 *   - Each value is trimmed of surrounding whitespace
 *   - Lowercased for case-insensitive comparison
 *   - Empty entries are discarded
 */
function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Next.js middleware — runs before every matched request.
 *
 * Responsibilities:
 *   1. Refresh the Supabase auth session cookie so it stays alive across
 *      page navigations (handled inside updateSupabaseSession).
 *   2. Protect /admin and all sub-routes: only users whose email is in the
 *      ADMIN_EMAILS allowlist are permitted through.
 *
 * WHY COOKIE-BASED AUTH IS REQUIRED HERE:
 *   Middleware runs on the Edge Runtime. There is no DOM, no window, and no
 *   localStorage. The only auth state reachable from middleware is what
 *   arrives in HTTP cookies. @supabase/ssr stores the session as a signed
 *   cookie, making it the only reliable way to authenticate requests server-
 *   side without an extra network call to Supabase's API on every request.
 *
 * REDIRECT TARGET: / (homepage)
 *   Unauthenticated and unauthorised users are sent to the public homepage,
 *   which avoids leaking the existence of the admin area via a /login page.
 */
export async function middleware(request: NextRequest) {
  // Always run session refresh first — this keeps auth cookies alive and
  // populates `user` from the validated JWT stored in the request cookie.
  const { response, user } = await updateSupabaseSession(request);

  const { pathname } = request.nextUrl;

  // Only admin routes require further checks.
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  // ── Admin guard ──────────────────────────────────────────────────────────

  // CASE A: user is not authenticated at all → redirect to homepage
  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // CASE B: user is authenticated but email is absent or not in the allowlist
  const email = user.email?.toLowerCase() ?? "";
  if (!email || !allowedEmails().has(email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // CASE C: authenticated + email is in ADMIN_EMAILS → allow through
  return response;
}

// ── Matcher ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Run on every request path EXCEPT:
     *   _next/static   — compiled JS/CSS bundles
     *   _next/image    — Next.js image optimisation API
     *   favicon.ico    — browser favicon requests
     *   sitemap.xml    — SEO sitemap
     *   robots.txt     — crawler instructions
     *   image files    — svg, png, jpg, jpeg, gif, webp
     *
     * This means middleware runs on all HTML pages (including public ones),
     * but only /admin paths are subject to the auth guard above.
     * CASE D: public routes (/, /properties, /golden-visa-greece, etc.)
     *         hit middleware, get their session cookies refreshed, then pass
     *         straight through — no redirect, no auth check.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
