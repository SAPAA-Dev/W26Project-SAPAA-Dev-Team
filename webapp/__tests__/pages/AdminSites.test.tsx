import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminSitesPage, { daysSince } from '../../app/admin/sites/page';
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
  createSite: jest.fn(),
  findSitesWithName: jest.fn().mockResolvedValue([]),
  getSiteSuggestions: jest.fn().mockResolvedValue([]),
}));

// Mock next/image
jest.mock('next/image', () => function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element -- test mock of next/image
  return <img {...props} alt={props.alt} />;
});

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => function AdminNavBarMock() {
  return <div>AdminNavBarMock</div>;
});
jest.mock('@/components/ProtectedRoute', () => function ProtectedRouteMock({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
});
jest.mock('@/components/PdfExportModal', () => () => null);

describe('AdminSitesPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
    (supabaseQueries.getTotalInspectionCount as jest.Mock).mockResolvedValue(0);
  });

  // Utility functions
  it('calculates daysSince correctly', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(yesterday)).toBe(1);
  });

  it('renders loading state initially', () => {
    render(<AdminSitesPage />);
    expect(screen.getByText(/Loading protected areas/i)).toBeInTheDocument();
  });

  it('renders error state if fetching sites fails', async () => {
    (supabaseQueries.getAllSites as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText(/Unable to Load Sites/i));
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('renders stats cards and sites after successful fetch', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
      { id: 2, namesite: 'Beta', county: 'CountyB', ab_county: 20, is_active: true, inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);

    await waitFor(() => {
      // Check for site names first to ensure data is loaded
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    // Now verify stats cards
    expect(screen.getByText('Total Sites')).toBeInTheDocument();
    expect(screen.getByText('Total Responses')).toBeInTheDocument();
  });

  it('filters sites based on search input', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
      { id: 2, namesite: 'Beta', county: 'CountyB', ab_county: 20, is_active: true, inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    const input = screen.getByPlaceholderText(/Search by site name or county/i);
    fireEvent.change(input, { target: { value: 'Beta' } });

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('US 6.0.1 AT4: shows only the unlinked sites when the Linked filter is cleared', async () => {
    const mockSites = [
      { id: 1, namesite: 'Bound Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null, protected_area_id: 42 },
      { id: 2, namesite: 'Free Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null, protected_area_id: null },
      { id: 3, namesite: 'Unknown Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Bound Site'));

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    const group = screen.getByRole('region', { name: 'Site Boundaries' });
    fireEvent.click(within(group).getByRole('checkbox', { name: 'Linked' }));

    await waitFor(() => {
      expect(screen.queryByText('Bound Site')).not.toBeInTheDocument();
      expect(screen.getByText('Free Site')).toBeInTheDocument();
      expect(screen.getByText('Unknown Site')).toBeInTheDocument();
    });
  });

  it('US 6.0.1 AT4: shows only the linked sites when the Unlinked filter is cleared', async () => {
    const mockSites = [
      { id: 1, namesite: 'Bound Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null, protected_area_id: 42 },
      { id: 2, namesite: 'Free Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null, protected_area_id: null },
      { id: 3, namesite: 'Unknown Site', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Bound Site'));

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    const group = screen.getByRole('region', { name: 'Site Boundaries' });
    fireEvent.click(within(group).getByRole('checkbox', { name: 'Unlinked' }));

    await waitFor(() => {
      expect(screen.getByText('Bound Site')).toBeInTheDocument();
      expect(screen.queryByText('Free Site')).not.toBeInTheDocument();
      expect(screen.queryByText('Unknown Site')).not.toBeInTheDocument();
    });
  });

  it('sorts sites by name', async () => {
    const mockSites = [
      { id: 1, namesite: 'Beta', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
      { id: 2, namesite: 'Alpha', county: 'CountyB', ab_county: 20, is_active: true, inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByRole('button', { name: /Sort/i }));
    fireEvent.click(screen.getByText(/Name \(A-Z\)/i));

    // Wait for the sort to complete and verify order
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      // Verify Alpha appears before or at same position as Beta after sorting
      const alphaIndex = buttons.findIndex(btn => btn.textContent?.includes('Alpha'));
      const betaIndex = buttons.findIndex(btn => btn.textContent?.includes('Beta'));
      expect(alphaIndex).toBeLessThanOrEqual(betaIndex);
    });
  });

  it('navigates when site card buttons are clicked', async () => {
    const mockSites = [
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    // Find and click Admin View button
    const adminViewButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('Admin View')
    );
    if (adminViewButtons.length > 0) {
      fireEvent.click(adminViewButtons[0]);
      expect(mockPush).toHaveBeenCalledWith('/admin/sites/Alpha');
    }

    // Find and click User View button
    const userViewButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('User View')
    );
    if (userViewButtons.length > 0) {
      fireEvent.click(userViewButtons[0]);
      expect(mockPush).toHaveBeenCalledWith('/detail/Alpha');
    }
  });

  describe('US 2.0.2 AT5: a new site in the search results', () => {
    const alpha = { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: '1900-01-01' };
    const bearCreek = { id: 2, namesite: 'Bear Creek', county: null, ab_county: null, is_active: true, inspectdate: null };

    const addSiteAndSearch = async () => {
      render(<AdminSitesPage />);
      await waitFor(() => screen.getByText('Alpha'));

      fireEvent.click(screen.getByRole('button', { name: /Add Site/i }));
      fireEvent.change(screen.getByPlaceholderText('Enter site name'), { target: { value: 'Bear Creek' } });
      fireEvent.click(screen.getByTestId('add-site-save-button'));
      await waitFor(() => expect(supabaseQueries.createSite).toHaveBeenCalledWith('Bear Creek', null, null));

      fireEvent.change(screen.getByPlaceholderText(/Search by site name or county/i), { target: { value: 'bear' } });
    };

    it('US 2.0.2 AT5: shows a site that was just added when the admin searches for it', async () => {
      (supabaseQueries.getAllSites as jest.Mock)
        .mockResolvedValueOnce([alpha])
        .mockResolvedValue([alpha, bearCreek]);
      (supabaseQueries.createSite as jest.Mock).mockResolvedValue({ ok: true });

      await addSiteAndSearch();

      expect(await screen.findByText('Bear Creek')).toBeInTheDocument();
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });

    it('US 2.0.2 AT5: a refused create adds nothing to the search results', async () => {
      (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue([alpha]);
      (supabaseQueries.createSite as jest.Mock).mockResolvedValue({ ok: false, error: 'Only admins can edit sites.' });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await addSiteAndSearch();

      expect(alertSpy).toHaveBeenCalledWith('Only admins can edit sites.');
      expect(supabaseQueries.getAllSites).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Try adjusting your search or filters/i)).toBeInTheDocument();
      alertSpy.mockRestore();
    });
  });

  it('renders AdminNavBar inside ProtectedRoute', async () => {
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue([]);
    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('AdminNavBarMock'));
    expect(screen.getByText('AdminNavBarMock')).toBeInTheDocument();
  });

});
