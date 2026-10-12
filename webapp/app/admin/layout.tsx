import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// ProtectedRoute checks the admin role in the browser, and admin/sites/[id] has no
// ProtectedRoute at all. This server check covers every page under /admin.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== 'admin' || user?.app_metadata?.authenticated !== true) {
    redirect('/sites');
  }

  return <>{children}</>;
}
