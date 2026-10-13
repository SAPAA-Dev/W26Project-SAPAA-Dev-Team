import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

//Resend email confirmation to user
export async function resendConfirmation(email: string): Promise<void>{
  const { error } = await supabase.auth.resend({
  type: 'signup',
  email: email,
  options: {
    
    emailRedirectTo: `${window.location.origin}/auth/confirm`
  }

})
if (error) throw error
}

// Get current auth state from Supabase
export async function getAuthState(): Promise<AuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
      };
      return { isAuthenticated: true, user };
    }
  } catch (e) {
    console.error('Failed to load auth state', e);
  }
  return { isAuthenticated: false, user: null };
}

// Subscribe to auth changes. onAuthStateChange already emits SIGNED_IN and SIGNED_OUT
// for login() and logout(), so there is no second list of listeners to notify.
export function subscribeToAuth(callback: (state: AuthState) => void): () => void {
  getAuthState().then(callback);

  // Listen to Supabase auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
      };
      callback({ isAuthenticated: true, user });
    } else {
      callback({ isAuthenticated: false, user: null });
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Login function using Supabase Auth
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true };
    }

    return { success: false, error: 'Login failed' };
  } catch (e) {
    return { success: false, error: errorMessage(e, 'Login failed') };
  }
}

// Signup function using Supabase Auth
export async function signup(email: string, password: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email' };
  }
  
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    // The role and the approval flag live in app_metadata, which only the server can
    // write. They are not set here, so a new user reads as steward and unapproved
    // until an admin approves the account.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Check if user is already confirmed (email confirmation disabled)
      if (data.user.confirmed_at) {
        return { success: true, needsConfirmation: false };
      } else {
        // User needs to confirm email - don't log them in yet
        return { 
          success: true, 
          needsConfirmation: true 
        };
      }
    }

    return { success: false, error: 'Signup failed' };
  } catch (e) {
    return { success: false, error: errorMessage(e, 'Signup failed') };
  }
}

// OAuth login functions
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: errorMessage(e, 'Google sign in failed') };
  }
}

export async function signInWithMicrosoft(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email',
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: errorMessage(e, 'Microsoft sign in failed') };
  }
}

// Logout function using Supabase Auth. signOut() returns its error instead of throwing,
// so the caller must check `success`: on failure the session may still be valid, and a
// redirect to /login would tell the user that they are signed out when they are not.
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    console.error('Logout failed', e);
    return { success: false, error: errorMessage(e, 'Logout failed') };
  }
}