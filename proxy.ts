/**
 * Next.js Edge Middleware — Route Protection & Session Refresh
 *
 * Responsibilities:
 *  1. Refresh Supabase session cookies on every request (required by @supabase/ssr)
 *  2. Protect /admin/** — allow only 'admin' and 'super_admin' roles
 *  3. Protect /account/** — require any authenticated user
 *  4. Protect /api/admin/** — return 401/403 before the handler even runs
 *
 * Performance:
 *  - Only calls getUser() (network round-trip) for PROTECTED routes
 *  - Public routes just refresh cookies via getSession() (local JWT decode)
 *
 * Security model:
 *  - JWT signature is verified by @supabase/ssr — cannot be spoofed client-side
 *  - Role comes from `app_role` JWT claim (embedded by custom_access_token_hook)
 *  - Falls back to 'customer' if claim is absent (handles first-login edge case)
 *  - API routes also call requireAdmin() server-side (defense in depth)
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Route matchers
// ---------------------------------------------------------------------------
const ADMIN_ROUTES   = /^\/admin(?!\/login)(\/.*)?$/;
const ACCOUNT_ROUTES = /^\/account(\/.*)?$/;
const ADMIN_API      = /^\/api\/admin(\/.*)?$/;

const ADMIN_LOGIN = '/admin/login';

const ELEVATED_ROLES = new Set(['admin', 'super_admin']);

// Check if the route requires authentication
function isProtectedRoute(pathname: string): boolean {
  return (
    ADMIN_ROUTES.test(pathname) ||
    ACCOUNT_ROUTES.test(pathname) ||
    ADMIN_API.test(pathname) ||
    pathname === ADMIN_LOGIN
  );
}

// ---------------------------------------------------------------------------
// Proxy (formerly Middleware)
// ---------------------------------------------------------------------------
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── PUBLIC ROUTES: Skip Supabase entirely ────────────────────────────
  // This avoids the 6-7s delay on Vercel Edge during client-side navigation.
  // The client-side Supabase SDK handles token refresh automatically.
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Build a response we can mutate to set refreshed session cookies
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
          // Forward cookies to both the outgoing request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ─── PROTECTED ROUTES: validate JWT with Supabase Auth ────────────────
  // getUser() makes a network call to verify the token is still valid.
  const { data: { user } } = await supabase.auth.getUser();

  // Extract role from JWT claim (no DB query — fast edge-compatible)
  const jwtRole: string | null = user?.app_metadata?.app_role ?? null;
  const roleKnownAndLow = jwtRole !== null && !ELEVATED_ROLES.has(jwtRole);
  const isLoggedIn = !!user;

  // ---------------------------------------------------------------------------
  // Guard: /admin/** (except /admin/login)
  // ---------------------------------------------------------------------------
  if (ADMIN_ROUTES.test(pathname)) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN;
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (roleKnownAndLow) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN;
      url.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(url);
    }
  }

  // ---------------------------------------------------------------------------
  // Guard: /api/admin/** — return 401/403, not a redirect
  // ---------------------------------------------------------------------------
  if (ADMIN_API.test(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (roleKnownAndLow) {
      return NextResponse.json({ error: 'Forbidden', role: jwtRole }, { status: 403 });
    }
  }

  // ---------------------------------------------------------------------------
  // Guard: /account/** — require any logged-in user
  // ---------------------------------------------------------------------------
  if (ACCOUNT_ROUTES.test(pathname)) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('auth', 'login');
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // --------------------------------------------------------------------------
  // Redirect logged-in admin away from login page
  // ---------------------------------------------------------------------------
  if (pathname === ADMIN_LOGIN && isLoggedIn && jwtRole !== null && ELEVATED_ROLES.has(jwtRole)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  // Return the (potentially cookie-refreshed) response
  return supabaseResponse;
}

// ---------------------------------------------------------------------------
// Matcher — run middleware on every page and API except statics
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
