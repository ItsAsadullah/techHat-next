import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Uses cookies (not localStorage) so the server middleware can read the session.
// Drop-in replacement — same API as createClient from @supabase/supabase-js.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
