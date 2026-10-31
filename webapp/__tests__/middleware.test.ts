// Each response gets a cookie jar. It is not enumerable, so toEqual ignores it.
function withCookies<T extends object>(response: T): T {
  const jar = new Map<string, { name: string; value: string }>();
  const cookies = {
    getAll: () => [...jar.values()],
    set: (nameOrCookie: string | { name: string; value: string }, value?: string) => {
      const cookie = typeof nameOrCookie === 'string' ? { name: nameOrCookie, value: value! } : nameOrCookie;
      jar.set(cookie.name, cookie);
    },
  };
  return Object.defineProperty(response, 'cookies', { value: cookies, enumerable: false });
}

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => withCookies({ type: 'next' })),
    redirect: jest.fn((url: URL) => withCookies({ type: 'redirect', location: url.toString() })),
    json: jest.fn((body, init) => withCookies({ type: 'json', status: init?.status ?? 200, body })),
  },
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

import { createServerClient } from '@supabase/ssr';
import { middleware } from '@/middleware';

// rotate: getUser() refreshes the session and writes a new auth cookie, as supabase-js does.
function signedInAs(user: unknown, rotate = false) {
  (createServerClient as jest.Mock).mockImplementation((_url, _key, options) => ({
    auth: {
      getUser: jest.fn(async () => {
        if (rotate) options.cookies.setAll([{ name: 'sb-auth', value: 'rotated', options: {} }]);
        return { data: { user } };
      }),
    },
  }));
}

function makeRequest(path: string, method = 'GET') {
  const url = new URL(`http://localhost${path}`);
  return {
    method,
    nextUrl: { pathname: url.pathname, clone: () => new URL(url.toString()) },
    cookies: { getAll: () => [], set: jest.fn() },
  } as unknown as Parameters<typeof middleware>[0];
}

const unapproved = { id: 'u1', app_metadata: { role: 'steward', authenticated: false } };
const approved = { id: 'u2', app_metadata: { role: 'steward', authenticated: true } };

describe('middleware approval gate (US 3.0.8, #5)', () => {
  it('redirects a signed-out user to /login (5.0.4 AT1)', async () => {
    signedInAs(null);
    const res = await middleware(makeRequest('/sites'));
    expect(res).toEqual({ type: 'redirect', location: 'http://localhost/login' });
  });

  it('lets an approved user through', async () => {
    signedInAs(approved);
    const res = await middleware(makeRequest('/detail/Some%20Site'));
    expect(res).toEqual({ type: 'next' });
  });

  it('opens the new sites page for an approved user and keeps the query and auth cookie', async () => {
    signedInAs(approved, true);
    const response = await middleware(makeRequest('/sites?view=map'));
    expect(response).toEqual({ type: 'redirect', location: 'http://localhost/v2/sites?view=map' });
    expect(response.cookies.getAll()).toEqual([expect.objectContaining({ name: 'sb-auth', value: 'rotated' })]);
  });

  it('lets an approved user load the new sites page without another redirect', async () => {
    signedInAs(approved);
    expect(await middleware(makeRequest('/v2/sites'))).toEqual({ type: 'next' });
  });

  it('does not redirect a server action on the old sites page', async () => {
    signedInAs(approved);
    expect(await middleware(makeRequest('/sites', 'POST'))).toEqual({ type: 'next' });
  });

  it('lets an unapproved user load /sites, which shows the awaiting-approval screen', async () => {
    signedInAs(unapproved);
    const res = await middleware(makeRequest('/sites'));
    expect(res).toEqual({ type: 'next' });
  });

  it('redirects an unapproved user from another page to /sites', async () => {
    signedInAs(unapproved);
    const res = await middleware(makeRequest('/detail/Some%20Site?tab=reports'));
    expect(res).toEqual({ type: 'redirect', location: 'http://localhost/sites' });
  });

  it('treats a user with no approval flag as unapproved', async () => {
    signedInAs({ id: 'u3', app_metadata: {} });
    const res = await middleware(makeRequest('/profile'));
    expect(res).toEqual({ type: 'redirect', location: 'http://localhost/sites' });
  });

  it('returns 403 to an unapproved user calling an API route', async () => {
    signedInAs(unapproved);
    const res = await middleware(makeRequest('/api/profile'));
    expect(res.status).toBe(403);
  });

  it('returns 403 to an unapproved user posting a server action, even on /sites', async () => {
    signedInAs(unapproved);
    const res = await middleware(makeRequest('/sites', 'POST'));
    expect(res.status).toBe(403);
  });

  it.each(['/login', '/signup', '/auth/callback', '/error'])(
    'lets an unapproved user reach %s',
    async (path) => {
      signedInAs(unapproved);
      const res = await middleware(makeRequest(path));
      expect(res).toEqual({ type: 'next' });
    }
  );

  it.each(['/loginfoo', '/errors'])('does not treat %s as an auth page', async (path) => {
    signedInAs(unapproved);
    const res = await middleware(makeRequest(path));
    expect(res).toEqual({ type: 'redirect', location: 'http://localhost/sites' });
  });

  it.each([
    ['a redirect to /sites', '/profile', 'GET'],
    ['a 403', '/api/profile', 'GET'],
  ])('keeps a rotated auth cookie on %s', async (_name, path, method) => {
    signedInAs(unapproved, true);
    const res = await middleware(makeRequest(path, method));
    expect(res.cookies.getAll()).toEqual([expect.objectContaining({ name: 'sb-auth', value: 'rotated' })]);
  });

  it('keeps a rotated auth cookie on the redirect to /login', async () => {
    signedInAs(null, true);
    const res = await middleware(makeRequest('/sites'));
    expect(res.cookies.getAll()).toEqual([expect.objectContaining({ name: 'sb-auth', value: 'rotated' })]);
  });
});
