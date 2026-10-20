import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { requestOrigin } from '@/utils/requestOrigin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` is appended to the host, so accept only a same-site path. "//x", "/\x" and
  // ".evil.com" would otherwise send a freshly signed-in user to another host.
  const nextParam = searchParams.get('next');
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\')
    ? nextParam
    : '/sites';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      // Check if user is new by looking at created_at
      const userCreatedAt = new Date(session.user.created_at);
      const isNewUser = new Date().getTime() - userCreatedAt.getTime() < 10000; // 10 seconds

      // Set authenticated: false for new OAuth users. Only the service role can write
      // app_metadata, so a user cannot change their own role or approval flag.
      if (isNewUser && session.user.app_metadata?.authenticated === undefined) {
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SECRET!
        );

        await adminClient.auth.admin.updateUserById(session.user.id, {
          app_metadata: {
            ...session.user.app_metadata,
            authenticated: false,
            role: session.user.app_metadata?.role || 'steward'
          }
        });
      }

      return NextResponse.redirect(`${requestOrigin(request)}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${requestOrigin(request)}/auth/auth-code-error`);
}