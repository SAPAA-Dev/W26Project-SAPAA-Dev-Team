// import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export interface User {
  id: string;
  email: string;
  role: string; // role stored in user_metadata
  authenticated: boolean; // for the purpose of admin being able to approve users
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const AUTH_KEY = 'auth_user';
let listeners: Array<(state: AuthState) => void> = [];

// Complete the WebBrowser session on Android
WebBrowser.maybeCompleteAuthSession();

// Get current auth state from Supabase
export async function getAuthState(): Promise<AuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        // Read role from user_metadata; default to 'steward'
        role: session.user.user_metadata?.role || 'steward',
        authenticated: session.user.user_metadata?.authenticated || false,
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
  
  // Listen to Supabase auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event:any, session:any) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'steward',
        authenticated: session.user.user_metadata?.authenticated || false
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
        role: data.user.user_metadata?.role || 'steward',
        authenticated: data.user.user_metadata?.authenticated || false
      };
      notifyListeners({ isAuthenticated: true, user });
      return { success: true };
    }

    return { success: false, error: 'Login failed' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Login failed' };
  }
}

// OAuth Login with Google
export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Expo's URL for development
    const redirectUrl = Linking.createURL('auth/callback');
    
    console.log('=== OAuth Debug Info ===');
    console.log('Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('OAuth initiation error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      return { success: false, error: 'No OAuth URL returned from Supabase' };
    }

    console.log('OAuth URL from Supabase:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('WebBrowser result type:', result.type);
    console.log('WebBrowser result:', JSON.stringify(result, null, 2));

    if (result.type === 'success') {
      if (!result.url) {
        return { success: false, error: 'No URL in success result' };
      }

      console.log('Success URL:', result.url);
      
      // Parse the URL to get tokens
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1) || url.search);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error_description = params.get('error_description');

      if (error_description) {
        console.error('OAuth error in callback:', error_description);
        return { success: false, error: error_description };
      }

      console.log('Has access token:', !!accessToken);
      console.log('Has refresh token:', !!refreshToken);

      if (!accessToken) {
        console.error('No access token in URL params');
        return { success: false, error: 'No access token received' };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        return { success: false, error: sessionError.message };
      }

      if (sessionData?.session?.user) {
        const user: User = {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email || '',
          role: sessionData.session.user.user_metadata?.role || 'steward',
          authenticated: sessionData.session.user.user_metadata?.authenticated || false
        };
        notifyListeners({ isAuthenticated: true, user });
        return { success: true };
      }

      return { success: false, error: 'Failed to create session' };
    } else if (result.type === 'cancel') {
      console.log('User cancelled OAuth flow');
      return { success: false, error: 'Login cancelled by user' };
    } else {
      console.error('Unexpected result type:', result.type);
      return { success: false, error: 'OAuth flow failed' };
    }
  } catch (e: any) {
    console.error('OAuth error:', e);
    return { success: false, error: e.message || 'Google login failed' };
  }
}

// OAuth Login with Microsoft
export async function loginWithMicrosoft(): Promise<{ success: boolean; error?: string }> {
  try {
    const redirectUrl = Linking.createURL('auth/callback');
    
    console.log('=== Microsoft OAuth Debug Info ===');
    console.log('Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('OAuth initiation error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      return { success: false, error: 'No OAuth URL returned from Supabase' };
    }

    console.log('OAuth URL from Supabase:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('WebBrowser result type:', result.type);
    console.log('WebBrowser full result:', JSON.stringify(result, null, 2));

    if (result.type === 'success') {
      if (!result.url) {
        return { success: false, error: 'No URL in success result' };
      }

      console.log('Success URL:', result.url);
      console.log('URL length:', result.url.length);
      
      // Parse URL - Azure/Microsoft might return tokens differently
      let accessToken = null;
      let refreshToken = null;
      let error_description = null;
      
      try {
        // Try parsing as full URL
        const url = new URL(result.url);
        console.log('URL pathname:', url.pathname);
        console.log('URL hash:', url.hash);
        console.log('URL search:', url.search);
        
        // Check hash params first (most common for OAuth)
        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          error_description = hashParams.get('error_description');
          
          console.log('Hash params:', Array.from(hashParams.entries()));
        }
        
        // If no tokens in hash, check query params
        if (!accessToken && url.search) {
          const queryParams = new URLSearchParams(url.search);
          accessToken = queryParams.get('access_token');
          refreshToken = queryParams.get('refresh_token');
          error_description = error_description || queryParams.get('error_description');
          
          console.log('Query params:', Array.from(queryParams.entries()));
        }
        
        // Microsoft sometimes uses 'code' instead of tokens directly
        const code = url.hash ? 
          new URLSearchParams(url.hash.substring(1)).get('code') : 
          new URLSearchParams(url.search).get('code');
          
        if (code) {
          console.log('Received authorization code (not tokens):', !!code);
          // If we get a code, Supabase should handle the token exchange
          // Wait a moment for Supabase to process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if session was created
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              role: session.user.user_metadata?.role || 'steward',
              authenticated: session.user.user_metadata?.authenticated || false
            };
            notifyListeners({ isAuthenticated: true, user });
            return { success: true };
          }
        }
        
      } catch (urlError) {
        console.error('URL parsing error:', urlError);
        // If URL parsing fails, try manual string parsing
        console.log('Attempting manual URL parsing...');
        
        const hashMatch = result.url.match(/#(.+)$/);
        const queryMatch = result.url.match(/\?(.+?)(?:#|$)/);
        
        if (hashMatch) {
          const params = new URLSearchParams(hashMatch[1]);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
          console.log('Manual hash parsing - access token:', !!accessToken);
        } else if (queryMatch) {
          const params = new URLSearchParams(queryMatch[1]);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
          console.log('Manual query parsing - access token:', !!accessToken);
        }
      }

      if (error_description) {
        console.error('OAuth error in callback:', error_description);
        return { success: false, error: error_description };
      }

      console.log('Has access token:', !!accessToken);
      console.log('Has refresh token:', !!refreshToken);

      if (!accessToken) {
        console.error('No access token in URL params');
        console.error('Full URL for debugging:', result.url);
        return { success: false, error: 'No access token received from Microsoft' };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        return { success: false, error: sessionError.message };
      }

      if (sessionData?.session?.user) {
        const user: User = {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email || '',
          role: sessionData.session.user.user_metadata?.role || 'steward',
          authenticated: sessionData.session.user.user_metadata?.authenticated || false
        };
        notifyListeners({ isAuthenticated: true, user });
        return { success: true };
      }

      return { success: false, error: 'Failed to create session' };
    } else if (result.type === 'cancel') {
      console.log('User cancelled OAuth flow');
      return { success: false, error: 'Login cancelled by user' };
    } else {
      console.error('Unexpected result type:', result.type);
      return { success: false, error: 'OAuth flow failed' };
    }
  } catch (e: any) {
    console.error('OAuth error:', e);
    return { success: false, error: e.message || 'Microsoft login failed' };
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
        data: { role: 'steward', authenticated: false }, // default role when signing up & the admin approval state
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      if (data.user.confirmed_at) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'steward',
          authenticated: data.user.user_metadata?.authenticated || false
        };
        notifyListeners({ isAuthenticated: true, user });
        return { success: true, needsConfirmation: false };
      } else {
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

// Logout function using Supabase Auth
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
    notifyListeners({ isAuthenticated: false, user: null });
  } catch (e) {
    console.error('Logout failed', e);
  }
}
