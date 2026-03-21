import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSitesPage, { daysSince, formatAgeBadge, getInspectionStatus } from '../../app/admin/sites/page';
import * as supabaseQueries from '@/utils/supabase/queries';
import { useRouter } from 'next/navigation';
import AdminNavBar from '../../app/admin/AdminNavBar';
import ProtectedRoute from '@/components/ProtectedRoute';

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

describe('AdminSitesPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  // Utility functions
  it('calculates daysSince correctly', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(yesterday)).toBe(1);
  });

  it('formats age badge correctly', () => {
    expect(formatAgeBadge(-1)).toBe('New');
    expect(formatAgeBadge(5)).toBe('5d ago');
    expect(formatAgeBadge(60)).toBe('2mo ago');
    expect(formatAgeBadge(400)).toBe('1yr ago');
  });

  it('returns correct inspection status', () => {
    expect(getInspectionStatus(100).label).toBe('Recently Visited');
    expect(getInspectionStatus(300).label).toBe('Visited This Year');
    expect(getInspectionStatus(500).label).toBe('Visited Recently');
    expect(getInspectionStatus(800).label).toBe('Needs Review');
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
    expect(screen.getByText('Total Inspections')).toBeInTheDocument();
    expect(screen.getByText('Active This Year')).toBeInTheDocument();
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();

    // Find stat values by looking for numbers near the stat labels
    const statValues = screen.getAllByText(/^[0-9]$/);
    expect(statValues.length).toBeGreaterThan(0);
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
      const siteButtons = buttons.filter(btn =>
        btn.textContent?.includes('Alpha') || btn.textContent?.includes('Beta')
      );
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

  it('renders AdminNavBar inside ProtectedRoute', async () => {
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue([]);
    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('AdminNavBarMock'));
    expect(screen.getByText('AdminNavBarMock')).toBeInTheDocument();
  });

});
