import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

let listeners: Array<(state: AuthState) => void> = [];

// Runtime guard to ensure env variables exist
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Constants.expoConfig?.extra || {};
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in expoConfig.extra");
}

// Get current auth state from Supabase
async function getAuthState(): Promise<AuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'steward',
      };
      return { isAuthenticated: true, user };
    }
  } catch (e) {
    console.error('Failed to load auth state', e);
  }
  return { isAuthenticated: false, user: null };
}

// Notify all listeners
function notifyListeners(state: AuthState) {
  listeners.forEach(fn => fn(state));
}

// Subscribe to auth changes
export function subscribeToAuth(callback: (state: AuthState) => void): () => void {
  listeners.push(callback);
  getAuthState().then(callback);

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'steward',
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

// Login
export async function login(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: error.message };

    if (data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        role: data.user.user_metadata?.role || 'steward',
      };
      notifyListeners({ isAuthenticated: true, user });
      return { success: true };
    }
    return { success: false, error: 'Login failed' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Login failed' };
  }
}

// Signup
export async function signup(email: string, password: string) {
  if (!email.includes('@')) return { success: false, error: 'Invalid email' };
  if (!password || password.length < 6) return { success: false, error: 'Password too short' };

  try {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { success: false, error: error.message };

    if (data.user) {
      if (data.user.confirmed_at) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'steward',
        };
        notifyListeners({ isAuthenticated: true, user });
        return { success: true, needsConfirmation: false };
      } else {
        return { success: true, needsConfirmation: true };
      }
    }
    return { success: false, error: 'Signup failed' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Signup failed' };
  }
}

// Logout
export async function logout() {
  try {
    await supabase.auth.signOut();
    notifyListeners({ isAuthenticated: false, user: null });
  } catch (e) {
    console.error('Logout failed', e);
  }
}

// ADMIN FUNCTIONS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-users');
    if (error) throw error;

    return (data.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email ?? '',
      role: u.user_metadata?.role ?? 'steward',
    }));
  } catch (e: any) {
    console.error('Failed to get users', e);
    return [];
  }
}

export async function addUser(newUser: { email: string; password: string; role?: string }) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/add-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(newUser),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Unknown error');
    return { success: true };
  } catch (e: any) {
    console.error('Add user failed', e);
    return { success: false, error: e.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unknown error');
    return { success: true };
  } catch (e: any) {
    console.error('Delete user failed', e);
    return { success: false, error: e.message };
  }
}

// updateUser
export async function updateUser(data: { id: string; email: string; password?: string; role: string }) {
  try {
    const { id, email, password, role } = data;
    const updateData: any = { email, user_metadata: { role } };
    if (password) updateData.password = password;

    const { data: updatedUser, error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (error) throw error;
    return { success: true, data: updatedUser };
  } catch (e: any) {
    console.error('Update user failed', e);
    return { success: false, error: e.message };
  }
}
