import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';
  const code = searchParams.get('code');

  // eslint-disable-next-line no-console
  console.log('Auth callback triggered:', { type, hasTokenHash: !!token_hash, hasCode: !!code });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${request.nextUrl.origin}${next}`);
    }
    console.error('Auth code exchange error:', error);
  }

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Redirect to confirmation page which will then redirect to login/dashboard
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/confirm`);
    }
    console.error('Auth verify OTP error:', error);
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${request.nextUrl.origin}/auth/auth-code-error`);
}
