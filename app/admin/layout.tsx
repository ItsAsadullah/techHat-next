import { createServerClient } from '@/lib/supabase-server';
import { AdminLayoutClient } from './admin-layout-client';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const ADMIN_ROLES = ['SUPER_ADMIN', 'STAFF'];

// ✅ Module-level cache — correct pattern so cache persists across requests
const getAdminRoleCached = unstable_cache(
  async (email: string) => {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { email },
        select: { role: true, fullName: true },
      });
      if (dbUser && ADMIN_ROLES.includes(dbUser.role)) {
        return { role: dbUser.role === 'SUPER_ADMIN' ? 'ADMIN' : 'STAFF', name: dbUser.fullName };
      }
      const staff = await prisma.staff.findFirst({
        where: { email, isActive: true },
        select: { role: true },
      });
      if (staff) {
        return { role: (staff.role || 'ADMIN').toUpperCase(), name: null as string | null };
      }
    } catch (err) {
      console.error('Role check error:', err);
    }
    return null;
  },
  ['admin-role'],
  { revalidate: 300 } // 5 minutes cache
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staffRole = 'customer';
  let staffName = 'Admin';
  let isAuthed = false;

  if (user) {
    
    staffName = 
      user.user_metadata?.full_name || 
      user.email?.split('@')[0] || 
      'Admin';

    let resolvedRole: string | null = null;
    const jwtRole = user.app_metadata?.app_role;

    if (jwtRole === 'admin' || jwtRole === 'super_admin') {
      resolvedRole = jwtRole;
    } else if (user.email) {
      const cachedData = await getAdminRoleCached(user.email);
      if (cachedData) {
        resolvedRole = cachedData.role;
        if (cachedData.name) staffName = cachedData.name;
      }
    }

    if (resolvedRole) {
      staffRole = resolvedRole.toUpperCase();
      // Normalize SUPER_ADMIN to ADMIN so menus show up correctly
      if (staffRole === 'SUPER_ADMIN') {
        staffRole = 'ADMIN';
      }
      
      if (['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'].includes(staffRole)) {
        isAuthed = true;
      }
    }
  }

  return (
    <AdminLayoutClient staffRole={staffRole} staffName={staffName} isAuthed={isAuthed}>
      {children}
    </AdminLayoutClient>
  );
}
