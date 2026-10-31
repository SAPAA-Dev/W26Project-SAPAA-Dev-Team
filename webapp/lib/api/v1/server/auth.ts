import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// The same rule as middleware and requireApprovedCaller in utils/supabase/queries.ts (not
// exported there): a signed-in user whose app_metadata.authenticated is true. Every /api/v1
// handler runs this before it touches the service-role client.

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface Caller {
  userId: string;
  email: string | null;
  isAdmin: boolean;
}

export async function requireCaller(): Promise<Caller> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user) throw new HttpError(401, 'Sign in required.');
  if (user.app_metadata?.authenticated !== true) {
    throw new HttpError(403, 'Your account is awaiting admin approval.');
  }
  return { userId: user.id, email: user.email ?? null, isAdmin: user.app_metadata?.role === 'admin' };
}

/** Admins may ask for inactive sites and disabled reports with ?includeInactive=1; anyone else gets the default. */
export function wantsInactive(caller: Caller, request: Request): boolean {
  return caller.isAdmin && new URL(request.url).searchParams.get('includeInactive') === '1';
}

/**
 * Safe reads may come from the browser's own cache for 30 s (then stale for 5 min while it refetches).
 * Vary: Cookie keeps one account's copy from another on a shared browser. The client reads past this
 * cache after any write it makes (see freshReads in client.ts). Admins change data through server
 * actions that cannot clear a browser cache, so their reads are never cached.
 */
const BROWSER_CACHE = { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=300', Vary: 'Cookie' };

/** Wraps a handler: checks the caller, returns its result as JSON, maps errors to {error}. */
export function route<Ctx>(
  handler: (caller: Caller, request: Request, ctx: Ctx) => Promise<unknown>,
  opts: { cache?: boolean } = {}
) {
  return async (request: Request, ctx: Ctx) => {
    try {
      const caller = await requireCaller();
      const headers = opts.cache && !caller.isAdmin ? BROWSER_CACHE : undefined;
      return NextResponse.json(await handler(caller, request, ctx), { headers });
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error('[api/v1]', error);
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
  };
}
