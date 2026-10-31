import { NextRequest, NextResponse } from 'next/server';
import { createAnonSupabase } from '@/utils/supabase/server';
import { isEmail } from 'validator';
import { isRateLimited } from '@/lib/rateLimit';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_ADDRESS = 20;

function invalidEmailResponse() {
  return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
}

function normaliseEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = normaliseEmail(body.email);
  if (!isEmail(email)) return invalidEmailResponse();

  // The same limit applies to every email, so the limit does not reveal which accounts exist.
  const address = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (
    isRateLimited(`email:${email}`, MAX_REQUESTS_PER_EMAIL, RATE_WINDOW_MS)
    || isRateLimited(`address:${address}`, MAX_REQUESTS_PER_ADDRESS, RATE_WINDOW_MS)
  ) {
    return NextResponse.json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429 });
  }

  // Send code. Use signInWithOtp so the Magic Link template can contain {{ .Token }}.
  // The same call and the same answer for every email, whatever sign-in method the account has,
  // so the response does not tell an attacker which addresses have accounts.
  const client = createAnonSupabase();
  try {
    await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  } catch {
    // Swallow the result: reporting it would reveal whether the email is registered.
  }

  return NextResponse.json({
    sent: true,
    message: 'If an account exists for that email, a verification code is on its way.',
  });
}
