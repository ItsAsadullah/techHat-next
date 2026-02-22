/**
 * Server-side role enforcement utilities for API Route Handlers.
 *
 * These run entirely on the server — they cannot be bypassed from the browser.
 * Always call one of these at the top of every /api/admin/* route handler.
 *
 * Usage:
 *   import { requireRole, requireAdmin } from '@/lib/auth/require-role'
 *
 *   export async function GET(req: Request) {
 *     const authError = await requireAdmin()
 *     if (authError) return authError   // 401 or 403 Response
 *     // ...handle request
 *   }
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export type AppRole = 'super_admin' | 'admin' | 'staff' | 'customer';

/** Hierarchy: higher index = more privileged */
const ROLE_HIERARCHY: AppRole[] = ['customer', 'staff', 'admin', 'super_admin'];

function roleRank(role: AppRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Checks that the caller is authenticated and has at least `minimumRole`.
 * Returns a NextResponse (401/403) on failure, null on success.
 */
export async function requireRole(minimumRole: AppRole): Promise<NextResponse | null> {
  const supabase = await createServerClient();

  // Use getUser() — verifies the JWT signature server-side, never trusts client
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required.' },
      { status: 401 }
    );
  }

  // Get role from JWT claim (embedded by custom_access_token_hook)
  // Fall back to Prisma User.role if claim not yet present
  let userRole: AppRole = (user.app_metadata?.app_role as AppRole) ?? 'customer';

  if (!user.app_metadata?.app_role && user.email) {
    try {
      // PRIMARY: Check Prisma User.role (SUPER_ADMIN / STAFF = admin)
      const { prisma } = await import('@/lib/prisma');
      const dbUser = await (prisma as any).user.findFirst({
        where: { email: user.email },
        select: { role: true },
      });
      if (dbUser?.role === 'SUPER_ADMIN') userRole = 'super_admin';
      else if (dbUser?.role === 'STAFF') userRole = 'staff';
      else if (dbUser?.role === 'USER') userRole = 'customer';
    } catch {
      // Fallback: Supabase profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      userRole = (profile?.role as AppRole) ?? 'customer';
    }
  }

  if (roleRank(userRole) < roleRank(minimumRole)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Requires '${minimumRole}' role. Your role: '${userRole}'.`,
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/** Shorthand: requires 'admin' or 'super_admin' */
export async function requireAdmin(): Promise<NextResponse | null> {
  return requireRole('admin');
}

/** Shorthand: requires 'super_admin' only */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
  return requireRole('super_admin');
}

/** Shorthand: requires 'staff', 'admin', or 'super_admin' */
export async function requireStaff(): Promise<NextResponse | null> {
  return requireRole('staff');
}

/**
 * Returns the authenticated user + their role without throwing.
 * Useful when you need the user object too, e.g. to filter by userId.
 */
export async function getAuthContext(): Promise<{
  user: { id: string; email?: string } | null;
  role: AppRole;
  error: NextResponse | null;
}> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      role: 'customer',
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  let role: AppRole = (user.app_metadata?.app_role as AppRole) ?? 'customer';

  if (!user.app_metadata?.app_role && user.email) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const dbUser = await (prisma as any).user.findFirst({
        where: { email: user.email },
        select: { role: true },
      });
      if (dbUser?.role === 'SUPER_ADMIN') role = 'super_admin';
      else if (dbUser?.role === 'STAFF') role = 'staff';
      else if (dbUser?.role === 'USER') role = 'customer';
    } catch {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = (profile?.role as AppRole) ?? 'customer';
    }
  }

  return { user: { id: user.id, email: user.email }, role, error: null };
}
