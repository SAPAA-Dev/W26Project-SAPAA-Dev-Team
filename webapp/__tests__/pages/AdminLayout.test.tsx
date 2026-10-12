jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminLayout from '@/app/admin/layout';

function signedInAs(user: unknown) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn(async () => ({ data: { user } })) },
  });
}

describe('admin layout server gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders admin pages for an approved admin', async () => {
    signedInAs({ app_metadata: { role: 'admin', authenticated: true } });
    const page = await AdminLayout({ children: 'admin page' });
    expect(page.props.children).toBe('admin page');
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([
    ['a steward', { app_metadata: { role: 'steward', authenticated: true } }],
    ['an unapproved admin', { app_metadata: { role: 'admin', authenticated: false } }],
    ['no user', null],
  ])('redirects %s to /sites', async (_label, user) => {
    signedInAs(user);
    await expect(AdminLayout({ children: 'admin page' })).rejects.toThrow('NEXT_REDIRECT /sites');
    expect(redirect).toHaveBeenCalledWith('/sites');
  });
});
