import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import SiteMap from '@/components/map/SiteMap';
import type { BoundaryFeatureCollection } from '@/lib/map/boundaries';

// The panel has its own suite, so a mock keeps this suite independent of it.
jest.mock('@/components/map/OfflineSavePanel', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

// SiteMap reads the saved regions at mount, so the cache access stays a mock.
jest.mock('@/lib/map/offline/tileCache', () => ({
  listRegions: jest.fn(() => []),
  getCachedResponse: jest.fn(async () => null),
}));

// maplibre-gl publishes only an "import" condition, so Jest's CommonJS resolver
// cannot find it. A virtual mock skips resolution and keeps the real WebGL build out of jsdom.
// The instances are made inside the factory because the factory runs before the
// module body does, so it cannot read a constant declared below.
jest.mock(
  'maplibre-gl',
  () => {
    const map = {
      resize: jest.fn(),
      remove: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      addSource: jest.fn(),
      addLayer: jest.fn(),
      getSource: jest.fn(),
      getLayer: jest.fn(),
      isStyleLoaded: jest.fn(),
      getCanvas: jest.fn(),
      setFeatureState: jest.fn(),
      setLayoutProperty: jest.fn(),
      fitBounds: jest.fn(),
      setStyle: jest.fn(),
      unproject: jest.fn(),
      getZoom: jest.fn(() => 6),
    };

    const popup = {
      setLngLat: jest.fn(),
      setDOMContent: jest.fn(),
      addTo: jest.fn(),
      remove: jest.fn(),
    };

    return {
      __esModule: true,
      Map: jest.fn(() => map),
      Popup: jest.fn(() => popup),
      addProtocol: jest.fn(),
      removeProtocol: jest.fn(),
      __map: map,
      __popup: popup,
    };
  },
  { virtual: true }
);

const mocks = jest.requireMock('maplibre-gl') as {
  Map: jest.Mock;
  Popup: jest.Mock;
  addProtocol: jest.Mock;
  removeProtocol: jest.Mock;
  __map: Record<string, jest.Mock>;
  __popup: Record<string, jest.Mock>;
};

const tileCacheMocks = jest.requireMock('@/lib/map/offline/tileCache') as {
  listRegions: jest.Mock;
  getCachedResponse: jest.Mock;
};

const OfflineSavePanelMock = jest.requireMock('@/components/map/OfflineSavePanel').default as jest.Mock;

const MockMap = mocks.Map;
const mapInstance = mocks.__map;
const popupInstance = mocks.__popup;
const addProtocolMock = mocks.addProtocol;
const removeProtocolMock = mocks.removeProtocol;

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
let resizeCallback: (() => void) | null = null;

// One object, so a test can read the cursor the component wrote.
const canvas = { style: { cursor: '' } };

const FILL_LAYER_ID = 'protected-areas-fill';
const OUTLINE_LAYER_ID = 'protected-areas-outline';
const SOURCE_ID = 'protected-areas';

const ALBERTA_BOUNDS = [
  [-120.0, 49.0],
  [-110.0, 60.0],
];
const VIEW_PADDING = 32;

const COLLECTION: BoundaryFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1,
      properties: {
        name: 'Wainwright Dunes',
        fid: 12,
        area_type: 'ER',
        subtype: null,
        iucn: null,
        oc_no: null,
        acres: null,
        hectares: null,
        oc_date: null,
        date_est: null,
        oc_name: 'Wainwright Dunes Ecological Reserve',
        notes: null,
        county: null,
        is_active: null,
        site_name: null,
        last_inspection_date: null,
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-110.67, 52.62],
              [-110.66, 52.62],
              [-110.66, 52.63],
              [-110.67, 52.62],
            ],
          ],
        ],
      },
    },
  ],
};

const EMPTY_COLLECTION: BoundaryFeatureCollection = { type: 'FeatureCollection', features: [] };

const SAVED_REGION = {
  id: 'region-1',
  bounds: { west: -115.1, south: 52.0, east: -113.5, north: 53.5 },
  zoomMin: 5,
  zoomMax: 10,
  tileCount: 120,
  savedAt: '2026-10-01T00:00:00.000Z',
};

// A neighboring save keeps its overlap with the first region, so the raw
// rectangles cross.
const OVERLAPPING_REGION = {
  ...SAVED_REGION,
  id: 'region-2',
  bounds: { west: -114.4, south: 52.9, east: -112.8, north: 54.4 },
};

const OFFLINE_REGIONS_SOURCE_ID = 'offline-regions';
const OFFLINE_REGIONS_LAYER_ID = 'offline-regions-outline';

const OFFLINE_MASK_SOURCE_ID = 'offline-mask';
const OFFLINE_MASK_LAYER_ID = 'offline-mask-fill';
const OFFLINE_MASK_COLOR = '#F7F2EA';

const WORLD_RING = [
  [-180, -85.0511],
  [180, -85.0511],
  [180, 85.0511],
  [-180, 85.0511],
  [-180, -85.0511],
];

/** The handler the component bound to one map event. */
function mapHandler(eventName: string): (...args: unknown[]) => void {
  const call = mapInstance.on.mock.calls.find(([name]) => name === eventName);
  if (call === undefined) throw new Error(`the component bound no ${eventName} handler`);
  return call[1];
}

/** Every handler the component bound to one map event, in binding order. */
function allMapHandlers(eventName: string): Array<(...args: unknown[]) => void> {
  return mapInstance.on.mock.calls
    .filter(([name]) => name === eventName)
    .map(([, handler]) => handler);
}

/** The handler the component bound to one event on the fill layer. */
function layerHandler(eventName: string): (event: Record<string, unknown>) => void {
  const call = mapInstance.on.mock.calls.find(
    ([name, layer]) => name === eventName && layer === FILL_LAYER_ID
  );
  if (call === undefined) throw new Error(`the component bound no ${eventName} handler`);
  return call[2];
}

function detailRowTexts(root: ParentNode | null): string[] {
  if (root === null) return [];
  return Array.from(root.querySelectorAll('[data-field]')).map(
    (row) => `${row.getAttribute('data-field')}: ${row.querySelector('[data-field-value]')?.textContent}`
  );
}

function popupContent(): HTMLElement {
  return popupInstance.setDOMContent.mock.calls[0][0] as HTMLElement;
}

describe('SiteMap (US 2.0.6)', () => {
  beforeAll(() => {
    // jsdom does not implement ResizeObserver.
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = jest.fn(
      (callback: () => void) => {
        resizeCallback = callback;
        return { observe: mockObserve, disconnect: mockDisconnect };
      }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resizeCallback = null;
    canvas.style.cursor = '';
    delete process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY;
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    // A test can replace the return value, so the defaults come back every time.
    tileCacheMocks.listRegions.mockReset().mockReturnValue([]);
    tileCacheMocks.getCachedResponse.mockReset().mockResolvedValue(null);

    mapInstance.isStyleLoaded.mockReturnValue(true);
    mapInstance.getSource.mockReturnValue(undefined);
    mapInstance.getCanvas.mockReturnValue(canvas);
    // A test can install a layer table, so the default comes back every time.
    mapInstance.getLayer.mockReset().mockReturnValue(undefined);
    popupInstance.setLngLat.mockReturnValue(popupInstance);
    popupInstance.setDOMContent.mockReturnValue(popupInstance);
    popupInstance.addTo.mockReturnValue(popupInstance);
  });

  it('shows the setup overlay and builds no map when the key is missing', () => {
    render(<SiteMap />);

    expect(screen.getByText('Map key not set')).toBeInTheDocument();
    expect(screen.getByText('NEXT_PUBLIC_PROTOMAPS_API_KEY')).toBeInTheDocument();
    expect(MockMap).not.toHaveBeenCalled();
  });

  it.each(['', 'YOUR_API_KEY', 'your-protomaps-api-key', 'changeme'])(
    'treats %p as a missing key',
    (placeholder) => {
      process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = placeholder;
      render(<SiteMap />);

      expect(screen.getByText('Map key not set')).toBeInTheDocument();
      expect(MockMap).not.toHaveBeenCalled();
    }
  );

  it('opens the map fitted to Alberta with the Protomaps style when the key is set', () => {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test+key/1';
    render(<SiteMap />);

    expect(MockMap).toHaveBeenCalledTimes(1);
    const options = MockMap.mock.calls[0][0];

    expect(options.style).toBe(
      'https://api.protomaps.com/styles/v5/light/en.json?key=test%2Bkey%2F1'
    );
    expect(options.bounds).toEqual(ALBERTA_BOUNDS);
    expect(options.fitBoundsOptions).toEqual({ padding: VIEW_PADDING });
    expect(options.center).toBeUndefined();
    expect(options.zoom).toBeUndefined();
    expect(options.maxBounds).toBeUndefined();
    expect(options.renderWorldCopies).toBe(false);
    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it('frames the popup as the site detail card', () => {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    render(<SiteMap />);

    expect(mocks.Popup).toHaveBeenCalledWith(
      expect.objectContaining({
        closeButton: false,
        maxWidth: '360px',
        className: 'site-detail-popup',
      })
    );
  });

  it('resizes the canvas when the container changes size', () => {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    render(<SiteMap />);

    act(() => resizeCallback?.());

    expect(mapInstance.resize).toHaveBeenCalledTimes(1);
  });

  it('removes the map, the popup and the observer on unmount', () => {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    const { unmount } = render(<SiteMap />);

    unmount();

    expect(mapInstance.remove).toHaveBeenCalledTimes(1);
    expect(popupInstance.remove).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  describe('boundaries', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    });

    it('adds the source and the two layers once the style is loaded', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      expect(mapInstance.addSource).toHaveBeenCalledTimes(1);
      const [sourceId, sourceSpec] = mapInstance.addSource.mock.calls[0];
      expect(sourceId).toBe(SOURCE_ID);
      expect(sourceSpec.type).toBe('geojson');
      expect(sourceSpec.data).toBe(COLLECTION);
      // The hover state and the popup name one feature, so the source needs ids.
      expect(sourceSpec.generateId).toBe(true);

      expect(mapInstance.addLayer).toHaveBeenCalledTimes(2);

      const fill = mapInstance.addLayer.mock.calls[0][0];
      expect(fill.id).toBe(FILL_LAYER_ID);
      expect(fill.type).toBe('fill');
      expect(fill.source).toBe(SOURCE_ID);

      const outline = mapInstance.addLayer.mock.calls[1][0];
      expect(outline.id).toBe(OUTLINE_LAYER_ID);
      expect(outline.type).toBe('line');
      expect(outline.source).toBe(SOURCE_ID);
    });

    it('waits for the load event when the style is not ready', () => {
      mapInstance.isStyleLoaded.mockReturnValue(false);
      render(<SiteMap boundaries={COLLECTION} />);

      expect(mapInstance.addSource).not.toHaveBeenCalled();

      const loadCall = mapInstance.once.mock.calls.find(([event]) => event === 'load');
      expect(loadCall).toBeDefined();

      act(() => loadCall?.[1]());

      expect(mapInstance.addSource).toHaveBeenCalledTimes(1);
    });

    it('adds no source when the prop is absent', () => {
      render(<SiteMap />);

      expect(mapInstance.addSource).not.toHaveBeenCalled();
      expect(mapInstance.addLayer).not.toHaveBeenCalled();
    });

    it('adds no source for an empty collection', () => {
      render(<SiteMap boundaries={EMPTY_COLLECTION} />);

      expect(mapInstance.addSource).not.toHaveBeenCalled();
      expect(mapInstance.addLayer).not.toHaveBeenCalled();
    });

    it('replaces the data without building a second map', () => {
      const setData = jest.fn();
      const { rerender } = render(<SiteMap boundaries={COLLECTION} />);

      expect(mapInstance.addSource).toHaveBeenCalledTimes(1);

      mapInstance.getSource.mockReturnValue({ setData });
      const other: BoundaryFeatureCollection = { ...COLLECTION };
      rerender(<SiteMap boundaries={other} />);

      expect(MockMap).toHaveBeenCalledTimes(1);
      expect(mapInstance.addSource).toHaveBeenCalledTimes(1);
      expect(setData).toHaveBeenCalledWith(other);
    });

    it('replaces the polygons with an empty collection and closes the popup', () => {
      const setData = jest.fn();
      const { rerender } = render(<SiteMap boundaries={COLLECTION} />);

      mapInstance.getSource.mockReturnValue({ setData });
      rerender(<SiteMap boundaries={EMPTY_COLLECTION} />);

      expect(setData).toHaveBeenCalledWith(EMPTY_COLLECTION);
      expect(popupInstance.remove).toHaveBeenCalled();
    });

    it('points the cursor and marks the feature on hover', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() => layerHandler('mousemove')({ features: [{ id: 42, properties: {} }] }));

      expect(canvas.style.cursor).toBe('pointer');
      expect(mapInstance.setFeatureState).toHaveBeenCalledWith(
        { source: SOURCE_ID, id: 42 },
        { hover: true }
      );
    });

    it('clears the hover state and the cursor when the pointer leaves', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() => layerHandler('mousemove')({ features: [{ id: 42, properties: {} }] }));
      act(() => layerHandler('mouseleave')({}));

      expect(canvas.style.cursor).toBe('');
      expect(mapInstance.setFeatureState).toHaveBeenLastCalledWith(
        { source: SOURCE_ID, id: 42 },
        { hover: false }
      );
    });

    it('ignores a move that carries no feature', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() => layerHandler('mousemove')({ features: [] }));

      expect(mapInstance.setFeatureState).not.toHaveBeenCalled();
    });

    it('opens a popup with both the site name and the boundary name on click', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      const lngLat = { lng: -110.5, lat: 52.6 };
      act(() =>
        layerHandler('click')({
          lngLat,
          features: [
            {
              id: 1,
              properties: {
                name: 'Wainwright Dunes',
                oc_name: 'Wainwright Dunes Ecological Reserve',
                area_type: 'ER',
                subtype: 'Ecological Reserve',
                site_name: 'Wainwright Dunes (ER)',
              },
            },
          ],
        })
      );

      expect(popupInstance.setLngLat).toHaveBeenCalledWith(lngLat);
      expect(popupInstance.addTo).toHaveBeenCalledWith(mapInstance);

      const content = popupContent();
      expect(content.querySelector('[data-site-name]')?.textContent).toBe('Wainwright Dunes (ER)');
      expect(content.querySelector('[data-boundary-name]')?.textContent).toBe(
        'Wainwright Dunes Ecological Reserve'
      );
      expect(
        Array.from(content.querySelectorAll('[data-boundary-badge]')).map(
          (badge) => badge.textContent
        )
      ).toEqual(['ER', 'Ecological Reserve']);
    });

    it('uses the short export name for the boundary when the order name is absent', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [{ id: 1, properties: { name: 'Wainwright Dunes', area_type: 'ER' } }],
        })
      );

      expect(popupContent().querySelector('[data-boundary-name]')?.textContent).toBe(
        'Wainwright Dunes'
      );
    });

    it('shows five summary fields and keeps the rest behind the expand control', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [
            {
              id: 1,
              properties: {
                name: 'Pembina River',
                fid: 0,
                area_type: 'NA',
                subtype: 'Conservation',
                iucn: 'II',
                oc_no: 'OC 454/71-42',
                acres: 185.835377,
                hectares: 75.204909,
                oc_date: '1971-03-15',
                date_est: '1971-03-15',
                oc_name: 'Pembina River Natural Area',
                notes: 'Watch the riverbank.',
              },
            },
          ],
        })
      );

      const content = popupContent();
      const summary = content.querySelector('[data-boundary-summary]');
      const extra = content.querySelector('[data-boundary-extra]');
      const expand = content.querySelector('[data-boundary-expand]') as HTMLButtonElement;

      expect(detailRowTexts(summary)).toEqual([
        'FID: 0',
        'IUCN: II',
        'Order in Council: OC 454/71-42',
        'Area: 75.2 ha',
        'Established: 1971-03-15',
      ]);
      expect(extra?.classList.contains('hidden')).toBe(true);
      expect(expand.getAttribute('aria-expanded')).toBe('false');
      expect(expand.textContent).toContain('View all boundary details');
    });

    it('shows the remaining fields and the notes after the expand control is clicked', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [
            {
              id: 1,
              properties: {
                name: 'Pembina River',
                fid: 0,
                area_type: 'NA',
                subtype: 'Conservation',
                acres: 185.835377,
                oc_date: '1971-03-15',
                oc_name: 'Pembina River Natural Area',
                notes: 'Watch the riverbank.',
              },
            },
          ],
        })
      );

      const content = popupContent();
      const extra = content.querySelector('[data-boundary-extra]');
      const expand = content.querySelector('[data-boundary-expand]') as HTMLButtonElement;

      act(() => expand.click());

      expect(extra?.classList.contains('hidden')).toBe(false);
      expect(expand.getAttribute('aria-expanded')).toBe('true');
      expect(expand.textContent).toContain('Hide boundary details');
      expect(detailRowTexts(extra)).toEqual([
        'Name: Pembina River',
        'Acres: 185.84',
        'Order date: 1971-03-15',
      ]);
      expect(extra?.querySelector('[data-notes-heading]')?.textContent).toBe('NOTES');
      expect(extra?.querySelector('[data-notes-body]')?.textContent).toBe('Watch the riverbank.');

      act(() => expand.click());
      expect(extra?.classList.contains('hidden')).toBe(true);
      expect(expand.getAttribute('aria-expanded')).toBe('false');
    });

    it('omits an empty field and the notes block when notes are absent', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [
            {
              id: 1,
              properties: {
                name: 'Pembina River',
                fid: 0,
                area_type: 'NA',
                subtype: '',
                notes: '   ',
              },
            },
          ],
        })
      );

      const content = popupContent();
      expect(detailRowTexts(content.querySelector('[data-boundary-summary]'))).toEqual(['FID: 0']);
      expect(
        Array.from(content.querySelectorAll('[data-boundary-badge]')).map(
          (badge) => badge.textContent
        )
      ).toEqual(['NA']);
      expect(detailRowTexts(content.querySelector('[data-boundary-extra]'))).toEqual([
        'Name: Pembina River',
      ]);
      expect(content.querySelector('[data-notes-heading]')).toBeNull();
    });

    it('falls back to a generic title when the feature carries no name', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() => layerHandler('click')({ lngLat: { lng: 0, lat: 0 }, features: [{ id: 1 }] }));

      const content = popupContent();
      expect(content.querySelector('[data-boundary-name]')?.textContent).toBe('Protected area');
    });

    it('US 2.0.8 AT1: opens the detail popup for the selected site', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      const lngLat = { lng: -110.5, lat: 52.6 };
      act(() =>
        layerHandler('click')({
          lngLat,
          features: [{ id: 1, properties: { name: 'Wainwright Dunes', site_name: 'Wainwright Dunes' } }],
        })
      );

      expect(popupInstance.setLngLat).toHaveBeenCalledWith(lngLat);
      expect(popupInstance.setDOMContent).toHaveBeenCalled();
      expect(popupInstance.addTo).toHaveBeenCalledWith(mapInstance);
    });

    it('US 2.0.8 AT1: opens no popup when the click carries no feature', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() => layerHandler('click')({ lngLat: { lng: 0, lat: 0 }, features: [] }));

      expect(popupInstance.setDOMContent).not.toHaveBeenCalled();
    });

    it('US 2.0.8 AT2: puts the site name, county and last inspection date at the top', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [
            {
              id: 1,
              properties: {
                name: 'Wainwright Dunes',
                site_name: 'Wainwright Dunes (ER)',
                county: 'Parkland County',
                last_inspection_date: '2024-03-15',
                area_type: 'ER',
                fid: 12,
              },
            },
          ],
        })
      );

      const content = popupContent();
      const expectedDate = new Date('2024-03-15').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const siteSection = content.children[0];
      const boundarySection = content.children[1];

      expect(siteSection.querySelector('[data-site-name]')?.textContent).toBe(
        'Wainwright Dunes (ER)'
      );
      expect(siteSection.getAttribute('data-site-info')).toBe('linked');
      expect(
        siteSection.querySelector('[data-site-county] [data-field-value]')?.textContent
      ).toBe('Parkland County');
      expect(
        siteSection.querySelector('[data-last-inspection] [data-field-value]')?.textContent
      ).toBe(expectedDate);
      expect(boundarySection.querySelector('[data-boundary-name]')?.textContent).toBe(
        'Wainwright Dunes'
      );
    });

    it('US 2.0.8 AT2: shows "Never inspected" when the site has no report date', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [
            { id: 1, properties: { name: 'Riverlot 56', site_name: 'Riverlot 56 (NA)' } },
          ],
        })
      );

      expect(
        popupContent().querySelector('[data-last-inspection] [data-field-value]')?.textContent
      ).toBe('Never inspected');
    });

    it('US 2.0.8 AT2: shows "No linked site" for an area with no site', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [{ id: 1, properties: { name: 'Some Area', area_type: 'NA', fid: 3 } }],
        })
      );

      const content = popupContent();
      const siteSection = content.children[0];
      expect(siteSection.getAttribute('data-site-info')).toBe('unlinked');
      expect(siteSection.querySelector('[data-no-linked-site]')?.textContent).toBe('No linked site');
      expect(siteSection.querySelector('[data-site-name]')).toBeNull();
      expect(siteSection.querySelector('[data-site-county]')).toBeNull();
      expect(siteSection.querySelector('[data-last-inspection]')).toBeNull();
      expect(content.querySelector('[data-view-sirs]')).toBeNull();
      expect(content.querySelector('[data-boundary-name]')?.textContent).toBe('Some Area');
    });

    it('US 2.0.8 AT3: links "View site & SIRs" to the encoded detail path', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [{ id: 1, properties: { name: 'Bilby', site_name: 'Bilby #2 / East' } }],
        })
      );

      const link = popupContent().querySelector('[data-view-sirs]');

      expect(link?.textContent).toBe('View site & SIRs');
      expect(link?.getAttribute('href')).toBe('/detail/Bilby%20%232%20%2F%20East');
    });

    it('US 2.0.8 AT3: shows no View site & SIRs link for an area with no linked site', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() =>
        layerHandler('click')({
          lngLat: { lng: -110.5, lat: 52.6 },
          features: [{ id: 1, properties: { name: 'Some Area' } }],
        })
      );

      expect(popupContent().querySelector('[data-view-sirs]')).toBeNull();
    });
  });

  describe('search focus', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    });

    it('US 2.0.6 AT3: fits the map to the area picked from the search matches', () => {
      const { rerender } = render(<SiteMap boundaries={COLLECTION} />);
      expect(mapInstance.fitBounds).not.toHaveBeenCalled();

      rerender(<SiteMap boundaries={COLLECTION} focusedArea={COLLECTION.features[0]} />);

      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
      expect(mapInstance.fitBounds.mock.calls[0][0]).toEqual([
        [-110.67, 52.62],
        [-110.66, 52.63],
      ]);
    });

    it('US 2.0.6 AT3: fits the map again when the same area is picked again', () => {
      const area = COLLECTION.features[0];
      const { rerender } = render(<SiteMap boundaries={COLLECTION} focusedArea={area} />);

      rerender(<SiteMap boundaries={COLLECTION} focusedArea={{ ...area }} />);

      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(2);
    });
  });

  describe('status notes', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    });

    it('shows a note while the boundaries load', () => {
      render(<SiteMap boundariesLoading />);

      expect(screen.getByText('Loading boundaries…')).toBeInTheDocument();
    });

    it('shows the error note when the boundaries fail', () => {
      render(<SiteMap boundariesError="Site boundaries could not load." />);

      expect(screen.getByText('Site boundaries could not load.')).toBeInTheDocument();
    });

    it('shows no note in the normal case', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      expect(screen.queryByText('Loading boundaries…')).not.toBeInTheDocument();
    });
  });

  describe('offline tiles', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    });

    it('passes transformRequest to the Map and rewrites only protomaps URLs while offline', () => {
      render(<SiteMap />);

      const options = MockMap.mock.calls[0][0];
      expect(typeof options.transformRequest).toBe('function');

      expect(
        options.transformRequest('https://api.protomaps.com/styles/v5/light/en.json')
      ).toBeUndefined();
      expect(options.transformRequest('https://example.com/tile.png')).toBeUndefined();

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        window.dispatchEvent(new Event('offline'));
      });

      expect(options.transformRequest('https://api.protomaps.com/styles/v5/light/en.json')).toEqual(
        { url: 'sapaa-offline://https://api.protomaps.com/styles/v5/light/en.json' }
      );
      expect(options.transformRequest('https://example.com/tile.png')).toBeUndefined();
    });

    it('registers the offline protocol on mount and removes it on unmount', () => {
      const { unmount } = render(<SiteMap />);

      expect(addProtocolMock).toHaveBeenCalledTimes(1);
      expect(addProtocolMock.mock.calls[0][0]).toBe('sapaa-offline');
      expect(typeof addProtocolMock.mock.calls[0][1]).toBe('function');

      unmount();

      expect(removeProtocolMock).toHaveBeenCalledWith('sapaa-offline');
    });

    it('rejects a protocol request that is not in the offline cache', async () => {
      render(<SiteMap />);
      const handler = addProtocolMock.mock.calls[0][1];

      tileCacheMocks.getCachedResponse.mockResolvedValue(null);
      await expect(
        handler(
          { url: 'sapaa-offline://https://api.protomaps.com/tiles/6/33/21', type: 'arrayBuffer' },
          new AbortController()
        )
      ).rejects.toThrow('Not in offline cache: https://api.protomaps.com/tiles/6/33/21');
    });

    it('serves a cached tile through the protocol handler', async () => {
      render(<SiteMap />);
      const handler = addProtocolMock.mock.calls[0][1];

      const data = new ArrayBuffer(8);
      tileCacheMocks.getCachedResponse.mockResolvedValue({ arrayBuffer: async () => data });

      await expect(
        handler(
          { url: 'sapaa-offline://https://api.protomaps.com/tiles/6/33/21', type: 'arrayBuffer' },
          new AbortController()
        )
      ).resolves.toEqual({ data });
    });

    it('reloads the style when the connection mode flips', () => {
      render(<SiteMap />);

      expect(mapInstance.setStyle).not.toHaveBeenCalled();

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        window.dispatchEvent(new Event('offline'));
      });

      expect(mapInstance.setStyle).toHaveBeenCalledWith(
        'https://api.protomaps.com/styles/v5/light/en.json?key=test-key'
      );
    });

    it('shows the offline badge and counts missing tiles until the view moves', () => {
      jest.useFakeTimers();
      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        render(<SiteMap />);

        expect(
          screen.getByText('Offline map. Tiles outside saved areas are missing.')
        ).toBeInTheDocument();
        expect(screen.queryByText('8 tiles missing in this view.')).not.toBeInTheDocument();

        const error = mapHandler('error');
        for (let index = 0; index < 8; index += 1) {
          act(() =>
            error({ error: { message: 'Not in offline cache: https://api.protomaps.com/tiles/6/33/21' } })
          );
        }
        act(() => jest.advanceTimersByTime(500));

        expect(screen.getByText('8 tiles missing in this view.')).toBeInTheDocument();

        act(() => mapHandler('moveend')());

        expect(screen.queryByText('8 tiles missing in this view.')).not.toBeInTheDocument();
      } finally {
        jest.useRealTimers();
      }
    });

    it('draws the dashed outline of a saved region', () => {
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION]);
      render(<SiteMap />);

      const sourceCall = mapInstance.addSource.mock.calls.find(
        ([id]) => id === OFFLINE_REGIONS_SOURCE_ID
      );
      expect(sourceCall).toBeDefined();
      expect(sourceCall[1].type).toBe('geojson');
      expect(sourceCall[1].data.features[0].geometry.coordinates[0]).toEqual([
        [-115.1, 52.0],
        [-113.5, 52.0],
        [-113.5, 53.5],
        [-115.1, 53.5],
        [-115.1, 52.0],
      ]);

      const layerCall = mapInstance.addLayer.mock.calls.find(
        ([layer]) => layer.id === OFFLINE_REGIONS_LAYER_ID
      );
      expect(layerCall).toBeDefined();
      expect(layerCall[0].type).toBe('line');
      expect(layerCall[0].source).toBe(OFFLINE_REGIONS_SOURCE_ID);
      expect(layerCall[0].paint['line-dasharray']).toEqual([2, 2]);
      expect(layerCall[0].paint['line-color']).toBe('#356B43');
      expect(layerCall[0].paint['line-width']).toBe(2);
    });

    it('covers the world outside the saved regions when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION]);
      // The mask goes below the app layers, so the fill layer must exist.
      mapInstance.getLayer.mockImplementation((id: string) => id === FILL_LAYER_ID);

      render(<SiteMap boundaries={COLLECTION} />);

      const sourceCall = mapInstance.addSource.mock.calls.find(
        ([id]) => id === OFFLINE_MASK_SOURCE_ID
      );
      expect(sourceCall).toBeDefined();
      expect(sourceCall[1].type).toBe('geojson');

      const data = sourceCall[1].data;
      expect(data.features).toHaveLength(1);
      const rings = data.features[0].geometry.coordinates;
      expect(rings[0]).toEqual(WORLD_RING);
      expect(rings[1]).toEqual([
        [-115.1, 52.0],
        [-113.5, 52.0],
        [-113.5, 53.5],
        [-115.1, 53.5],
        [-115.1, 52.0],
      ]);

      const layerCall = mapInstance.addLayer.mock.calls.find(
        ([layer]) => layer.id === OFFLINE_MASK_LAYER_ID
      );
      expect(layerCall).toBeDefined();
      expect(layerCall[0].type).toBe('fill');
      expect(layerCall[0].source).toBe(OFFLINE_MASK_SOURCE_ID);
      expect(layerCall[0].paint['fill-color']).toBe(OFFLINE_MASK_COLOR);
      expect(layerCall[0].paint['fill-opacity']).toBe(1);
      expect(layerCall[1]).toBe(FILL_LAYER_ID);
    });

    it('dissolves overlapping saved regions into disjoint mask holes', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION, OVERLAPPING_REGION]);

      render(<SiteMap />);

      const sourceCall = mapInstance.addSource.mock.calls.find(
        ([id]) => id === OFFLINE_MASK_SOURCE_ID
      );
      expect(sourceCall).toBeDefined();

      const rings = sourceCall[1].data.features[0].geometry.coordinates;
      expect(rings).toHaveLength(4);
      expect(rings[0]).toEqual(WORLD_RING);

      // The raw rings cross, so the holes are the merged union pieces.
      expect(rings[1]).toEqual([
        [-115.1, 52.0],
        [-113.5, 52.0],
        [-113.5, 52.9],
        [-115.1, 52.9],
        [-115.1, 52.0],
      ]);
      expect(rings[2]).toEqual([
        [-115.1, 52.9],
        [-112.8, 52.9],
        [-112.8, 53.5],
        [-115.1, 53.5],
        [-115.1, 52.9],
      ]);
      expect(rings[3]).toEqual([
        [-114.4, 53.5],
        [-112.8, 53.5],
        [-112.8, 54.4],
        [-114.4, 54.4],
        [-114.4, 53.5],
      ]);

      const rawRings = [
        [
          [-115.1, 52.0],
          [-113.5, 52.0],
          [-113.5, 53.5],
          [-115.1, 53.5],
          [-115.1, 52.0],
        ],
        [
          [-114.4, 52.9],
          [-112.8, 52.9],
          [-112.8, 54.4],
          [-114.4, 54.4],
          [-114.4, 52.9],
        ],
      ];
      expect(rings.slice(1)).not.toContainEqual(rawRings[0]);
      expect(rings.slice(1)).not.toContainEqual(rawRings[1]);

      // No app layer exists yet, so the mask needs no beforeId.
      const layerCall = mapInstance.addLayer.mock.calls.find(
        ([layer]) => layer.id === OFFLINE_MASK_LAYER_ID
      );
      expect(layerCall).toBeDefined();
      expect(layerCall[1]).toBeUndefined();
    });

    it('inserts the mask below the region outline when the boundaries layer is absent', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION]);
      mapInstance.getLayer.mockImplementation((id: string) => id === OFFLINE_REGIONS_LAYER_ID);

      render(<SiteMap />);

      const layerCall = mapInstance.addLayer.mock.calls.find(
        ([layer]) => layer.id === OFFLINE_MASK_LAYER_ID
      );
      expect(layerCall).toBeDefined();
      expect(layerCall[1]).toBe(OFFLINE_REGIONS_LAYER_ID);
    });

    it('adds no mask while online', () => {
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION]);

      render(<SiteMap boundaries={COLLECTION} />);

      const sourceCall = mapInstance.addSource.mock.calls.find(
        ([id]) => id === OFFLINE_MASK_SOURCE_ID
      );
      expect(sourceCall).toBeUndefined();
    });

    it('adds no mask offline when no region is saved', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      tileCacheMocks.listRegions.mockReturnValue([]);

      render(<SiteMap boundaries={COLLECTION} />);

      const sourceCall = mapInstance.addSource.mock.calls.find(
        ([id]) => id === OFFLINE_MASK_SOURCE_ID
      );
      expect(sourceCall).toBeUndefined();
    });

    it('re-applies the mask after a style swap', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION]);

      render(<SiteMap />);

      const maskSourceCalls = () =>
        mapInstance.addSource.mock.calls.filter(([id]) => id === OFFLINE_MASK_SOURCE_ID).length;
      expect(maskSourceCalls()).toBe(1);

      // A style swap drops the source, so the map reports it as missing.
      mapInstance.getSource.mockReturnValue(undefined);

      act(() => {
        for (const handler of allMapHandlers('style.load')) handler();
      });

      expect(maskSourceCalls()).toBe(2);
    });

    it('hides the mask when the last region is deleted', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      tileCacheMocks.listRegions.mockReturnValue([SAVED_REGION]);

      render(<SiteMap />);

      expect(
        mapInstance.addSource.mock.calls.some(([id]) => id === OFFLINE_MASK_SOURCE_ID)
      ).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Save offline area' }));
      const { onRegionRemoved } = OfflineSavePanelMock.mock.calls[0][0];

      // The layer exists from the first apply, so the hide path can reach it.
      mapInstance.getLayer.mockImplementation((id: string) => id === OFFLINE_MASK_LAYER_ID);
      act(() => onRegionRemoved(SAVED_REGION.id));

      expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
        OFFLINE_MASK_LAYER_ID,
        'visibility',
        'none'
      );
    });

    it('opens the save panel when the save button is clicked', () => {
      render(<SiteMap />);

      fireEvent.click(screen.getByRole('button', { name: 'Save offline area' }));

      expect(OfflineSavePanelMock).toHaveBeenCalledTimes(1);
      const props = OfflineSavePanelMock.mock.calls[0][0];
      expect(props.map).toBe(mapInstance);
      expect(props.styleUrl).toBe('https://api.protomaps.com/styles/v5/light/en.json?key=test-key');
      expect(props.savedRegions).toEqual([]);
      expect(typeof props.onSaved).toBe('function');
      expect(typeof props.onRegionRemoved).toBe('function');
      expect(typeof props.onClose).toBe('function');
    });

    it('re-applies the boundary source after a style swap without stacking layer listeners', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      // A style swap drops the source, so the map reports it as missing.
      mapInstance.getSource.mockReturnValue(undefined);

      act(() => mapHandler('style.load')());
      act(() => mapHandler('style.load')());

      const boundarySourceCalls = mapInstance.addSource.mock.calls.filter(
        ([id]) => id === 'protected-areas'
      );
      expect(boundarySourceCalls.length).toBe(3);

      const fillListenerCalls = mapInstance.on.mock.calls.filter(
        ([name, layer]) => name === 'mousemove' && layer === 'protected-areas-fill'
      );
      expect(fillListenerCalls.length).toBe(1);
    });
  });
});
