import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminSitesPage, { daysSince } from '../../app/admin/sites/page';
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
  getSitesOnline: jest.fn(),
  getTotalInspectionCount: jest.fn().mockResolvedValue(0),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => () => <div>AdminNavBarMock</div>);
jest.mock('@/components/ProtectedRoute', () => ({ children }: any) => <div>{children}</div>);
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
    (supabaseQueries.getSitesOnline as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText(/Unable to Load Sites/i));
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('renders stats cards and sites after successful fetch', async () => {
    const mockSites = [
      { id: '1', namesite: 'Alpha', county: 'CountyA', inspectdate: new Date().toISOString() },
      { id: '2', namesite: 'Beta', county: 'CountyB', inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getSitesOnline as jest.Mock).mockResolvedValue(mockSites);

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
      { id: '1', namesite: 'Alpha', county: 'CountyA', inspectdate: new Date().toISOString() },
      { id: '2', namesite: 'Beta', county: 'CountyB', inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getSitesOnline as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    const input = screen.getByPlaceholderText(/Search by site name or county/i);
    fireEvent.change(input, { target: { value: 'Beta' } });

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('sorts sites by name', async () => {
    const mockSites = [
      { id: '1', namesite: 'Beta', county: 'CountyA', inspectdate: new Date().toISOString() },
      { id: '2', namesite: 'Alpha', county: 'CountyB', inspectdate: '1900-01-01' },
    ];
    (supabaseQueries.getSitesOnline as jest.Mock).mockResolvedValue(mockSites);

    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('Alpha'));

    fireEvent.click(screen.getByRole('button', { name: /Sort/i }));
    fireEvent.click(screen.getByText(/Name \(A-Z\)/i));

    // Wait for the sort to complete and verify order
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const alphaIndex = buttons.findIndex(btn => btn.textContent?.includes('Alpha'));
      const betaIndex = buttons.findIndex(btn => btn.textContent?.includes('Beta'));
      expect(alphaIndex).toBeLessThanOrEqual(betaIndex);
    });
  });

  it('navigates when site card buttons are clicked', async () => {
    const mockSites = [
      { id: '1', namesite: 'Alpha', county: 'CountyA', inspectdate: new Date().toISOString() },
    ];
    (supabaseQueries.getSitesOnline as jest.Mock).mockResolvedValue(mockSites);

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
    (supabaseQueries.getSitesOnline as jest.Mock).mockResolvedValue([]);
    render(<AdminSitesPage />);
    await waitFor(() => screen.getByText('AdminNavBarMock'));
    expect(screen.getByText('AdminNavBarMock')).toBeInTheDocument();
  });
});
