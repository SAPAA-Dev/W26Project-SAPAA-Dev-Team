import React from 'react';
import { render, screen, act } from '@testing-library/react';
import SiteMap from '@/components/map/SiteMap';

// maplibre-gl publishes only an "import" condition, so Jest's CommonJS resolver
// cannot find it. A virtual mock skips resolution and keeps the real WebGL build out of jsdom.
jest.mock(
  'maplibre-gl',
  () => ({
    __esModule: true,
    Map: jest.fn(() => ({ resize: jest.fn(), remove: jest.fn() })),
  }),
  { virtual: true }
);

const MockMap = (jest.requireMock('maplibre-gl') as { Map: jest.Mock }).Map;

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
let resizeCallback: (() => void) | null = null;

const MAP_BOX = {
  center: [-114.5, 54.5],
  zoom: 5.5,
  maxBounds: [
    [-122.0, 48.0],
    [-108.0, 60.5],
  ],
};

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
    delete process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY;
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

    const instance = MockMap.mock.results[0].value;
    act(() => resizeCallback?.());

    expect(instance.resize).toHaveBeenCalledTimes(1);
  });

  it('removes the map and the observer on unmount', () => {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = 'test-key';
    const { unmount } = render(<SiteMap />);

    const instance = MockMap.mock.results[0].value;
    unmount();

    expect(instance.remove).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
