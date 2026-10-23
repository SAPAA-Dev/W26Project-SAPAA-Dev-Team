import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSitesPage from '../../app/admin/sites/page';
import * as supabaseQueries from '@/utils/supabase/queries';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/utils/supabase/queries', () => ({
  getAllSites: jest.fn(),
  getArchivedSites: jest.fn(),
  getCounties: jest.fn(),
  getProtectedAreaChoices: jest.fn(),
  getTotalInspectionCount: jest.fn(),
  getProtectedAreaBoundaries: jest.fn(),
  setSiteBoundaryColor: jest.fn(),
  setSiteTypeBoundaryColor: jest.fn(),
}));

jest.mock('next/image', () => {
  function MockImage(props: { alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element -- test mock of next/image
    return <img alt={props.alt} />;
  }
  return MockImage;
});
jest.mock('../../app/admin/AdminNavBar', () => () => null);
jest.mock('@/components/ProtectedRoute', () => function MockProtectedRoute({ children }: { children: React.ReactNode }) { return <>{children}</>; });
jest.mock('@/components/PdfExportModal', () => () => null);
jest.mock('@/components/PdfExportsDropdown', () => () => null);

// The real modal uploads a file. The mock lets a test report a finished import.
jest.mock('@/components/KmlImportModal', () => ({
  __esModule: true,
  default: function MockKmlImportModal({ open, onImported }: { open: boolean; onImported?: () => void }) {
    return open ? <button onClick={() => onImported?.()}>Finish import</button> : null;
  },
}));

jest.mock('@/components/map/SiteMap', () => ({
  __esModule: true,
  default: function MockSiteMap({
    boundaries,
    canEditBoundaryColors,
  }: {
    boundaries?: { features: Array<{ id: number; properties: { name: string } }> } | null;
    canEditBoundaryColors?: boolean;
  }) {
    return (
      <ul data-testid="site-map" data-can-edit-colors={String(canEditBoundaryColors === true)}>
        {(boundaries?.features ?? []).map((feature) => (
          <li key={feature.id}>{feature.properties.name}</li>
        ))}
      </ul>
    );
  },
}));

const queries = supabaseQueries as unknown as Record<string, jest.Mock>;

function area(id: number, name: string) {
  return {
    type: 'Feature' as const,
    id,
    properties: {
      name,
      fid: id,
      area_type: 'NA',
      subtype: null,
      iucn: null,
      oc_no: null,
      acres: null,
      hectares: null,
      oc_date: null,
      date_est: null,
      oc_name: null,
      notes: null,
      county: null,
      is_active: null,
    },
    geometry: { type: 'MultiPolygon' as const, coordinates: [] },
  };
}

describe('Admin Sites map view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queries.getAllSites.mockResolvedValue([
      { id: 1, namesite: 'Alpha', county: 'CountyA', ab_county: 10, is_active: true, inspectdate: null },
    ]);
    queries.getArchivedSites.mockResolvedValue([]);
    queries.getCounties.mockResolvedValue([]);
    queries.getProtectedAreaChoices.mockResolvedValue([]);
    queries.getTotalInspectionCount.mockResolvedValue(0);
    queries.getProtectedAreaBoundaries.mockResolvedValue({
      type: 'FeatureCollection',
      features: [area(1, 'Pembina River'), area(2, 'Jasper')],
    });
  });

  it('US 2.0.6: counts protected areas, not sites, in the map view', async () => {
    const user = userEvent.setup();
    render(<AdminSitesPage />);
    expect(await screen.findByText('1 site found')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Map View' }));

    expect(await screen.findByText('2 protected areas found')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Jasper')).toBeInTheDocument());
  });

  it('lets an admin edit boundary colors in the map view', async () => {
    const user = userEvent.setup();
    render(<AdminSitesPage />);

    await user.click(await screen.findByRole('button', { name: 'Map View' }));

    expect(await screen.findByTestId('site-map')).toHaveAttribute(
      'data-can-edit-colors',
      'true'
    );
  });

  it('reloads the map and the protected-area choices after a KML import', async () => {
    const user = userEvent.setup();
    render(<AdminSitesPage />);
    await user.click(await screen.findByRole('button', { name: 'Map View' }));
    expect(await screen.findByText('2 protected areas found')).toBeInTheDocument();

    queries.getProtectedAreaBoundaries.mockResolvedValue({
      type: 'FeatureCollection',
      features: [area(1, 'Pembina River'), area(2, 'Jasper'), area(3, 'Wagner')],
    });
    await user.click(screen.getByRole('button', { name: /Upload Site Data/ }));
    await user.click(screen.getByRole('button', { name: 'Finish import' }));

    expect(await screen.findByText('3 protected areas found')).toBeInTheDocument();
    expect(screen.getByText('Wagner')).toBeInTheDocument();
    expect(queries.getProtectedAreaChoices).toHaveBeenCalledTimes(2);
  });

  it('wraps the toolbar buttons onto more lines on a narrow screen', async () => {
    render(<AdminSitesPage />);
    const addSite = await screen.findByTestId('add-site-button');

    // jsdom has no layout, so the test checks the classes that let the rows wrap.
    const buttonRow = addSite.parentElement as HTMLElement;
    expect(buttonRow).toHaveClass('flex-wrap');
    expect(buttonRow.parentElement).toHaveClass('flex-wrap');
    for (const name of [/Upload Site Data/, /Bulk PDF/, /^Sort$/]) {
      expect(screen.getByRole('button', { name })).not.toHaveClass('w-full');
    }
  });

  it('leaves the map unloaded when the import finishes in the card view', async () => {
    const user = userEvent.setup();
    render(<AdminSitesPage />);
    await user.click(await screen.findByRole('button', { name: /Upload Site Data/ }));
    await user.click(screen.getByRole('button', { name: 'Finish import' }));

    await waitFor(() => expect(queries.getProtectedAreaChoices).toHaveBeenCalledTimes(2));
    expect(queries.getProtectedAreaBoundaries).not.toHaveBeenCalled();
  });
});
