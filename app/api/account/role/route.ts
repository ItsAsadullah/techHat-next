import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Service-role client to verify any access_token passed by the caller
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Prisma Role enum values that grant admin access */
const ADMIN_ROLES = ['SUPER_ADMIN', 'STAFF'];

/**
 * GET /api/account/role
 *
 * Accepts auth via:
 *   - Authorization: Bearer <access_token>  (used right after login when
 *     cookies haven't propagated yet)
 *   - OR cookie-based session (normal page-load check)
 *
 * Returns the user's effective role by checking (in order):
 *   1. JWT claim  (app_role from custom_access_token_hook)
 *   2. Prisma User.role  (SUPER_ADMIN / STAFF = admin — the primary system)
 *   3. Staff table (legacy)
 */
export async function GET(request: NextRequest) {
  try {
    let user: any = null;

    // --- Try Bearer token first (works right after login) ---
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) user = data.user;
    }

    // --- Fallback: cookie-based session ---
    if (!user) {
      const { createServerClient } = await import('@supabase/ssr');
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() { /* read-only */ },
          },
        }
      );
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) user = data.user;
    }

    if (!user) {
      return NextResponse.json({ role: 'customer', isAdmin: false });
    }

    // 1. JWT claim (fastest — set by custom_access_token_hook if enabled)
    const jwtRole = user.app_metadata?.app_role;
    if (jwtRole === 'admin' || jwtRole === 'super_admin') {
      return NextResponse.json({ role: jwtRole, isAdmin: true });
    }

    // 2. Prisma User table — the PRIMARY role store for this project
    if (user.email) {
      try {
        const dbUser = await (prisma as any).user.findFirst({
          where: { email: user.email },
          select: { role: true, fullName: true },
        });
        if (dbUser && ADMIN_ROLES.includes(dbUser.role)) {
          return NextResponse.json({
            role: dbUser.role === 'SUPER_ADMIN' ? 'super_admin' : 'staff',
            isAdmin: true,
            name: dbUser.fullName,
          });
        }
        // Confirmed regular user — return early
        if (dbUser) {
          return NextResponse.json({ role: 'customer', isAdmin: false });
        }
      } catch {
        // DB query failed — continue to next check
      }
    }

    // 3. Legacy Staff table fallback
    if (user.email) {
      try {
        const staff = await (prisma as any).staff.findFirst({
          where: { email: user.email, isActive: true },
          select: { role: true },
        });
        if (staff) {
          return NextResponse.json({ role: staff.role || 'ADMIN', isAdmin: true });
        }
      } catch {
        // Staff table not available
      }
    }

    return NextResponse.json({ role: 'customer', isAdmin: false });
  } catch {
    return NextResponse.json({ role: 'customer', isAdmin: false });
  }
}
