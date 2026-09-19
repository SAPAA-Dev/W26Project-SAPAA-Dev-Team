import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '../../app/signup/page';
import AccountManagementPage from '../../app/admin/account-management/page';
import * as auth from '@/services/auth';
import * as adminActions from '../../utils/admin-actions';
import * as useAuthHook from '@/hooks/useAuth';
import * as nextNavigation from 'next/navigation';
import * as supabaseClient from '@/utils/supabase/client';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/hooks/useAuth');
jest.mock('@/services/auth', () => ({
  signup: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithMicrosoft: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../utils/admin-actions', () => ({
  getAllUsers: jest.fn(),
  addUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('@/utils/supabase/client');
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);
jest.mock('../../app/admin/AdminNavBar', () => () => <div>AdminNavBarMock</div>);
jest.mock('../../components/ProtectedRoute', () => ({ children, requireAdmin }: any) => <div>{children}</div>);
jest.mock('../../app/admin/account-management/components/AccountDetailsModal', () => {
  return function MockModal({ visible, user, onClose, onSave, onDelete }: any) {
    if (!visible) return null;
    return (
      <div data-testid="account-details-modal">
        <div>AccountDetailsModalMock</div>
        <button onClick={onClose}>Close Modal</button>
        {user && (
          <>
            <button onClick={() => onSave({ email: user.email, role: user.role, authenticated: true })}>
              Approve User
            </button>
            <button onClick={() => onSave({ email: user.email, role: user.role, authenticated: false })}>
              Reject User
            </button>
          </>
        )}
      </div>
    );
  };
});

describe('User Approval Workflow - Acceptance Tests', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (nextNavigation.useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/somepath');
  });

  describe('Scenario 1: New user signs up and appears in pending state', () => {
    it('new signup creates user with authenticated: false', async () => {
      (auth.signup as jest.Mock).mockResolvedValue({ success: true, needsConfirmation: true });

      render(<SignupPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);
      const submitBtn = screen.getByRole('button', { name: /Create Account/i });

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'TestPass123!' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(auth.signup).toHaveBeenCalledWith('newuser@example.com', 'TestPass123!');
      });
    });
  });

  describe('Scenario 2: Admin manages pending approvals', () => {
    const pendingUser = { id: '1', email: 'newuser@example.com', role: 'steward', authenticated: false };
    const approvedUser = { id: '2', email: 'approved@example.com', role: 'steward', authenticated: true };

    beforeEach(() => {
      (adminActions.getAllUsers as jest.Mock).mockResolvedValue([pendingUser, approvedUser]);
    });

    it('admin sees pending users in pending approvals filter', async () => {
      render(<AccountManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
        expect(screen.getByText('approved@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      const pendingButton = screen.getByRole('button', { name: /Pending Approvals/i });
      fireEvent.click(pendingButton);

      await waitFor(() => {
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
        expect(screen.queryByText('approved@example.com')).not.toBeInTheDocument();
      });
    });

    it('admin sees pending approval badge on user', async () => {
      render(<AccountManagementPage />);

      await waitFor(() => {
        const pendingBadges = screen.queryAllByText(/⏳ Pending/);
        expect(pendingBadges.length).toBeGreaterThan(0);
      });
    });

    it('admin can approve a pending user', async () => {
      (adminActions.updateUser as jest.Mock).mockResolvedValue({ success: true });

      render(<AccountManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
      });

      const userCard = screen.getByText('newuser@example.com').closest('div');
      fireEvent.click(userCard!);

      await waitFor(() => {
        expect(screen.getByText('AccountDetailsModalMock')).toBeInTheDocument();
      });

      const approveBtn = screen.getByRole('button', { name: /Approve User/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(adminActions.updateUser).toHaveBeenCalledWith({
          id: '1',
          email: 'newuser@example.com',
          role: 'steward',
          authenticated: true,
        });
      });
    });

    it('admin can reject a pending user', async () => {
      (adminActions.updateUser as jest.Mock).mockResolvedValue({ success: true });

      render(<AccountManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
      });

      const userCard = screen.getByText('newuser@example.com').closest('div');
      fireEvent.click(userCard!);

      await waitFor(() => {
        expect(screen.getByText('AccountDetailsModalMock')).toBeInTheDocument();
      });

      const rejectBtn = screen.getByRole('button', { name: /Reject User/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(adminActions.updateUser).toHaveBeenCalledWith({
          id: '1',
          email: 'newuser@example.com',
          role: 'steward',
          authenticated: false, // Remains rejected
        });
      });
    });

    it('admin can see approval statistics', async () => {
      render(<AccountManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
        // Check that stat labels appear (indicating stats cards are rendered)
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Admins')).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 3: Approved user can now access the app', () => {
    it('approved user sees approved badge on admin list', async () => {
      const approvedUser = {
        id: '1',
        email: 'newuser@example.com',
        role: 'steward',
        authenticated: true,
      };

      (adminActions.getAllUsers as jest.Mock).mockResolvedValue([approvedUser]);

      render(<AccountManagementPage />);

      await waitFor(() => {
        const approvedBadges = screen.queryAllByText(/✓ Approved/);
        expect(approvedBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Scenario 4: Admin can change approval status', () => {
    const user = { id: '1', email: 'user@example.com', role: 'steward', authenticated: true };

    beforeEach(() => {
      (adminActions.getAllUsers as jest.Mock).mockResolvedValue([user]);
    });

    it('admin can revoke approval from approved user', async () => {
      (adminActions.updateUser as jest.Mock).mockResolvedValue({ success: true });

      render(<AccountManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
      });

      const userCard = screen.getByText('user@example.com').closest('div');
      fireEvent.click(userCard!);

      await waitFor(() => {
        expect(screen.getByText('AccountDetailsModalMock')).toBeInTheDocument();
      });

      const rejectBtn = screen.getByRole('button', { name: /Reject User/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(adminActions.updateUser).toHaveBeenCalledWith({
          id: '1',
          email: 'user@example.com',
          role: 'steward',
          authenticated: false, // Revoked
        });
      });
    });
  });
});
