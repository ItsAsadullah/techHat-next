import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/account';

  if (errorParam) {
    console.error('OAuth Error from Provider:', errorParam, errorDescription);
  }

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successfully authenticated via OAuth
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Supabase exchangeCodeForSession error:', error);
    }
  } else {
    console.error('No code provided in callback URL:', request.url);
  }

  // Authentication failed or no code was provided
  return NextResponse.redirect(`${origin}/?auth=login-error`);
}
