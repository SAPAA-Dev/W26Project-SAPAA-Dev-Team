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
  getArchivedSites: jest.fn().mockResolvedValue([]),
  getCounties: jest.fn().mockResolvedValue([]),
  getProtectedAreaChoices: jest.fn().mockResolvedValue([]),
  updateSite: jest.fn().mockResolvedValue({ ok: true }),
  toggleSiteActive: jest.fn().mockResolvedValue(undefined),
  getTotalInspectionCount: jest.fn().mockResolvedValue(0),
}));

// Mock next/image
jest.mock('next/image', () => function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element -- test mock of next/image
  return <img {...props} alt={props.alt} />;
});

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => function MockAdminNavBar() { return <div>AdminNavBarMock</div>; });
jest.mock('@/components/ProtectedRoute', () => function MockProtectedRoute({ children }: { children: React.ReactNode }) { return <div>{children}</div>; });

describe('AdminSitesPage – Disable Site (US 2.0.3)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it('shows inactive badge on deactivated site cards (2.0.3 AT1)', async () => {
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

  it('displays both active and inactive sites in admin view (2.0.3 AT1)', async () => {
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

  it('US 2.0.3: disables User View for an inactive site and encodes the site name (L29)', async () => {
    const mockSites = [
      { id: 1, namesite: 'Bilby #2 / East', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
      { id: 2, namesite: 'Inactive Site', county: 'CountyB', ab_county: 20, is_active: false, inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Inactive Site'));

    expect(screen.getByTestId('user-view-button-2')).toBeDisabled();
    fireEvent.click(screen.getByTestId('user-view-button-2'));
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('user-view-button-1'));
    expect(mockPush).toHaveBeenCalledWith('/detail/Bilby%20%232%20%2F%20East');
  });

  it('shows visibility toggle in edit modal with correct initial state (2.0.3 AT1)', async () => {
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

  it('deactivates a site via the edit modal toggle and save (2.0.3 AT1)', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue({ ok: true });
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

  it('reactivates an inactive site via the edit modal toggle and save (2.0.3 AT3)', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: false, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue({ ok: true });
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

  it.each([
    ['refuses', 'Only approved admins can manage sites.'],
    ['fails', 'Failed to update site status'],
  ])('keeps a site inactive and shows the error when the server %s the reactivation (2.0.3 AT3)', async (_label, message) => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue([
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: false, inspectdate: new Date().toISOString() },
    ]);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([{ id: 10, county: 'CountyA' }]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue({ ok: true });
    (supabaseQueries.toggleSiteActive as jest.Mock).mockRejectedValue(new Error(message));

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByTestId('edit-site-button-1'));
    await waitFor(() => screen.getByTestId('edit-site-modal'));
    fireEvent.click(screen.getByTestId('edit-site-active-toggle'));
    fireEvent.click(screen.getByTestId('edit-site-save-button'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(message));
    expect(supabaseQueries.toggleSiteActive).toHaveBeenCalledWith(1, true);
    // The modal stays open, and the card still shows the old state.
    expect(screen.getByTestId('edit-site-modal')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it('shows the saved name when the name saves but the status change fails (2.0.3 AT3)', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue([
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: false, inspectdate: new Date().toISOString() },
    ]);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([{ id: 10, county: 'CountyA' }]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue({ ok: true });
    (supabaseQueries.toggleSiteActive as jest.Mock).mockRejectedValue(new Error('Failed to update site status'));

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByTestId('edit-site-button-1'));
    await waitFor(() => screen.getByTestId('edit-site-modal'));
    const nameInput = screen.getByDisplayValue('Alpha');
    fireEvent.change(nameInput, { target: { value: 'Alpha Renamed' } });
    fireEvent.click(screen.getByTestId('edit-site-active-toggle'));
    fireEvent.click(screen.getByTestId('edit-site-save-button'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to update site status'));
    // The rename reached the database, so the list shows it; the status did not change.
    expect(screen.getAllByText('Alpha Renamed').length).toBeGreaterThan(0);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it('does not call toggleSiteActive when visibility is unchanged (2.0.3 AT1)', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([
      { id: 10, county: 'CountyA' },
    ]);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue({ ok: true });

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
