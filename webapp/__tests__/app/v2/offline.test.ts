// Virtual: Jest cannot resolve maplibre-gl's entry, and only addProtocol/removeProtocol are touched.
jest.mock('maplibre-gl', () => ({ addProtocol: jest.fn(), removeProtocol: jest.fn() }), { virtual: true });
jest.mock('@/lib/map/offline/tileCache', () => ({ getCachedResponse: jest.fn() }));

import { makeTransformRequest } from '@/components/map/offlineProtocol';
import { BASEMAP_ORIGIN, OFFLINE_PREFIX, makeOfflineTransform, offlineMask, regionOutlines } from '@/app/v2/_components/map/offline';

const region = (id: string, west: number, south: number, east: number, north: number) => ({
  id,
  bounds: { west, south, east, north },
  zoomMin: 5,
  zoomMax: 10,
  tileCount: 1,
  savedAt: '2026-10-24T00:00:00Z',
});

describe('v2 offline basemap requests (US 4.0.2 wiring)', () => {
  const tile = `${BASEMAP_ORIGIN}planet/20261001_000000_pt/8/45/80.pbf`;
  const call = (t: ReturnType<typeof makeOfflineTransform>, url: string) => t(url, 'Tile' as never);

  it('leaves requests alone while online', () => {
    expect(call(makeOfflineTransform(() => true), tile)).toBeUndefined();
  });

  it('sends basemap requests to the saved copies while offline, and nothing else', () => {
    const offline = makeOfflineTransform(() => false);
    expect(call(offline, tile)).toEqual({ url: `${OFFLINE_PREFIX}${tile}` });
    expect(call(offline, 'https://tiles.openfreemap.org.evil.example/x')).toBeUndefined();
    expect(call(offline, '/api/v1/sites')).toBeUndefined();
  });

  it('uses the scheme the shared offline protocol registers', () => {
    const shared = makeTransformRequest(() => false)('https://api.protomaps.com/x', 'Tile' as never) as { url: string };
    expect(shared.url.startsWith(OFFLINE_PREFIX)).toBe(true);
  });
});

describe('saved-area layers', () => {
  it('outlines each saved area', () => {
    expect(regionOutlines([region('a', -114, 53, -113, 54)]).features).toHaveLength(1);
    expect(regionOutlines([]).features).toHaveLength(0);
  });

  it('masks the world except the saved areas, only while offline', () => {
    const saved = [region('a', -114, 53, -113, 54), region('b', -113.5, 53.5, -112, 55)];
    expect(offlineMask(saved, true).features).toHaveLength(0);
    expect(offlineMask([], false).features).toHaveLength(0);

    const [mask] = offlineMask(saved, false).features as { geometry: { coordinates: number[][][] } }[];
    // The overlapping saves merge, so the holes never cross: world ring plus one or more disjoint holes.
    expect(mask.geometry.coordinates.length).toBeGreaterThan(1);
    expect(mask.geometry.coordinates[0][0]).toEqual([-180, -85.0511]);
  });
});
