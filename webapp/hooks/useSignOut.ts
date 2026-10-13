'use client';

import { useState } from 'react';
import { logout } from '@/services/auth';

export const SIGN_OUT_ERROR = 'Sign-out failed. Check your connection and try again.';

// US 5.0.4: one sign-out flow for every sign-out button. When sign-out fails, the
// session can still be valid, so the user stays on the page and sees an error instead
// of a redirect to /login that says they are signed out. SignedOutGuard handles the
// Back button after a successful sign-out.
export function useSignOut(redirect: () => void) {
  const [error, setError] = useState<string | null>(null);

  const signOut = async (): Promise<boolean> => {
    setError(null);
    const result = await logout();
    if (!result.success) {
      setError(SIGN_OUT_ERROR);
      return false;
    }
    redirect();
    return true;
  };

  return { signOut, error };
}
