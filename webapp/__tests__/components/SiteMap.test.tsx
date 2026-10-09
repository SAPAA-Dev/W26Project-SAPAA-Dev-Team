import React from 'react';
import { render, screen, act } from '@testing-library/react';
import SiteMap from '@/components/map/SiteMap';
import type { BoundaryFeatureCollection } from '@/lib/map/boundaries';

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
      __map: map,
      __popup: popup,
    };
  },
  { virtual: true }
);

const mocks = jest.requireMock('maplibre-gl') as {
  Map: jest.Mock;
  Popup: jest.Mock;
  __map: Record<string, jest.Mock>;
  __popup: Record<string, jest.Mock>;
};

const MockMap = mocks.Map;
const mapInstance = mocks.__map;
const popupInstance = mocks.__popup;

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
let resizeCallback: (() => void) | null = null;

// One object, so a test can read the cursor the component wrote.
const canvas = { style: { cursor: '' } };

const FILL_LAYER_ID = 'protected-areas-fill';
const OUTLINE_LAYER_ID = 'protected-areas-outline';
const SOURCE_ID = 'protected-areas';

const MAP_BOX = {
  center: [-114.5, 54.5],
  zoom: 5.5,
  maxBounds: [
    [-122.0, 48.0],
    [-108.0, 60.5],
  ],
};

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

/** The handler the component bound to one event on the fill layer. */
function layerHandler(eventName: string): (event: Record<string, unknown>) => void {
  const call = mapInstance.on.mock.calls.find(
    ([name, layer]) => name === eventName && layer === FILL_LAYER_ID
  );
  if (call === undefined) throw new Error(`the component bound no ${eventName} handler`);
  return call[2];
}

describe('SiteMap', () => {
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

    mapInstance.isStyleLoaded.mockReturnValue(true);
    mapInstance.getSource.mockReturnValue(undefined);
    mapInstance.getCanvas.mockReturnValue(canvas);
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

  it('opens the bounded Alberta view with the Protomaps style when the key is set', () => {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test+key/1';
    render(<SiteMap />);

    expect(MockMap).toHaveBeenCalledTimes(1);
    const options = MockMap.mock.calls[0][0];

    expect(options.style).toBe(
      'https://api.protomaps.com/styles/v5/light/en.json?key=test%2Bkey%2F1'
    );
    expect(options.center).toEqual(MAP_BOX.center);
    expect(options.zoom).toBe(MAP_BOX.zoom);
    expect(options.maxBounds).toEqual(MAP_BOX.maxBounds);
    expect(options.renderWorldCopies).toBe(false);
    expect(mockObserve).toHaveBeenCalledTimes(1);
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

    it('opens a popup with the name and the area type on click', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      const lngLat = { lng: -110.5, lat: 52.6 };
      act(() =>
        layerHandler('click')({
          lngLat,
          features: [
            { id: 1, properties: { name: 'Wainwright Dunes', area_type: 'Ecological Reserve' } },
          ],
        })
      );

      expect(popupInstance.setLngLat).toHaveBeenCalledWith(lngLat);
      expect(popupInstance.addTo).toHaveBeenCalledWith(mapInstance);

      const content = popupInstance.setDOMContent.mock.calls[0][0] as HTMLElement;
      expect(content.textContent).toContain('Wainwright Dunes');
      expect(content.textContent).toContain('Ecological Reserve');
    });

    it('lists the stored fields under the subtitle and puts notes on their own lines', () => {
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

      const content = popupInstance.setDOMContent.mock.calls[0][0] as HTMLElement;
      const fields = Array.from(content.querySelectorAll('[data-field]')).map(
        (line) => line.textContent
      );

      expect(fields).toEqual([
        'NAME: Pembina River',
        'FID: 0',
        'TYPE: NA',
        'SUBTYPE: Conservation',
        'IUCN: II',
        'OC_NO: OC 454/71-42',
        'ACRES: 185.835377',
        'HECTARES: 75.204909',
        'OC_DATE: 1971-03-15',
        'DATE_EST: 1971-03-15',
        'OC_NAME: Pembina River Natural Area',
      ]);
      expect(content.querySelector('[data-notes-heading]')?.textContent).toBe('NOTES');
      expect(content.querySelector('[data-notes-body]')?.textContent).toBe('Watch the riverbank.');
      expect(content.querySelector('[data-notes-heading]')?.parentElement?.className).toContain('mt-4');
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

      const content = popupInstance.setDOMContent.mock.calls[0][0] as HTMLElement;
      const fields = Array.from(content.querySelectorAll('[data-field]')).map(
        (line) => line.textContent
      );

      expect(fields).toEqual(['NAME: Pembina River', 'FID: 0', 'TYPE: NA']);
      expect(content.querySelector('[data-notes-heading]')).toBeNull();
    });

    it('falls back to a generic title when the feature carries no name', () => {
      render(<SiteMap boundaries={COLLECTION} />);

      act(() => layerHandler('click')({ lngLat: { lng: 0, lat: 0 }, features: [{ id: 1 }] }));

      const content = popupInstance.setDOMContent.mock.calls[0][0] as HTMLElement;
      expect(content.textContent).toContain('Protected area');
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
});
