import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSitesPage from '../../app/admin/sites/page';
import * as supabaseQueries from '@/utils/supabase/queries';
import { useRouter } from 'next/navigation';

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock supabase queries
jest.mock('@/utils/supabase/queries', () => ({
  getAllSites: jest.fn(),
  getCounties: jest.fn().mockResolvedValue([]),
  updateSite: jest.fn().mockResolvedValue(undefined),
  toggleSiteActive: jest.fn().mockResolvedValue(undefined),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => () => <div>AdminNavBarMock</div>);
jest.mock('@/components/ProtectedRoute', () => ({ children }: any) => <div>{children}</div>);

describe('AdminSitesPage – Disable Site', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it('shows inactive badge on deactivated site cards', async () => {
    const mockSites = [
      { id: 1, namesite: 'Active Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
      { id: 2, namesite: 'Disabled Site', county: 'CountyB', ab_county: 20, is_active: false, inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Active Site'));

    const inactiveBadges = screen.getAllByText('Inactive');
    expect(inactiveBadges).toHaveLength(1);
  });

  it('displays both active and inactive sites in admin view', async () => {
    const mockSites = [
      { id: 1, namesite: 'Active Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
      { id: 2, namesite: 'Inactive Site', county: 'CountyB', ab_county: 20, is_active: false, inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => {
      expect(screen.getByText('Active Site')).toBeInTheDocument();
      expect(screen.getByText('Inactive Site')).toBeInTheDocument();
    });
  });

  it('shows visibility toggle in edit modal with correct initial state', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByTestId('edit-site-button-1'));
    await waitFor(() => screen.getByTestId('edit-site-modal'));

    const toggle = screen.getByTestId('edit-site-active-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Visible to all users')).toBeInTheDocument();
  });

  it('deactivates a site via the edit modal toggle and save', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue(undefined);
    (supabaseQueries.toggleSiteActive as jest.Mock).mockResolvedValue(undefined);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByTestId('edit-site-button-1'));
    await waitFor(() => screen.getByTestId('edit-site-modal'));

    // Toggle off
    fireEvent.click(screen.getByTestId('edit-site-active-toggle'));
    expect(screen.getByText('Hidden from users')).toBeInTheDocument();

    // Save
    fireEvent.click(screen.getByTestId('edit-site-save-button'));

    await waitFor(() => {
      expect(supabaseQueries.toggleSiteActive).toHaveBeenCalledWith(1, false);
      expect(screen.queryByTestId('edit-site-modal')).not.toBeInTheDocument();
    });

    // Card should now show inactive badge
    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('reactivates an inactive site via the edit modal toggle and save', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: false, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue(undefined);
    (supabaseQueries.toggleSiteActive as jest.Mock).mockResolvedValue(undefined);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-site-button-1'));
    await waitFor(() => screen.getByTestId('edit-site-modal'));

    // Toggle should be off initially
    expect(screen.getByTestId('edit-site-active-toggle')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Hidden from users')).toBeInTheDocument();

    // Toggle on
    fireEvent.click(screen.getByTestId('edit-site-active-toggle'));
    expect(screen.getByText('Visible to all users')).toBeInTheDocument();

    // Save
    fireEvent.click(screen.getByTestId('edit-site-save-button'));

    await waitFor(() => {
      expect(supabaseQueries.toggleSiteActive).toHaveBeenCalledWith(1, true);
      expect(screen.queryByTestId('edit-site-modal')).not.toBeInTheDocument();
    });

    // Inactive badge should be gone
    await waitFor(() => {
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
    });
  });

  it('does not call toggleSiteActive when visibility is unchanged', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue(undefined);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByTestId('edit-site-button-1'));
    await waitFor(() => screen.getByTestId('edit-site-modal'));

    // Save without changing toggle
    fireEvent.click(screen.getByTestId('edit-site-save-button'));

    await waitFor(() => {
      expect(supabaseQueries.updateSite).toHaveBeenCalled();
      expect(supabaseQueries.toggleSiteActive).not.toHaveBeenCalled();
    });
  });
});
