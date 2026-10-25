const mockCreateClient = jest.fn();

jest.mock('../../utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import { requireApprovedAdmin, requireApprovedCaller } from '../../utils/auth-checks';

function mockCaller(user: unknown, error: unknown = null) {
  mockCreateClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error }) },
  });
}

function approvedUser(role: string, email: string | null = 'user@example.com') {
  return { id: 'caller-id', email, app_metadata: { role, authenticated: true } };
}

describe('auth-checks', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('requireApprovedCaller', () => {
    it('refuses a signed-out caller', async () => {
      mockCaller(null);

      await expect(requireApprovedCaller()).rejects.toThrow(
        'You must be signed in to view site boundaries.'
      );
    });

    it('refuses when getUser returns an error', async () => {
      mockCaller(null, { message: 'network error' });

      await expect(requireApprovedCaller()).rejects.toThrow(
        'You must be signed in to view site boundaries.'
      );
    });

    it('refuses an unapproved caller', async () => {
      mockCaller({
        id: 'caller-id',
        email: 'user@example.com',
        app_metadata: { role: 'steward', authenticated: false },
      });

      await expect(requireApprovedCaller()).rejects.toThrow(
        'You must be signed in to view site boundaries.'
      );
    });

    it('accepts an approved steward', async () => {
      mockCaller(approvedUser('steward'));

      await expect(requireApprovedCaller()).resolves.toEqual({
        isAdmin: false,
        userId: 'caller-id',
        email: 'user@example.com',
      });
    });

    it('accepts an approved admin and reports the admin flag', async () => {
      mockCaller(approvedUser('admin', null));

      await expect(requireApprovedCaller()).resolves.toEqual({
        isAdmin: true,
        userId: 'caller-id',
        email: null,
      });
    });

    it('does not trust an admin role stored only in user_metadata', async () => {
      mockCaller({
        id: 'caller-id',
        email: 'user@example.com',
        app_metadata: { authenticated: true },
        user_metadata: { role: 'admin' },
      });

      await expect(requireApprovedCaller()).resolves.toEqual({
        isAdmin: false,
        userId: 'caller-id',
        email: 'user@example.com',
      });
    });

    it('uses the given message', async () => {
      mockCaller(null);

      await expect(requireApprovedCaller('Custom message.')).rejects.toThrow('Custom message.');
    });
  });

  describe('requireApprovedAdmin', () => {
    it('refuses a signed-out caller', async () => {
      mockCaller(null);

      await expect(requireApprovedAdmin()).rejects.toThrow('Only admins can edit sites.');
    });

    it('refuses an unapproved caller', async () => {
      mockCaller({
        id: 'caller-id',
        email: 'user@example.com',
        app_metadata: { role: 'admin', authenticated: false },
      });

      await expect(requireApprovedAdmin()).rejects.toThrow('Only admins can edit sites.');
    });

    it('refuses an approved steward', async () => {
      mockCaller(approvedUser('steward'));

      await expect(requireApprovedAdmin()).rejects.toThrow('Only admins can edit sites.');
    });

    it('accepts an approved admin and returns the user id', async () => {
      mockCaller(approvedUser('admin'));

      await expect(requireApprovedAdmin()).resolves.toEqual({ userId: 'caller-id' });
    });

    it('refuses an admin role stored only in user_metadata', async () => {
      mockCaller({
        id: 'caller-id',
        email: 'user@example.com',
        app_metadata: { authenticated: true },
        user_metadata: { role: 'admin' },
      });

      await expect(requireApprovedAdmin()).rejects.toThrow('Only admins can edit sites.');
    });

    it('uses the given message', async () => {
      mockCaller(approvedUser('steward'));

      await expect(requireApprovedAdmin('Custom message.')).rejects.toThrow('Custom message.');
    });
  });
});
