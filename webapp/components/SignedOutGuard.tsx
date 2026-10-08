'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// Same public paths as middleware.ts.
const PUBLIC_PATHS = ['/login', '/signup', '/auth', '/error'];
const goToLogin = () => window.location.replace('/login');

// US 5.0.4 AT2: after sign-out, the Back button can restore a signed-in page from the
// browser cache without a request, so middleware never runs. Check the session when a
// page is shown and send signed-out users to the sign-in page.
export default function SignedOutGuard({
  redirect = goToLogin,
}: { redirect?: () => void }) {
  useEffect(() => {
    const check = async () => {
      if (PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))) return;
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) redirect();
    };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) void check(); };

    void check();
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [redirect]);

  return null;
}
