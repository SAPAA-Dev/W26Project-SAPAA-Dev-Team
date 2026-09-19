'use client';

import { useEffect, useState } from 'react';
import { subscribeToAuth, type AuthState } from '@/services/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((state) => {
      setAuthState(state);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...authState,
    loading,
  };
}