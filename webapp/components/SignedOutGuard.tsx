'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// Same public paths as middleware.ts.
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth', '/error'];
const goToLogin = () => window.location.replace('/login');

// US 5.0.4 AT2: after sign-out, the Back button can restore a signed-in page from the
// browser cache without a request, so middleware never runs. Check the session when a
// page is shown and send signed-out users to the sign-in page.
export default function SignedOutGuard({
  redirect = goToLogin,
}: { redirect?: () => void }) {
  useEffect(() => {
    const client = createClient();
    let userId: string | null | undefined;
    const isPublic = () => PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path));
    const check = async () => {
      if (isPublic() && userId == null) return;
      const { data: { session } } = await client.auth.getSession();
      const nextUserId = session?.user?.id ?? null;
      if (!session || (userId != null && userId !== nextUserId)) redirect();
      userId = nextUserId;
    };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) void check(); };

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      // A new document clears cached private answers and roles from the previous account.
      if ((event === 'SIGNED_OUT' && !isPublic()) || (userId != null && userId !== nextUserId)) redirect();
      userId = nextUserId;
    });
    void check();
    window.addEventListener('pageshow', onPageShow);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [redirect]);

  return null;
}
