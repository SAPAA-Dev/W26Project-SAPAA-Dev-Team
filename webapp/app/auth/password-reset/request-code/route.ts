import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createAnonSupabase } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIST_PAGE_SIZE = 1000;
const LIST_MAX_PAGES = 10;

function invalidEmailResponse() {
  return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
}

function normaliseEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function providersOf(user: User) {
  const fromMetadata = user.app_metadata?.providers;
  if (Array.isArray(fromMetadata) && fromMetadata.length > 0) return fromMetadata as string[];
  return (user.identities ?? []).map((identity) => identity.provider);
}

type ExternalProvider = 'google' | 'azure';

// An account that only holds a linked Google or Microsoft identity has no password to reset.
function externalOnlyProvider(user: User): ExternalProvider | null {
  const providers = providersOf(user);
  if (providers.includes('email')) return null;
  if (providers.includes('google')) return 'google';
  if (providers.includes('azure')) return 'azure';
  return null;
}

// The admin API has no get-user-by-email call, so page through the users. This project has
// well under LIST_PAGE_SIZE users, and the loop stops at the first short page.
async function findUserByEmail(email: string): Promise<User | null> {
  for (let page = 1; page <= LIST_MAX_PAGES; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: LIST_PAGE_SIZE });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (users.length < LIST_PAGE_SIZE) return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = normaliseEmail(body.email);
  if (!EMAIL_PATTERN.test(email)) return invalidEmailResponse();

  let provider: ExternalProvider | null = null;
  try {
    const user = await findUserByEmail(email);
    if (user) provider = externalOnlyProvider(user);
  } catch {
    return NextResponse.json({ error: 'Could not send a code right now. Try again.' }, { status: 500 });
  }

  if (provider) {
    const name = provider === 'google' ? 'Google' : 'Microsoft';
    return NextResponse.json({
      providerRequired: provider,
      error: `This account signs in with ${name}. Reset your password in your ${name} account settings.`,
    });
  }

  // Send code. Use signInWithOtp so the Magic Link template can contain {{ .Token }}.
  // Response is the same for a known and an unknown email, so it does not tell an attacker which addresses have accounts.
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
