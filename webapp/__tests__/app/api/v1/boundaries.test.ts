/** @jest-environment node */
jest.mock('@/lib/api/v1/server/db', () => ({ db: jest.fn(), fetchAll: jest.fn() }));
jest.mock('@/lib/api/v1/server/sites', () => ({ loadSites: jest.fn() }));
jest.mock('@/utils/supabase/queries', () => ({ setSiteBoundaryColor: jest.fn(), setSiteTypeBoundaryColor: jest.fn() }));

import { fetchAll } from '@/lib/api/v1/server/db';
import { loadSites } from '@/lib/api/v1/server/sites';
import { getBoundaries } from '@/lib/api/v1/server/boundaries';

const area = {
  id: 1, name: 'Test area', fid: 42, area_type: 'Natural Area', subtype: 'PNT', iucn: 'VI',
  oc_no: '123', acres: 20, hectares: 8, oc_date: '2000-01-01', date_est: '2000-01-01',
  oc_name: 'Test order', notes: 'Boundary note', boundary_color: '#123456',
  geometry: { type: 'MultiPolygon', coordinates: [[[[-114, 53], [-113, 53], [-113, 54], [-114, 53]]]] },
};

beforeEach(() => {
  jest.resetAllMocks();
  (loadSites as jest.Mock).mockResolvedValue({
    sites: [{ id: 10, slug: 'Test site', name: 'Test site', status: 'recent', isActive: true, county: 'Test county', lastInspection: '2026-10-01' }],
    areaBySite: new Map([[10, 1]]),
  });
});

it('keeps main boundary details and linked site data for filters and popups', async () => {
  (fetchAll as jest.Mock).mockResolvedValue([area]);
  const result = await getBoundaries({ userId: 'admin', email: null, isAdmin: true });
  expect(result.canEditColors).toBe(true);
  expect(result.features[0].properties.details).toMatchObject({
    protected_area_id: 1, fid: 42, subtype: 'PNT', iucn: 'VI', oc_no: '123', notes: 'Boundary note',
    boundary_color: '#123456', county: 'Test county', site_name: 'Test site', is_active: true,
    last_inspection_date: '2026-10-01',
  });
});

it('continues to hide inactive areas from stewards', async () => {
  (fetchAll as jest.Mock).mockResolvedValueOnce([area]).mockResolvedValueOnce([{ protected_area_id: 1 }]);
  const result = await getBoundaries({ userId: 'steward', email: null, isAdmin: false });
  expect(result.canEditColors).toBe(false);
  expect(result.features).toEqual([]);
});
