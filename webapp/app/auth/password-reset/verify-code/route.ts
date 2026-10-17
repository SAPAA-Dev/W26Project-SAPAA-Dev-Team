import { NextRequest, NextResponse } from 'next/server';
import { createAnonSupabase, createClient } from '@/utils/supabase/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

function normaliseEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// The recovery link must come back to this site. Behind a proxy, request.url is the internal
// host, so the forwarded host wins, as in the auth callback route.
function siteUrl(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    return `https://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = normaliseEmail(body.email);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!EMAIL_PATTERN.test(email) || !CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: 'Enter the six-digit code from your email.' }, { status: 400 });
  }

  // The non-persisting client discards the session that a correct code returns. This endpoint
  // must not sign the user in; it only proves the code and then triggers the recovery email.
  const client = createAnonSupabase();
  const { data, error } = await client.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error || !data.session) {
    return NextResponse.json(
      { error: 'That code is invalid or has expired. Request a new code and try again.' },
      { status: 400 },
    );
  }

  // Only past this point, after Supabase accepted the code, does the reset link go out. The
  // endpoint enforces the whole sequence, so no caller can reach this line without a valid code.
  const sessionClient = await createClient();
  const { error: resetError } = await sessionClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl(request)}/auth/callback?next=/reset-password`,
  });
  if (resetError) {
    return NextResponse.json(
      { error: 'We could not send the reset link. Request a new code and try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ verified: true });
}
