import { NextRequest, NextResponse } from "next/server";

/**
 * Admin route protection — email allowlist.
 *
 * Requires cookie-based Supabase auth.
 * If you are using the default localStorage client, install @supabase/ssr
 * and update lib/supabase/client.ts to use a cookie storage adapter so the
 * access token is readable here.
 *
 * The Supabase access token is a signed JWT. We decode the payload (base64)
 * to read the email claim without making a network call.
 *
 * Cookie names checked (in order):
 *   sb-access-token                     ← @supabase/ssr default
 *   sb-<project-ref>-auth-token         ← legacy / custom setups
 */

const ADMIN_PREFIX = "/admin";

/** Parse allowed emails from ADMIN_EMAILS env var (comma-separated). */
function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    // base64url → base64
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Extract the email from an access token JWT. */
function emailFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  // Supabase puts the user email in `email`
  return typeof payload.email === "string" ? payload.email.toLowerCase() : null;
}

/**
 * Find the Supabase access token from the request cookies.
 * Supabase ssr stores it as "sb-access-token".
 * Older / custom setups may use "sb-<ref>-auth-token" (JSON value).
 */
function getAccessToken(request: NextRequest): string | null {
  // @supabase/ssr standard cookie
  const direct = request.cookies.get("sb-access-token")?.value;
  if (direct) return direct;

  // Legacy: sb-<project-ref>-auth-token contains a JSON-encoded session
  for (const [name, cookie] of request.cookies) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
      try {
        const session = JSON.parse(cookie.value) as { access_token?: string };
        if (session.access_token) return session.access_token;
      } catch {
        // not JSON — might be the raw token
        return cookie.value;
      }
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: re-enable admin protection using @supabase/ssr cookie-based auth
  // (requires migrating lib/supabase/client.ts to a cookie storage adapter
  //  so the access token is readable in middleware)
  //
  // if (!pathname.startsWith(ADMIN_PREFIX)) {
  //   return NextResponse.next();
  // }
  // const token = getAccessToken(request);
  // if (!token) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }
  // const email = emailFromToken(token);
  // const allowed = allowedEmails();
  // if (!email || !allowed.has(email)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  void pathname; // suppress unused-var warning while guard is disabled

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
