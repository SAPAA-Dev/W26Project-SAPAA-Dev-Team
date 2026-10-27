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
import { clearRateLimits } from '@/lib/rateLimit';

jest.mock('@/utils/supabase/server', () => ({
  createAnonSupabase: jest.fn(),
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
  const mockSignInWithOtp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    clearRateLimits();
    (createAnonSupabase as jest.Mock).mockReturnValue({ auth: { signInWithOtp: mockSignInWithOtp } });
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
  });

  it('5.0.2 AT1: rejects an invalid email without contacting Supabase', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email' }) as never);

    expect(response.status).toBe(400);
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('5.0.2 AT1: rejects a body that is not JSON', async () => {
    const response = await POST(makeRequest(undefined) as never);

    expect(response.status).toBe(400);
  });

  it('5.0.2 AT1: sends a code for any account, whatever sign-in method it has, with no user lookup', async () => {
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

  it('5.0.2 AT1: refuses the fourth request for the same email in ten minutes, with the same answer for any email', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await POST(makeRequest({ email: 'busy@example.com' }) as never)).status).toBe(200);
    }

    const limited = await POST(makeRequest({ email: 'BUSY@example.com' }) as never);
    const other = await POST(makeRequest({ email: 'other@example.com' }) as never);

    expect(limited.status).toBe(429);
    expect(other.status).toBe(200);
    expect(mockSignInWithOtp).toHaveBeenCalledTimes(4);
  });
});
