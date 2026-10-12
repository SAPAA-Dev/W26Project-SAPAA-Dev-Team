import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArchivedReportsPage from '../../app/admin/reports/archived/page';
import * as queries from '@/utils/supabase/queries';
import type {
  ArchivedSiteInspectionReport,
  SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';

jest.mock('@/utils/supabase/queries', () => ({
  getArchivedSiteInspectionReports: jest.fn(),
  getSiteInspectionReportDeleteImpact: jest.fn(),
  permanentlyDeleteSiteInspectionReport: jest.fn(),
  restoreSiteInspectionReport: jest.fn(),
}));

jest.mock('next/image', () => {
  function MockImage({ alt }: { alt: string }) {
    return <span role="img" aria-label={alt} />;
  }
  return MockImage;
});

jest.mock('../../app/admin/AdminNavBar', () => {
  function MockAdminNavBar() {
    return <div>Admin navigation</div>;
  }
  return MockAdminNavBar;
});

jest.mock('@/components/ProtectedRoute', () => {
  function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }
  return MockProtectedRoute;
});

const reports: ArchivedSiteInspectionReport[] = [{
  id: 41,
  inspectionNo: '2026-041',
  inspectionDate: '2026-10-08',
  createdAt: '2026-10-08T18:00:00.000Z',
  isActive: false,
  archivedAt: '2026-10-09T10:00:00.000Z',
  siteId: 7,
  siteName: 'Duck Lake',
  submitterId: 12,
  submitterName: 'Alex Steward',
}];

const impact: SiteInspectionReportDeleteImpact = {
  responseId: 41,
  inspectionNo: '2026-041',
  inspectionDate: '2026-10-08',
  siteName: 'Duck Lake',
  answerCount: 18,
  attachmentCount: 2,
};

describe('Archived Reports page (US 7.0.8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (queries.getArchivedSiteInspectionReports as jest.Mock).mockResolvedValue(reports);
    (queries.getSiteInspectionReportDeleteImpact as jest.Mock).mockResolvedValue(impact);
    (queries.restoreSiteInspectionReport as jest.Mock).mockResolvedValue({ responseId: 41 });
    (queries.permanentlyDeleteSiteInspectionReport as jest.Mock).mockResolvedValue({
      impact,
      storageCleanupComplete: true,
    });
  });

  it('lists archived reports and preserves their former active state', async () => {
    render(<ArchivedReportsPage />);

    expect(await screen.findByText('2026-041')).toBeInTheDocument();
    expect(screen.getByText(/Duck Lake/)).toBeInTheDocument();
    expect(screen.getByText(/Was inactive/)).toBeInTheDocument();
    expect(screen.getByText('1 report archived')).toBeInTheDocument();
  });

  it('restores a report and removes it from the archive list', async () => {
    render(<ArchivedReportsPage />);
    await screen.findByText('2026-041');

    fireEvent.click(screen.getByTestId('restore-report-button-41'));

    await waitFor(() => {
      expect(queries.restoreSiteInspectionReport).toHaveBeenCalledWith(41);
      expect(screen.queryByTestId('archived-report-row-41')).not.toBeInTheDocument();
    });
  });

  it('offers permanent deletion only from the archived reports page (7.0.8 AT1)', async () => {
    render(<ArchivedReportsPage />);
    await screen.findByText('2026-041');

    fireEvent.click(screen.getByTestId('permanent-delete-report-button-41'));
    expect(await screen.findByRole('dialog', { name: 'Permanently Delete Report' })).toBeInTheDocument();
    expect(queries.getSiteInspectionReportDeleteImpact).toHaveBeenCalledWith(41);

    fireEvent.click(await screen.findByTestId('confirm-permanent-delete-report'));

    await waitFor(() => {
      expect(queries.permanentlyDeleteSiteInspectionReport).toHaveBeenCalledWith(41);
      expect(screen.queryByTestId('archived-report-row-41')).not.toBeInTheDocument();
    });
  });

  it('shows the partial-cleanup warning after the database delete succeeds', async () => {
    (queries.permanentlyDeleteSiteInspectionReport as jest.Mock).mockResolvedValue({
      impact,
      storageCleanupComplete: false,
    });
    render(<ArchivedReportsPage />);
    await screen.findByText('2026-041');

    fireEvent.click(screen.getByTestId('permanent-delete-report-button-41'));
    fireEvent.click(await screen.findByTestId('confirm-permanent-delete-report'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The report was deleted, but some stored image files need manual cleanup.'
    );
  });

  it('keeps the archived report when permanent deletion fails (7.0.8 AT5)', async () => {
    (queries.permanentlyDeleteSiteInspectionReport as jest.Mock).mockRejectedValue(
      new Error('Delete transaction failed')
    );
    render(<ArchivedReportsPage />);
    await screen.findByText('2026-041');

    fireEvent.click(screen.getByTestId('permanent-delete-report-button-41'));
    fireEvent.click(await screen.findByTestId('confirm-permanent-delete-report'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete transaction failed');
    expect(screen.getByTestId('archived-report-row-41')).toBeInTheDocument();
  });
});
