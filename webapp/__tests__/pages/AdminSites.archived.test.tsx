import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ArchivedSitesPage from '../../app/admin/sites/archived/page';
import * as supabaseQueries from '@/utils/supabase/queries';
import type {
  SiteDeleteImpact,
  SiteRestoreResult,
  SiteSummary,
} from '@/utils/supabase/queries';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/supabase/queries', () => ({
  getArchivedSites: jest.fn(),
  restoreSite: jest.fn(),
  permanentlyDeleteSite: jest.fn(),
  getSiteDeleteImpact: jest.fn(),
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

const archivedSites: SiteSummary[] = [
  {
    id: 27,
    namesite: 'Duck Lake',
    county: 'Quack County',
    ab_county: 4,
    inspectdate: '2026-10-01',
    is_active: true,
    archived_at: '2026-10-08T20:00:00.000Z',
  },
  {
    id: 28,
    namesite: 'Goose Marsh',
    county: 'Quack County',
    ab_county: 4,
    inspectdate: null,
    is_active: true,
    archived_at: '2026-10-07T09:30:00.000Z',
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
};

const restoreResult: SiteRestoreResult = {
  siteId: 27,
  siteName: 'Duck Lake',
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
  render(<ArchivedSitesPage />);
  await screen.findByText('Duck Lake');
}

async function openPermanentDeleteDialog() {
  fireEvent.click(screen.getByTestId('permanent-delete-site-button-27'));
  await screen.findByRole('dialog', { name: 'Permanently Delete Site' });
}

describe('Admin archived sites page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (supabaseQueries.getArchivedSites as jest.Mock).mockResolvedValue(archivedSites);
    (supabaseQueries.restoreSite as jest.Mock).mockResolvedValue(restoreResult);
    (supabaseQueries.permanentlyDeleteSite as jest.Mock).mockResolvedValue(impact);
    (supabaseQueries.getSiteDeleteImpact as jest.Mock).mockResolvedValue(impact);
  });

  it('lists the archived sites with their archive dates', async () => {
    await renderLoadedPage();

    expect(screen.getByText('Duck Lake')).toBeInTheDocument();
    expect(screen.getByText('Goose Marsh')).toBeInTheDocument();
    expect(screen.getByText('2 sites archived')).toBeInTheDocument();
    expect(screen.getByText(/Archived Oct 8, 2026/)).toBeInTheDocument();
    expect(screen.getAllByText('Archived')).toHaveLength(2);
  });

  it('shows an empty state when no sites are archived', async () => {
    (supabaseQueries.getArchivedSites as jest.Mock).mockResolvedValue([]);
    render(<ArchivedSitesPage />);

    expect(await screen.findByText('No archived sites')).toBeInTheDocument();
  });

  it('restores a site and removes it from the archived list', async () => {
    await renderLoadedPage();

    fireEvent.click(screen.getByTestId('restore-site-button-27'));

    await waitFor(() => {
      expect(supabaseQueries.restoreSite).toHaveBeenCalledWith(27);
      expect(screen.queryByText('Duck Lake')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Goose Marsh')).toBeInTheDocument();
  });

  it('keeps the site in the list when the restore fails', async () => {
    (supabaseQueries.restoreSite as jest.Mock).mockRejectedValue(
      new Error('Site 27 is not archived')
    );
    await renderLoadedPage();

    fireEvent.click(screen.getByTestId('restore-site-button-27'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Site 27 is not archived'
    );
    expect(screen.getByText('Duck Lake')).toBeInTheDocument();
  });

  it('permanently deletes a site after confirmation', async () => {
    await renderLoadedPage();
    await openPermanentDeleteDialog();

    expect(supabaseQueries.getSiteDeleteImpact).toHaveBeenCalledWith(27);
    expect(await screen.findByText('3 inspection reports')).toBeInTheDocument();
    expect(screen.getByText('6 images')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-permanent-delete-site')).toBeEnabled();

    fireEvent.click(screen.getByTestId('confirm-permanent-delete-site'));

    await waitFor(() => {
      expect(supabaseQueries.permanentlyDeleteSite).toHaveBeenCalledWith(27);
      expect(screen.queryByText('Duck Lake')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Goose Marsh')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps confirmation disabled until the impact arrives', async () => {
    const pendingImpact = deferred<SiteDeleteImpact>();
    (supabaseQueries.getSiteDeleteImpact as jest.Mock).mockReturnValue(
      pendingImpact.promise
    );
    await renderLoadedPage();

    await openPermanentDeleteDialog();

    expect(screen.getByTestId('permanent-delete-impact-loading')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-permanent-delete-site')).toBeDisabled();

    await act(async () => {
      pendingImpact.resolve(impact);
      await pendingImpact.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('confirm-permanent-delete-site')).toBeEnabled();
    });
  });

  it('closes the dialog without deleting when the administrator cancels', async () => {
    await renderLoadedPage();
    await openPermanentDeleteDialog();
    await screen.findByText('3 inspection reports');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(supabaseQueries.permanentlyDeleteSite).not.toHaveBeenCalled();
    expect(screen.getByText('Duck Lake')).toBeInTheDocument();
  });

  it('keeps the site and dialog visible when the permanent delete fails', async () => {
    (supabaseQueries.permanentlyDeleteSite as jest.Mock).mockRejectedValue(
      new Error('Delete transaction failed')
    );
    await renderLoadedPage();
    await openPermanentDeleteDialog();
    await screen.findByText('3 inspection reports');

    fireEvent.click(screen.getByTestId('confirm-permanent-delete-site'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Delete transaction failed'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Duck Lake')).toHaveLength(2);
  });

  it('prevents a second confirmation while deletion is pending', async () => {
    const pendingDelete = deferred<SiteDeleteImpact>();
    (supabaseQueries.permanentlyDeleteSite as jest.Mock).mockReturnValue(
      pendingDelete.promise
    );
    await renderLoadedPage();
    await openPermanentDeleteDialog();
    await screen.findByText('3 inspection reports');
    const confirmButton = screen.getByTestId('confirm-permanent-delete-site');

    fireEvent.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(supabaseQueries.permanentlyDeleteSite).toHaveBeenCalledTimes(1);

    await act(async () => {
      pendingDelete.resolve(impact);
      await pendingDelete.promise;
    });

    await waitFor(() => {
      expect(screen.queryByText('Duck Lake')).not.toBeInTheDocument();
    });
  });

  it('navigates back to the sites page', async () => {
    await renderLoadedPage();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockPush).toHaveBeenCalledWith('/admin/sites');
  });
});
