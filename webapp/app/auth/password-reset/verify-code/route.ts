import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

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
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!EMAIL_PATTERN.test(email) || !CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: 'Enter the six-digit code from your email.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const response = NextResponse.json({ verified: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) {
    return NextResponse.json(
      { error: 'That code is invalid or has expired. Request a new code and try again.' },
      { status: 400 },
    );
  }

  return response;
}
