jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: string) => ({ location: url })),
  },
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

import type { NextRequest } from 'next/server';
import { GET } from '@/app/auth/confirm/route';
import { createClient } from '@/utils/supabase/server';

const mockExchange = jest.fn();

async function confirm(query: string) {
  const res = await GET({ url: `http://localhost:3000/auth/confirm${query}` } as NextRequest);
  return (res as unknown as { location: string }).location;
}

describe('GET /auth/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });
  });

  it('exchanges the code and redirects to /sites', async () => {
    mockExchange.mockResolvedValue({ data: { session: {} }, error: null });

    expect(await confirm('?code=abc123')).toBe('http://localhost:3000/sites');
    expect(mockExchange).toHaveBeenCalledWith('abc123');
  });

  it('redirects to the error page when the exchange fails', async () => {
    mockExchange.mockResolvedValue({ data: { session: null }, error: { message: 'invalid flow state' } });

    expect(await confirm('?code=expired')).toBe('http://localhost:3000/auth/auth-code-error');
  });

  it('redirects to the error page without calling Supabase when the code is missing', async () => {
    expect(await confirm('')).toBe('http://localhost:3000/auth/auth-code-error');
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it('redirects to the error page when the code is blank', async () => {
    expect(await confirm('?code=')).toBe('http://localhost:3000/auth/auth-code-error');
    expect(mockExchange).not.toHaveBeenCalled();
  });
});
