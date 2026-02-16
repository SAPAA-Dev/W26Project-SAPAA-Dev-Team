import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProtectedRoute from '../../components/ProtectedRoute'; // adjust path
import * as useAuthHook from '@/hooks/useAuth';
import * as nextNavigation from 'next/navigation';
import * as supabaseClient from '@/utils/supabase/client';

jest.mock('@/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: () => new URLSearchParams(), 
}));
jest.mock('@/utils/supabase/client');

describe('ProtectedRoute Component', () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    pushMock = jest.fn();
    (nextNavigation.useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/somepath');
  });

  const mockUseAuth = (isAuthenticated = false, loading = false) => {
    (useAuthHook.useAuth as jest.Mock).mockReturnValue({ isAuthenticated, loading });
  };

  const mockSupabaseSession = (role: string | null = 'steward') => {
    const mockAuth = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: role ? { user: { id: '1', email: 'a@b.com', user_metadata: { role } } } : null },
      }),
    };
    (supabaseClient.createClient as jest.Mock).mockReturnValue({ auth: mockAuth });
  };

  it('renders loading state when auth or role is loading', () => {
    mockUseAuth(false, true);

    render(
      <ProtectedRoute>
        <div>Children</div>
      </ProtectedRoute>
    );

    // Only check for "Loading..." text since role="status" does not exist
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toHaveClass('font-medium');
  });

  it('redirects to login if not authenticated', async () => {
    mockUseAuth(false, false);
    mockSupabaseSession();

    render(
      <ProtectedRoute>
        <div>Children</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
  });

  it('renders children if authenticated and no admin required', async () => {
    mockUseAuth(true, false);
    mockSupabaseSession('steward');

    render(
      <ProtectedRoute>
        <div>Children Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Children Content')).toBeInTheDocument();
    });
  });

  it('shows access denied if admin required but user is not admin', async () => {
    mockUseAuth(true, false);
    mockSupabaseSession('steward');

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You need admin privileges to access this page.')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: /Go to Home/i });
      fireEvent.click(button);
      expect(pushMock).toHaveBeenCalledWith('/sites');
    });
  });

  it('renders children if admin required and user is admin', async () => {
    mockUseAuth(true, false);
    mockSupabaseSession('admin');

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  it('handles null user role gracefully', async () => {
    mockUseAuth(true, false);
    mockSupabaseSession(null); // no session

    render(
      <ProtectedRoute>
        <div>Children Content</div>
      </ProtectedRoute>
    );

    // Children should still render; no redirect occurs
    await waitFor(() => {
      expect(screen.getByText('Children Content')).toBeInTheDocument();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  it('handles error in getCurrentUserRole gracefully', async () => {
    mockUseAuth(true, false);
    const mockAuth = { getSession: jest.fn().mockRejectedValue(new Error('fail')) };
    (supabaseClient.createClient as jest.Mock).mockReturnValue({ auth: mockAuth });

    render(
      <ProtectedRoute>
        <div>Children Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Children Content')).toBeInTheDocument();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
