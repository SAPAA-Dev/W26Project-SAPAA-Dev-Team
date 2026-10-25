jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => {
      const response = {
        status: init?.status ?? 200,
        json: async () => body,
        cookies: { set: jest.fn() },
      };
      return response;
    }),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

import { POST } from '@/app/auth/password-reset/verify-code/route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function makeRequest(body: unknown) {
  return {
    url: 'http://localhost:3000/auth/password-reset/verify-code',
    headers: { get: () => null },
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    },
  };
}

describe('POST /auth/password-reset/verify-code', () => {
  const mockVerifyOtp = jest.fn();
  const mockCookieStore = { getAll: jest.fn(() => []), set: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    (createServerClient as jest.Mock).mockReturnValue({ auth: { verifyOtp: mockVerifyOtp } });
    mockVerifyOtp.mockResolvedValue({ data: { session: { access_token: 'a' } }, error: null });
  });

  it('5.0.2 AT2: rejects a code that is not six digits without verifying', async () => {
    const response = await POST(makeRequest({ email: 'e@example.com', code: '12ab' }) as never);

    expect(response.status).toBe(400);
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it('5.0.2 AT2: rejects the code on error from verifyOtp', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'invalid' } });

    const response = await POST(makeRequest({ email: 'e@example.com', code: '123456' }) as never);

    expect(response.status).toBe(400);
  });

  it('5.0.2 AT2: verifies the code with email type and keeps session in same browser', async () => {
    const response = await POST(makeRequest({ email: 'E@Example.com ', code: ' 654321 ' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(mockVerifyOtp).toHaveBeenCalledWith({ email: 'e@example.com', token: '654321', type: 'email' });
  });
});
