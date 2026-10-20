jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { POST } from '@/app/auth/password-reset/verify-code/route';
import { createAnonSupabase, createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createAnonSupabase: jest.fn(),
  createClient: jest.fn(),
}));

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return {
    url: 'http://localhost:3000/auth/password-reset/verify-code',
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    },
  };
}

describe('POST /auth/password-reset/verify-code', () => {
  const mockVerifyOtp = jest.fn();
  const mockResetPasswordForEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createAnonSupabase as jest.Mock).mockReturnValue({ auth: { verifyOtp: mockVerifyOtp } });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { resetPasswordForEmail: mockResetPasswordForEmail },
    });
    mockVerifyOtp.mockResolvedValue({ data: { session: { access_token: 'a' } }, error: null });
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  });

  it('rejects a code that is not six digits without verifying', async () => {
    const response = await POST(makeRequest({ email: 'e@example.com', code: '12ab' }) as never);

    expect(response.status).toBe(400);
    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing session with no error', { data: { session: null }, error: null }],
    ['an error from verifyOtp', { data: { session: null }, error: { message: 'invalid' } }],
  ])('rejects the code on %s and does not send a reset link', async (_label, result) => {
    mockVerifyOtp.mockResolvedValue(result);

    const response = await POST(makeRequest({ email: 'e@example.com', code: '123456' }) as never);

    expect(response.status).toBe(400);
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('verifies the code and only then sends the reset link', async () => {
    const response = await POST(makeRequest({ email: 'E@Example.com ', code: ' 654321 ' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(mockVerifyOtp).toHaveBeenCalledWith({ email: 'e@example.com', token: '654321', type: 'email' });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('e@example.com', {
      redirectTo: 'http://localhost:3000/auth/callback?next=/reset-password',
    });
  });

  it('uses the forwarded host in production so the link returns to the deployed site', async () => {
    const previous = process.env.NODE_ENV;
    // NODE_ENV is read-only in the type, but the runtime value is writable.
    (process.env as Record<string, string>).NODE_ENV = 'production';
    try {
      await POST(makeRequest({ email: 'e@example.com', code: '123456' }, { 'x-forwarded-host': 'sapaa.example' }) as never);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('e@example.com', {
        redirectTo: 'https://sapaa.example/auth/callback?next=/reset-password',
      });
    } finally {
      (process.env as Record<string, string>).NODE_ENV = previous ?? 'test';
    }
  });

  it('keeps the browser host in development so the PKCE verifier cookie matches', async () => {
    const previous = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';
    try {
      await POST(makeRequest({ email: 'e@example.com', code: '123456' }, { host: '127.0.0.1:3000' }) as never);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('e@example.com', {
        redirectTo: 'http://127.0.0.1:3000/auth/callback?next=/reset-password',
      });
    } finally {
      (process.env as Record<string, string>).NODE_ENV = previous ?? 'test';
    }
  });

  it('answers 500 when the reset link cannot be sent', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: { message: 'smtp down' } });

    const response = await POST(makeRequest({ email: 'e@example.com', code: '123456' }) as never);

    expect(response.status).toBe(500);
  });
});
