jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: string) => ({ location: url })),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ getAll: () => [], set: jest.fn() })),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      exchangeCodeForSession: jest.fn(async () => ({
        data: {
          session: {
            user: {
              id: 'u1',
              created_at: '2020-01-01T00:00:00Z',
              app_metadata: { role: 'steward', authenticated: true },
            },
          },
        },
        error: null,
      })),
    },
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { GET } from '@/app/auth/callback/route';

function callback(query: string) {
  return GET({
    url: `http://localhost:3000/auth/callback?code=abc${query}`,
    headers: { get: () => null },
  } as unknown as Parameters<typeof GET>[0]) as unknown as Promise<{ location: string }>;
}

describe('OAuth callback next parameter', () => {
  it('redirects to a same-site path', async () => {
    const res = await callback('&next=/profile');
    expect(res.location).toBe('http://localhost:3000/profile');
  });

  it('defaults to /sites with no next', async () => {
    const res = await callback('');
    expect(res.location).toBe('http://localhost:3000/sites');
  });

  it.each(['.evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', '@evil.com'])(
    'falls back to /sites for %s',
    async (next) => {
      const res = await callback(`&next=${encodeURIComponent(next)}`);
      expect(res.location).toBe('http://localhost:3000/sites');
    }
  );
});
