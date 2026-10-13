import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn(() => ({})) }));

type CookieOptions = { cookies: { setAll: (c: { name: string; value: string; options: object }[]) => void } };

async function setAllWith(set: jest.Mock) {
  jest.mocked(cookies).mockResolvedValue({ getAll: () => [], set } as unknown as Awaited<ReturnType<typeof cookies>>);
  await createClient();
  const options = jest.mocked(createServerClient).mock.calls.at(-1)?.[2] as unknown as CookieOptions;
  return options.cookies.setAll;
}

describe('createClient cookie handling', () => {
  it('writes refreshed session cookies when the store allows it', async () => {
    const set = jest.fn();
    const setAll = await setAllWith(set);
    setAll([{ name: 'sb-token', value: 'v', options: {} }]);
    expect(set).toHaveBeenCalledWith('sb-token', 'v', {});
  });

  it('does not throw when the response is already sent (PDF job in after())', async () => {
    const set = jest.fn(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
    });
    const setAll = await setAllWith(set);
    expect(() => setAll([{ name: 'sb-token', value: 'v', options: {} }])).not.toThrow();
  });
});
