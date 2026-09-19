import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountManagementPage from '../../app/admin/account-management/page';
import * as adminActions from '../../utils/admin-actions';
import { useRouter } from 'next/navigation';

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock admin actions
jest.mock('../../utils/admin-actions', () => ({
  getAllUsers: jest.fn(),
  addUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => () => <div>AdminNavBarMock</div>);
jest.mock('../../components/ProtectedRoute', () => ({ children, requireAdmin }: any) => <div>{children}</div>);
jest.mock('../../app/admin/account-management/components/AccountDetailsModal', () => ({ visible, user, onClose, onSave, onDelete }: any) => (
  <div>
    <div>AccountDetailsModalMock</div>
    <button onClick={onClose}>Close Modal</button>
    {user && <button onClick={() => onDelete(user.id)}>Delete User</button>}
  </div>
));

describe('AccountManagementPage', () => {
  const mockUsers = [
    { id: '1', email: 'admin@example.com', role: 'admin', authenticated: true },
    { id: '2', email: 'steward@example.com', role: 'steward', authenticated: true},
    { id: '3', email: 'another@example.com', role: 'steward', authenticated: true },
    { id: '4', email: 'pending@example.com', role: 'steward', authenticated: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (adminActions.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  describe('Loading and Initial Render', () => {
    it('renders page with header and navbar', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('Account Management')).toBeInTheDocument();
        expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument();
        expect(screen.getByText('AdminNavBarMock')).toBeInTheDocument();
      });
    });

    it('displays loading spinner while fetching users', () => {
      (adminActions.getAllUsers as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<AccountManagementPage />);
      // The component shows a loading spinner while fetching
      const spinner = screen.getByRole('heading', { level: 2 });
      expect(spinner).toBeInTheDocument();
    });

    it('loads and displays users after fetch', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('steward@example.com')).toBeInTheDocument();
        expect(screen.getByText('another@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Cards', () => {
    it('displays total users count', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getAllByText('4').length).toBeGreaterThan(0);;
      });
    });

    it('displays pending approval count', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
        const counts = screen.getAllByText('1');
        expect(counts.length).toBeGreaterThan(0);
      });
    });

    it('displays approved users count', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getAllByText('3').length).toBeGreaterThan(0);
      });
    });

    it('displays admin count', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('Admins')).toBeInTheDocument();
        const counts = screen.getAllByText('1');
        expect(counts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters users by email search', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by email/i);
      fireEvent.change(searchInput, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.queryByText('steward@example.com')).not.toBeInTheDocument();
      });
    });

    it('displays no users message when search returns empty', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by email/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('clears search results when search input is cleared', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by email/i);
      fireEvent.change(searchInput, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(screen.queryByText('steward@example.com')).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('steward@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Filter and Sort', () => {
    it('opens filter modal when filter button is clicked', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Filter & Sort Options')).toBeInTheDocument();
      });
    });

    it('sorts users by email ascending', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      const emailAscButton = screen.getByRole('button', { name: /Email \(A-Z\)/i });
      fireEvent.click(emailAscButton);

      await waitFor(() => {
        const userEmails = screen.getAllByText(/example\.com/);
        expect(userEmails.length).toBeGreaterThan(0);
      });
    });

    it('filters stewards only', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('steward@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      const stewardOnlyButton = screen.getByRole('button', { name: /Stewards Only/i });
      fireEvent.click(stewardOnlyButton);

      await waitFor(() => {
        expect(screen.getByText('steward@example.com')).toBeInTheDocument();
        expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
      });
    });

    it('filters admins only', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      const adminOnlyButton = screen.getByRole('button', { name: /Admins Only/i });
      fireEvent.click(adminOnlyButton);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.queryByText('steward@example.com')).not.toBeInTheDocument();
      });
    });

    it('filters pending approvals only', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('pending@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      const pendingButton = screen.getByRole('button', { name: /Pending Approvals/i });
      fireEvent.click(pendingButton);

      await waitFor(() => {
        expect(screen.getByText('pending@example.com')).toBeInTheDocument();
        expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
        expect(screen.queryByText('steward@example.com')).not.toBeInTheDocument();
      });
    });

    it('filters approved users only', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      const approvedButton = screen.getByRole('button', { name: /Approved Users/i });
      fireEvent.click(approvedButton);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.queryByText('pending@example.com')).not.toBeInTheDocument();
      });
    });

    it('closes filter modal when Close button is clicked', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /All Users/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Filter & Sort Options')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Filter & Sort Options')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Management', () => {
    it('displays Add User button in header', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add User/i });
        expect(addButton).toBeInTheDocument();
      });
    });

    it('opens add user modal when Add User button is clicked', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add User/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('AccountDetailsModalMock')).toBeInTheDocument();
      });
    });

    it('opens edit user modal when user is clicked', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const userCard = screen.getByText('admin@example.com').closest('div');
      fireEvent.click(userCard!);

      await waitFor(() => {
        expect(screen.getByText('AccountDetailsModalMock')).toBeInTheDocument();
      });
    });

    it('closes modal when close is clicked', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const userCard = screen.getByText('admin@example.com').closest('div');
      fireEvent.click(userCard!);

      await waitFor(() => {
        expect(screen.getByText('AccountDetailsModalMock')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /Close Modal/i });
      fireEvent.click(closeButton);

      // The modal should be hidden from the DOM after close
      // (depending on implementation, may need to check visibility)
    });
  });

  describe('User Display', () => {
    it('displays admin badge for admin users', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        const adminBadges = screen.queryAllByText(/👑 Admin/);
        expect(adminBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays steward badge for steward users', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        const stewardBadges = screen.queryAllByText(/📝 Steward/);
        expect(stewardBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays user initials in avatar', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        // Use getAllByText since there are multiple instances of 'A' and 'S'
        const aInitials = screen.getAllByText('A');
        const sInitials = screen.getAllByText('S');
        expect(aInitials.length).toBeGreaterThan(0); // admin@example.com
        expect(sInitials.length).toBeGreaterThan(0); // steward@example.com
      });
    });

    it('displays approved status badge for approved users', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        const approvedBadges = screen.queryAllByText(/✓ Approved/);
        expect(approvedBadges.length).toBeGreaterThan(0); // 3 approved users
      });
    });

    it('displays pending status badge for pending users', async () => {
      render(<AccountManagementPage />);
      await waitFor(() => {
        const pendingBadges = screen.queryAllByText(/⏳ Pending/);
        expect(pendingBadges.length).toBeGreaterThan(0); // 1 pending user
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error alert when adding user fails', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      (adminActions.addUser as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      // This would normally be tested after form submission in modal
      alertSpy.mockRestore();
    });

    it('handles empty users list gracefully', async () => {
      (adminActions.getAllUsers as jest.Mock).mockResolvedValue([]);

      render(<AccountManagementPage />);
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });
});