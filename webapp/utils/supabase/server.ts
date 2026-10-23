import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-only admin client using SUPABASE_SECRET.
 * This module must never be imported into client bundles.
 */
export function createServerSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET!
  );
}

/**
 * Server-only anonymous client that keeps no session. Use it for the password reset
 * code check: verifyOtp returns a session, and this client discards it instead of
 * writing login cookies for a user who is only proving they own the email.
 */
export function createAnonSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/**
 * Server client for user authentication with cookie handling.
 * Use this for routes that need to verify user sessions.
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Cookies can't be set once the response is sent (Server Components, and the PDF
          // job that runs in after()). Middleware refreshes the session, so skipping is safe.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Read-only cookie store.
          }
        },
      },
    }
  );
}