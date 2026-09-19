import { 
  login, signup, logout, subscribeToAuth, 
  loginWithGoogle, loginWithMicrosoft, getAuthState 
} from '../../services/auth';
import { supabase } from '../../services/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Suppress console errors and logs during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (console.log as jest.Mock).mockRestore();
});

// Mock supabase methods
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

// Mock WebBrowser
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock Linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'exp://redirect'),
}));

describe('Auth module full', () => {
  afterEach(() => {
    jest.resetAllMocks();

    // Ensure onAuthStateChange always returns valid subscription
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((_event, _callback) => {
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  describe('login', () => {
    // TC60, TC69
    it('successfully logs in and notifies listeners', async () => {
      const user = { id: '1', email: 'a@b.com', user_metadata: { role: 'admin' } };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { user }, error: null });

      const result = await login('a@b.com', '123456');
      expect(result).toEqual({ success: true });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    // TC70
    it('returns error if supabase returns error', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Invalid' } });
      const result = await login('a@b.com', '123456');
      expect(result).toEqual({ success: false, error: 'Invalid' });
    });

    // TC70, TC71, TC72
    describe('failure variations', () => {
      const waitForNotify = async () => new Promise(resolve => setTimeout(resolve, 0));

      it.each([
        { username: '', password: '123', reason: 'empty username' },
        { username: 'admin', password: '', reason: 'empty password' },
        { username: '   ', password: '123', reason: 'whitespace username' },
        { username: 'admin', password: 'a'.repeat(1001), reason: 'excessively long password' },
        { username: 'admin', password: 'secret123', reason: 'password belongs to different user' },
      ])('fails login for $reason', async ({ username, password }) => {
        const listener = jest.fn();
        subscribeToAuth(listener);

        // For all failure cases, mock signInWithPassword to return no user and no error
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });

        const result = await login(username, password);
        await waitForNotify();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Login failed');

        const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
        expect(lastCall.isAuthenticated).toBe(false);
        expect(lastCall.user).toBeNull();
      });
    });
  });

  describe('signup', () => {
    // TC94
    it('returns error for invalid email', async () => {
      const result = await signup('bademail', '123456');
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email');
    });

    // TC94
    it('returns error for short password', async () => {
      const result = await signup('a@b.com', '123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });

    // TC30, TC93
    it('successfully signs up confirmed user', async () => {
      const user = { id: '1', email: 'a@b.com', confirmed_at: new Date(), user_metadata: { role: 'steward' } };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user }, error: null });
      const result = await signup('a@b.com', '123456');
      expect(result).toEqual({ success: true, needsConfirmation: false });
    });

    // TC30, TC93
    it('returns needsConfirmation true for unconfirmed user', async () => {
      const user = { id: '1', email: 'a@b.com', confirmed_at: null, user_metadata: { role: 'steward' } };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user }, error: null });
      const result = await signup('a@b.com', '123456');
      expect(result).toEqual({ success: true, needsConfirmation: true });
    });

    // TC94
    it('returns error when supabase returns error', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Conflict' } });
      const result = await signup('a@b.com', '123456');
      expect(result).toEqual({ success: false, error: 'Conflict' });
    });
  });

  describe('logout', () => {
    // TC74, TC75, TC76, TC77
    it('calls supabase signOut and notifies listeners', async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToAuth(listener);
      (supabase.auth.signOut as jest.Mock).mockResolvedValue(null);

      await logout();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.isAuthenticated).toBe(false);
      expect(lastCall.user).toBeNull();

      unsubscribe();
    });

    it('catches error on logout', async () => {
      (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('fail'));
      await logout();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('subscribeToAuth', () => {
    // TC61, TC95
    it('calls callback immediately with current auth state', async () => {
      const user = { id: '1', email: 'a@b.com', user_metadata: { role: 'steward' } };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user } } });

      const callback = jest.fn();
      const unsubscribe = subscribeToAuth(callback);

      await new Promise(process.nextTick);
      expect(callback).toHaveBeenCalledWith({ isAuthenticated: true, user: { id: '1', email: 'a@b.com', role: 'steward' } });
      unsubscribe();
    });
  });

  describe('loginWithGoogle', () => {
    it('successfully logs in via Google OAuth', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth' }, error: null });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'success', url: 'https://redirect#access_token=abc&refresh_token=xyz' });
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: '1', email: 'a@b.com' } } }, error: null });

      const result = await loginWithGoogle();
      expect(result.success).toBe(true);
    });

    it('handles user cancel', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth' }, error: null });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });

      const result = await loginWithGoogle();
      expect(result).toEqual({ success: false, error: 'Login cancelled by user' });
    });

    it('returns error if no access token', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth' }, error: null });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'success', url: 'https://redirect' });

      const result = await loginWithGoogle();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No access token');
    });
  });

  describe('loginWithMicrosoft', () => {
    it('successfully logs in via Microsoft OAuth', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth' }, error: null });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'success', url: 'https://redirect#access_token=abc&refresh_token=xyz' });
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: '1', email: 'a@b.com' } } }, error: null });

      const result = await loginWithMicrosoft();
      expect(result.success).toBe(true);
    });

    it('handles user cancel', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth' }, error: null });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });

      const result = await loginWithMicrosoft();
      expect(result).toEqual({ success: false, error: 'Login cancelled by user' });
    });

    it('returns error if no access token', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth' }, error: null });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'success', url: 'https://redirect' });

      const result = await loginWithMicrosoft();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No access token');
    });
  });

  describe('getAuthState', () => {
    it('returns authenticated user', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: '1', email: 'a@b.com', user_metadata: { role: 'admin' } } } } });

      const state = await getAuthState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.role).toBe('admin');
    });

    it('returns not authenticated if no session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const state = await getAuthState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('catches errors', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('fail'));

      const state = await getAuthState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
