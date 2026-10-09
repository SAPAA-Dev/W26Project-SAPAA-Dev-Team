import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ReportsPage from '../../app/reports/page';
import * as supabaseQueries from '@/utils/supabase/queries';

jest.mock('@/utils/supabase/queries', () => ({
  getAllSiteReports: jest.fn(),
}));

jest.mock('next/image', () =>
  function MockImage(props: React.ComponentProps<'img'>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  }
);

jest.mock('@/components/ProtectedRoute', () =>
  function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }
);

jest.mock('@/components/HeaderDropdown', () =>
  function MockUserNavBar() {
    return <div>UserNavBarMock</div>;
  }
);

const reports = [
  {
    id: 11,
    inspectionNo: '2026-002',
    inspectionDate: '2026-09-12',
    createdAt: '2026-09-12T10:00:00.000Z',
    siteId: 5,
    siteName: 'Beaver Hills',
    siteArchived: false,
    submitterId: 42,
    submitterName: 'Jamie Rivera',
  },
  {
    id: 12,
    inspectionNo: '2026-001',
    inspectionDate: '2026-09-01',
    createdAt: '2026-09-01T10:00:00.000Z',
    siteId: 6,
    siteName: 'Duck Lake',
    siteArchived: true,
    submitterId: 43,
    submitterName: 'Robin Chen',
  },
  {
    id: 13,
    inspectionNo: null,
    inspectionDate: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    siteId: null,
    siteName: null,
    siteArchived: false,
    submitterId: null,
    submitterName: null,
  },
];

describe('ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseQueries.getAllSiteReports as jest.Mock).mockResolvedValue(reports);
  });

  it('renders a loading state initially', () => {
    (supabaseQueries.getAllSiteReports as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ReportsPage />);
    expect(screen.getByText(/Loading inspection reports/i)).toBeInTheDocument();
  });

  it('lists every report with its site, number, date, and submitter', async () => {
    render(<ReportsPage />);

    const list = await screen.findByTestId('reports-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('3 reports')).toBeInTheDocument();

    // Active sites link to the report on the site detail page.
    expect(screen.getByTestId('report-site-link-11')).toHaveAttribute(
      'href',
      '/detail/Beaver%20Hills?report=11'
    );
    expect(screen.getByText(/2026-002/)).toBeInTheDocument();
    expect(screen.getByText(/Sep 12, 2026/)).toBeInTheDocument();

    const submitter = screen.getByTestId('report-submitter-11');
    expect(within(submitter).getByRole('link', { name: 'Jamie Rivera' })).toHaveAttribute(
      'href',
      '/people/42'
    );
  });

  it('lists reports of archived sites as plain text with an Archived badge, not links', async () => {
    render(<ReportsPage />);

    await screen.findByTestId('reports-list');
    expect(screen.queryByTestId('report-site-link-12')).not.toBeInTheDocument();
    expect(screen.getByTestId('report-site-plain-12')).toHaveTextContent('Duck Lake');
    expect(screen.getByTestId('report-site-archived-12')).toHaveTextContent('Archived');
  });

  it('lists reports of permanently deleted sites as Unknown site, not links', async () => {
    render(<ReportsPage />);

    await screen.findByTestId('reports-list');
    expect(screen.queryByTestId('report-site-link-13')).not.toBeInTheDocument();
    expect(screen.getByTestId('report-site-plain-13')).toHaveTextContent('Unknown site');
    expect(screen.getByTestId('report-submitter-13')).toHaveTextContent('Unknown steward');
    // Falls back to the report id and created date when the report has neither.
    expect(screen.getByText(/Report #13/)).toBeInTheDocument();
  });

  it('filters reports by site, report number, or steward', async () => {
    render(<ReportsPage />);
    await screen.findByTestId('reports-list');

    const search = screen.getByTestId('reports-search');

    fireEvent.change(search, { target: { value: 'duck' } });
    expect(screen.getByTestId('report-row-12')).toBeInTheDocument();
    expect(screen.queryByTestId('report-row-11')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: '2026-002' } });
    expect(screen.getByTestId('report-row-11')).toBeInTheDocument();
    expect(screen.queryByTestId('report-row-12')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'jamie' } });
    expect(screen.getByTestId('report-row-11')).toBeInTheDocument();
    expect(screen.queryByTestId('report-row-12')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'no such report' } });
    expect(screen.getByText('No reports match your search.')).toBeInTheDocument();
  });

  it('shows an empty state when there are no reports', async () => {
    (supabaseQueries.getAllSiteReports as jest.Mock).mockResolvedValue([]);

    render(<ReportsPage />);

    expect(
      await screen.findByText('No inspection reports recorded yet.')
    ).toBeInTheDocument();
  });

  it('shows an error state and retries on demand', async () => {
    (supabaseQueries.getAllSiteReports as jest.Mock)
      .mockRejectedValueOnce(new Error('Reports query failed'))
      .mockResolvedValueOnce(reports);

    render(<ReportsPage />);

    expect(await screen.findByText('Unable to Load Reports')).toBeInTheDocument();
    expect(screen.getByText('Reports query failed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    await waitFor(() =>
      expect(supabaseQueries.getAllSiteReports).toHaveBeenCalledTimes(2)
    );
    expect(await screen.findByTestId('reports-list')).toBeInTheDocument();
  });
});
