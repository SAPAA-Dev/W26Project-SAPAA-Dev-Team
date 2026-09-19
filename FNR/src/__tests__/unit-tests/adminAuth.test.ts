import { login, signup, logout, subscribeToAuth, getAllUsers, addUser, deleteUser, updateUser } from '../../services/adminAuth';
import { supabase } from '../../services/supabase';

// -------------------------
// Mock expo-constants env
// -------------------------
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      SUPABASE_URL: 'https://fake.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-123',
    },
  },
}));

// -------------------------
// Mock fetch for Edge Functions
// -------------------------
global.fetch = jest.fn();

// -------------------------
// Mock Supabase client
// -------------------------
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockAdminUpdateUser = jest.fn();

jest.mock('../../services/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: (...args) => mockSignIn(...args),
        signUp: (...args) => mockSignUp(...args),
        signOut: (...args) => mockSignOut(...args),

        getSession: () => mockGetSession(),

        onAuthStateChange: (cb) => {
          mockOnAuthStateChange(cb);
          return {
            data: {
              subscription: {
                unsubscribe: jest.fn(),
              },
            },
          };
        },
      },

      functions: {
        invoke: jest.fn(),
      },
    },
    __esModule: true,
  };
});

// Mock createClient() for admin supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      admin: {
        updateUserById: (...args) => mockAdminUpdateUser(...args),
      },
    },
  }),
}));

// Utility user used in multiple tests
const fakeUser = {
  id: '123',
  email: 'test@example.com',
  user_metadata: { role: 'steward' },
};

// ======================================================
//                 TEST SUITE
// ======================================================
describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ------------------------------
  // getAuthState() via subscribeToAuth
  // ------------------------------
  it('subscribeToAuth → calls initial callback with session user', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: fakeUser },
      },
    });

    const callback = jest.fn();
    subscribeToAuth(callback);

    // Wait for all pending promises to resolve
    await new Promise(process.nextTick);

    expect(callback).toHaveBeenCalledWith({
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'steward',
      },
    });
  });

  it('subscribeToAuth → calls callback with null user when no session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const callback = jest.fn();
    subscribeToAuth(callback);

    // Wait for all pending promises to resolve
    await new Promise(process.nextTick);

    expect(callback).toHaveBeenCalledWith({
      isAuthenticated: false,
      user: null,
    });
  });

  // ------------------------------
  // login()
  // ------------------------------
  it('login → success', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });

    const result = await login('test@example.com', 'pass123');

    expect(result).toEqual({ success: true });
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('login → failure with error message', async () => {
    mockSignIn.mockResolvedValue({
        data: null,              // <-- was {} before
        error: { message: 'Invalid credentials' },
    });

    const result = await login('bad@example.com', 'wrong');

    expect(result).toEqual({
        success: false,
        error: 'Invalid credentials',
    });
    });


  // ------------------------------
  // signup()
  // ------------------------------
  it('signup → invalid email fails', async () => {
    const result = await signup('bademail', '123456');
    expect(result).toEqual({ success: false, error: 'Invalid email' });
  });

  it('signup → too short password fails', async () => {
    const result = await signup('a@a.com', '123');
    expect(result).toEqual({ success: false, error: 'Password too short' });
  });

  it('signup → needs confirmation', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          ...fakeUser,
          confirmed_at: null,
        },
      },
      error: null,
    });

    const result = await signup('test@example.com', 'pass123');
    expect(result).toEqual({ success: true, needsConfirmation: true });
  });

  it('signup → auto-confirmed user logs in immediately', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          ...fakeUser,
          confirmed_at: 'now',
        },
      },
      error: null,
    });

    const result = await signup('test@example.com', 'pass123');
    expect(result).toEqual({ success: true, needsConfirmation: false });
  });

  it('signup → supabase returns error', async () => {
    mockSignUp.mockResolvedValue({
        data: null,             // <-- was {} before
        error: { message: 'Email already in use' },
    });

    const result = await signup('test@example.com', 'pass123');

    expect(result).toEqual({
        success: false,
        error: 'Email already in use',
    });
  });


  // ------------------------------
  // logout()
  // ------------------------------
  it('logout → calls supabase.signOut', async () => {
    mockSignOut.mockResolvedValue({});

    await logout();
    expect(mockSignOut).toHaveBeenCalled();
  });

  // ------------------------------
  // getAllUsers()
  // ------------------------------
  it('getAllUsers → returns parsed users list', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {
        users: [
          { id: '1', email: 'u1@test.com', user_metadata: { role: 'admin' } },
          { id: '2', email: 'u2@test.com' },
        ],
      },
    });

    const result = await getAllUsers();

    expect(result).toEqual([
      { id: '1', email: 'u1@test.com', role: 'admin' },
      { id: '2', email: 'u2@test.com', role: 'steward' },
    ]);
  });

  it('getAllUsers → error returns empty array', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // <- local spy

    (supabase.functions.invoke as jest.Mock).mockRejectedValue(new Error('failed'));

    const result = await getAllUsers();

    expect(result).toEqual([]);

    consoleSpy.mockRestore(); // <- restore console.error
    });


  // ------------------------------
  // addUser()
  // ------------------------------
  it('addUser → success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await addUser({
      email: 'x@y.com',
      password: 'pass',
      role: 'admin',
    });

    expect(result).toEqual({ success: true });
  });

  it('addUser → failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Bad request' }),
    });

    const result = await addUser({
        email: 'x@y.com',
        password: 'pass',
    });

    expect(result).toEqual({
        success: false,
        error: 'Bad request',
    });

    consoleSpy.mockRestore();
    });


  // ------------------------------
  // deleteUser()
  // ------------------------------
  it('deleteUser → success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await deleteUser('123');
    expect(result).toEqual({ success: true });
  });

  it('deleteUser → failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
    });

    const result = await deleteUser('123');

    expect(result).toEqual({
        success: false,
        error: 'Delete failed',
    });

    consoleSpy.mockRestore();
    });


  // ------------------------------
  // updateUser()
  // ------------------------------
  it('updateUser → success', async () => {
    mockAdminUpdateUser.mockResolvedValue({
      data: { id: '123' },
      error: null,
    });

    const result = await updateUser({
      id: '123',
      email: 'new@test.com',
      role: 'admin',
    });

    expect(result).toEqual({
      success: true,
      data: { id: '123' },
    });
  });

  it('updateUser → fails with error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockAdminUpdateUser.mockResolvedValue({
        error: { message: 'Cannot update' },
    });

    const result = await updateUser({
        id: '123',
        email: 'bad@test.com',
        role: 'steward',
    });

    expect(result).toEqual({
        success: false,
        error: 'Cannot update',
    });

    consoleSpy.mockRestore();
    });

});