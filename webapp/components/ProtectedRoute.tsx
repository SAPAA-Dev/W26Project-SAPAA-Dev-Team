'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/services/auth';
import { Loader2, ShieldAlert, Clock } from 'lucide-react';

async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    return session.user.user_metadata?.role ?? 'steward';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

async function getCurrentUserAuthenicationStatus(): Promise<boolean | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    return session.user.user_metadata?.authenticated ?? false;
  } catch (error) {
    console.error('Error getting user authentication:', error);
    return null;
  }
}

export default function ProtectedRoute({ 
  children,
  requireAdmin = false 
}: { 
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      const authorized = await getCurrentUserAuthenicationStatus();
      setIsAuthorized(authorized);
      if (isAuthenticated && authorized) {
        const role = await getCurrentUserRole();
        setUserRole(role);
      }
      setRoleLoading(false);
    };
    
    if (!loading) {
      fetchRole();
    }
  }, [isAuthenticated, loading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#356B43] mx-auto mb-4" />
          <p className="text-[#7A8075] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated but awaiting admin approval
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEF3E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-[#D98C30]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Awaiting Admin Approval</h2>
          <p className="text-[#7A8075] mb-6">
            Your account has been created successfully, but an administrator needs to review and approve your access before you can use the application.
          </p>
          <p className="text-sm text-[#7A8075] mb-6">
            You'll receive an email notification once you've been approved. This typically happens within 24 hours.
          </p>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Admin required but user is not admin
  if (requireAdmin && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Access Denied</h2>
          <p className="text-[#7A8075] mb-6">You need admin privileges to access this page.</p>
          <button
            onClick={() => router.push('/sites')}
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}