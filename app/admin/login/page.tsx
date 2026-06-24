import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';

export default async function AdminLogin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin/dashboard');
  } else {
    redirect('/');
  }
}
