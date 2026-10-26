import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminSitesPage from '../../app/admin/sites/page';
import * as supabaseQueries from '@/utils/supabase/queries';
import type {
  SiteArchiveResult,
  SiteDeleteImpact,
  SiteSummary,
} from '@/utils/supabase/queries';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/supabase/queries', () => ({
  getAllSites: jest.fn(),
  getArchivedSites: jest.fn(),
  getCounties: jest.fn(),
  getProtectedAreaChoices: jest.fn(),
  getTotalInspectionCount: jest.fn(),
  getSiteDeleteImpact: jest.fn(),
  archiveSite: jest.fn(),
  updateSite: jest.fn(),
  toggleSiteActive: jest.fn(),
  createSite: jest.fn(),
}));

jest.mock('next/image', () => {
  function MockImage({ alt }: { alt: string }) {
    return <span role="img" aria-label={alt} />;
  }
  return MockImage;
});

jest.mock('../../app/admin/AdminNavBar', () => {
  function MockAdminNavBar() {
    return <div>AdminNavBarMock</div>;
  }
  return MockAdminNavBar;
});

jest.mock('@/components/ProtectedRoute', () => {
  function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }
  return MockProtectedRoute;
});

jest.mock('@/components/PdfExportModal', () => {
  function MockPdfExportModal() {
    return null;
  }
  return MockPdfExportModal;
});

jest.mock('@/components/PdfExportsDropdown', () => {
  function MockPdfExportsDropdown() {
    return null;
  }
  return MockPdfExportsDropdown;
});

jest.mock('@/components/KmlImportModal', () => {
  function MockKmlImportModal() {
    return null;
  }
  return MockKmlImportModal;
});

const sites: SiteSummary[] = [
  {
    id: 27,
    namesite: 'Duck Lake',
    county: 'Quack County',
    ab_county: 4,
    inspectdate: '2026-10-01',
    is_active: true,
    archived_at: null,
  },
  {
    id: 28,
    namesite: 'Goose Marsh',
    county: 'Quack County',
    ab_county: 4,
    inspectdate: null,
    is_active: true,
    archived_at: null,
  },
];

const impact: SiteDeleteImpact = {
  siteId: 27,
  siteName: 'Duck Lake',
  inspectionCount: 3,
  answerCount: 5,
  attachmentCount: 2,
  homepageImageCount: 4,
  siteStewardCount: 1,
  gpxTrackCount: 0,
  sitePageFieldCount: 0,
};

const archiveResult: SiteArchiveResult = {
  siteId: 27,
  siteName: 'Duck Lake',
  archivedAt: '2026-10-08T20:00:00.000Z',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function renderLoadedPage() {
  render(<AdminSitesPage />);
  await screen.findByText('Duck Lake');
}

async function openArchiveDialog() {
  fireEvent.click(screen.getByTestId('archive-site-button-27'));
  await screen.findByRole('dialog', { name: 'Archive Site' });
}

describe('Admin Sites archive flow (US 2.0.4)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (supabaseQueries.getAllSites as jest.Mock).mockResolvedValue(sites);
    (supabaseQueries.getArchivedSites as jest.Mock).mockResolvedValue([]);
    (supabaseQueries.getCounties as jest.Mock).mockResolvedValue([]);
    (supabaseQueries.getProtectedAreaChoices as jest.Mock).mockResolvedValue([]);
    (supabaseQueries.getTotalInspectionCount as jest.Mock).mockResolvedValue(10);
    (supabaseQueries.getSiteDeleteImpact as jest.Mock).mockResolvedValue(impact);
    (supabaseQueries.archiveSite as jest.Mock).mockResolvedValue(archiveResult);
    (supabaseQueries.updateSite as jest.Mock).mockResolvedValue({ ok: true });
    (supabaseQueries.toggleSiteActive as jest.Mock).mockResolvedValue(undefined);
    (supabaseQueries.createSite as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('opens the dialog and explains the records that stay with the site (2.0.4 AT1, 2.0.4 AT2)', async () => {
    await renderLoadedPage();
    await openArchiveDialog();

    expect(supabaseQueries.getSiteDeleteImpact).toHaveBeenCalledWith(27);
    expect(await screen.findByText('3 inspection reports')).toBeInTheDocument();
    expect(screen.getByText('5 answers')).toBeInTheDocument();
    expect(screen.getByText('6 images')).toBeInTheDocument();
    expect(screen.getByText('1 steward assignments')).toBeInTheDocument();
    expect(
      screen.getByText('Imported KML boundaries will not be changed.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('confirm-archive-site')).toBeEnabled();
  });

  it('keeps confirmation disabled until the impact arrives (2.0.4 AT2)', async () => {
    const pendingImpact = deferred<SiteDeleteImpact>();
    (supabaseQueries.getSiteDeleteImpact as jest.Mock).mockReturnValue(
      pendingImpact.promise
    );
    await renderLoadedPage();

    await openArchiveDialog();

    expect(screen.getByTestId('archive-site-impact-loading')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-archive-site')).toBeDisabled();

    await act(async () => {
      pendingImpact.resolve(impact);
      await pendingImpact.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('confirm-archive-site')).toBeEnabled();
    });
  });

  it('ignores impact counts that belong to a different site (2.0.4 AT2)', async () => {
    (supabaseQueries.getSiteDeleteImpact as jest.Mock).mockResolvedValue({
      ...impact,
      siteId: 28,
      siteName: 'Goose Marsh',
    });
    await renderLoadedPage();

    await openArchiveDialog();

    await waitFor(() => {
      expect(supabaseQueries.getSiteDeleteImpact).toHaveBeenCalledWith(27);
    });
    expect(screen.queryByText('3 inspection reports')).not.toBeInTheDocument();
    expect(screen.getByTestId('confirm-archive-site')).toBeDisabled();
  });

  it('closes the dialog without archiving when the administrator cancels (2.0.4 AT1)', async () => {
    await renderLoadedPage();
    await openArchiveDialog();
    await screen.findByText('3 inspection reports');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(supabaseQueries.archiveSite).not.toHaveBeenCalled();
    expect(screen.getByText('Duck Lake')).toBeInTheDocument();
  });

  it('removes the site card after a successful confirmed archive (2.0.4 AT1)', async () => {
    await renderLoadedPage();
    await openArchiveDialog();
    await screen.findByText('3 inspection reports');

    fireEvent.click(screen.getByTestId('confirm-archive-site'));

    await waitFor(() => {
      expect(supabaseQueries.archiveSite).toHaveBeenCalledWith(27);
      expect(screen.queryByText('Duck Lake')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Goose Marsh')).toBeInTheDocument();
    // Archiving deletes nothing, so the response total does not change.
    expect(screen.getByText('Total Responses').closest('.stat-card')).toHaveTextContent('10');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the site and dialog visible when the archive fails (2.0.4 AT4)', async () => {
    (supabaseQueries.archiveSite as jest.Mock).mockRejectedValue(
      new Error('Site 27 is already archived')
    );
    await renderLoadedPage();
    await openArchiveDialog();
    await screen.findByText('3 inspection reports');

    fireEvent.click(screen.getByTestId('confirm-archive-site'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Site 27 is already archived'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Duck Lake')).toHaveLength(2);
  });

  it('shows an impact error and never enables confirmation (2.0.4 AT2)', async () => {
    (supabaseQueries.getSiteDeleteImpact as jest.Mock).mockRejectedValue(
      new Error('Impact query failed')
    );
    await renderLoadedPage();

    await openArchiveDialog();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impact query failed'
    );
    expect(screen.getByTestId('confirm-archive-site')).toBeDisabled();
    expect(supabaseQueries.archiveSite).not.toHaveBeenCalled();
  });

  it('prevents a second confirmation while archiving is pending (2.0.4 AT1)', async () => {
    const pendingArchive = deferred<SiteArchiveResult>();
    (supabaseQueries.archiveSite as jest.Mock).mockReturnValue(
      pendingArchive.promise
    );
    await renderLoadedPage();
    await openArchiveDialog();
    await screen.findByText('3 inspection reports');
    const confirmButton = screen.getByTestId('confirm-archive-site');

    fireEvent.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(supabaseQueries.archiveSite).toHaveBeenCalledTimes(1);

    await act(async () => {
      pendingArchive.resolve(archiveResult);
      await pendingArchive.promise;
    });

    await waitFor(() => {
      expect(screen.queryByText('Duck Lake')).not.toBeInTheDocument();
    });
  });

  it('links to the archived sites page with the archived count', async () => {
    (supabaseQueries.getArchivedSites as jest.Mock).mockResolvedValue([
      { ...sites[0], archived_at: '2026-10-08T20:00:00.000Z' },
    ]);
    await renderLoadedPage();

    const archivedButton = await screen.findByTestId('archived-sites-button');
    expect(archivedButton).toHaveTextContent('Archived (1)');

    fireEvent.click(archivedButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/sites/archived');
  });
});
