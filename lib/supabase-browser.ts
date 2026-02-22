/**
 * Supabase client for browser/Client Components.
 * Uses @supabase/ssr with document.cookie — fully replaces the old
 * createClient() singleton so sessions are shared with the server.
 *
 * Usage:
 *   import { createBrowserClient } from '@/lib/supabase-browser'
 *   const supabase = createBrowserClient()
 *
 * The existing `lib/supabase.ts` singleton is kept for backwards-compat
 * with existing client components but new code should use this.
 */
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Re-export a singleton for convenience (mirrors old lib/supabase.ts API)
export const supabaseBrowser = createBrowserClient();
