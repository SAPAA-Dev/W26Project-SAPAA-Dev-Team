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

let listeners: Array<(state: AuthState) => void> = [];

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

// Notify all listeners
export function notifyListeners(state: AuthState) {
  listeners.forEach(fn => fn(state));
}

// Subscribe to auth changes
export function subscribeToAuth(callback: (state: AuthState) => void): () => void {
  listeners.push(callback);
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
    listeners = listeners.filter(fn => fn !== callback);
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
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
      };
      notifyListeners({ isAuthenticated: true, user });
      return { success: true };
    }

    return { success: false, error: 'Login failed' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Login failed' };
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: { role: 'steward', authenticated: false },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Check if user is already confirmed (email confirmation disabled)
      if (data.user.confirmed_at) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
        };
        notifyListeners({ isAuthenticated: true, user });
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
  } catch (e: any) {
    return { success: false, error: e.message || 'Signup failed' };
  }
}

// OAuth login functions
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Google sign in failed' };
  }
}

export async function signInWithMicrosoft(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
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
  } catch (e: any) {
    return { success: false, error: e.message || 'Microsoft sign in failed' };
  }
}

// Logout function using Supabase Auth
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
    notifyListeners({ isAuthenticated: false, user: null });
  } catch (e) {
    console.error('Logout failed', e);
  }
}