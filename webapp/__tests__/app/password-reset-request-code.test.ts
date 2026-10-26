jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { POST } from '@/app/auth/password-reset/request-code/route';
import { createAnonSupabase } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

jest.mock('@/utils/supabase/server', () => ({
  createAnonSupabase: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  supabaseAdmin: { auth: { admin: { listUsers: jest.fn() } } },
}));

function makeRequest(body: unknown) {
  return {
    url: 'http://localhost:3000/auth/password-reset/request-code',
    headers: { get: () => null },
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    },
  };
}

describe('POST /auth/password-reset/request-code', () => {
  const mockListUsers = supabaseAdmin.auth.admin.listUsers as jest.Mock;
  const mockSignInWithOtp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createAnonSupabase as jest.Mock).mockReturnValue({ auth: { signInWithOtp: mockSignInWithOtp } });
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
  });

  it('5.0.2 AT1: rejects an invalid email without contacting Supabase', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email' }) as never);

    expect(response.status).toBe(400);
    expect(mockListUsers).not.toHaveBeenCalled();
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('5.0.2 AT1: rejects a body that is not JSON', async () => {
    const response = await POST(makeRequest(undefined) as never);

    expect(response.status).toBe(400);
  });

  it('5.0.2 AT1: tells a Google-only user to reset through Google and sends no code', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: 'u1', email: 'g@example.com', app_metadata: { providers: ['google'] } }] },
      error: null,
    });

    const response = await POST(makeRequest({ email: 'g@example.com' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.providerRequired).toBe('google');
    expect(body.error).toMatch(/Google/);
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('5.0.2 AT1: tells a Microsoft-only user to reset through Microsoft', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: 'u1', email: 'm@example.com', app_metadata: { providers: ['azure'] } }] },
      error: null,
    });

    const response = await POST(makeRequest({ email: 'm@example.com' }) as never);
    const body = await response.json();

    expect(body.providerRequired).toBe('azure');
    expect(body.error).toMatch(/Microsoft/);
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('5.0.2 AT1: falls back to the identities when app_metadata has no providers', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: 'u1', email: 'g@example.com', app_metadata: {}, identities: [{ provider: 'google' }] }] },
      error: null,
    });

    const response = await POST(makeRequest({ email: 'g@example.com' }) as never);

    expect((await response.json()).providerRequired).toBe('google');
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('5.0.2 AT1: sends a code for an email account', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: 'u1', email: 'e@example.com', app_metadata: { providers: ['email'] } }] },
      error: null,
    });

    const response = await POST(makeRequest({ email: 'E@Example.com ' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'e@example.com',
      options: { shouldCreateUser: false },
    });
  });

  it('5.0.2 AT1: answers the same generic message for an unknown email, so it does not reveal accounts', async () => {
    const response = await POST(makeRequest({ email: 'nobody@example.com' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(body.providerRequired).toBeUndefined();
    expect(mockSignInWithOtp).toHaveBeenCalled();
  });

  it('5.0.2 AT1: does not reveal a Supabase send error', async () => {
    mockSignInWithOtp.mockResolvedValue({ data: null, error: { message: 'rate limited' } });

    const response = await POST(makeRequest({ email: 'e@example.com' }) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).sent).toBe(true);
  });

  it('5.0.2 AT1: answers 500 when the user lookup fails', async () => {
    mockListUsers.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const response = await POST(makeRequest({ email: 'e@example.com' }) as never);

    expect(response.status).toBe(500);
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });
});
