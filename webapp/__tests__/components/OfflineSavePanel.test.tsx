import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import OfflineSavePanel from '@/components/map/OfflineSavePanel';
import type { OfflineSavePanelProps } from '@/components/map/OfflineSavePanel';
import {
  DownloadAbortedError,
  downloadArea,
  removeRegion,
} from '@/lib/map/offline/tileCache';
import type { SavedRegion } from '@/lib/map/offline/tileCache';
import { countTiles } from '@/lib/map/offline/tileMath';

// downloadArea writes to the tile cache, so the test replaces the whole module.
// DownloadAbortedError stays a real class so instanceof keeps working.
jest.mock('@/lib/map/offline/tileCache', () => {
  class DownloadAbortedError extends Error {}
  return {
    __esModule: true,
    DownloadAbortedError,
    downloadArea: jest.fn(),
    removeRegion: jest.fn(),
  };
});

const downloadAreaMock = downloadArea as unknown as jest.Mock;
const removeRegionMock = removeRegion as unknown as jest.Mock;

// The rectangle is centered at 72 percent of a 1000 x 500 container.
const RECT = {
  left: 140,
  top: 70,
  right: 860,
  bottom: 430,
  width: 720,
  height: 360,
  x: 140,
  y: 70,
  toJSON: () => RECT,
};

type UnprojectImplementation = (point: { x: number; y: number }) => { lng: number; lat: number };

let unprojectImplementation: UnprojectImplementation = ({ x, y }) => ({
  lng: -114 + x / 100,
  lat: 54 + y / 100,
});

function makeMap() {
  const map = {
    getZoom: jest.fn(() => 8),
    unproject: jest.fn((point: { x: number; y: number }) => unprojectImplementation(point)),
    getContainer: jest.fn(() => ({
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 500 }),
    })),
    on: jest.fn(),
    off: jest.fn(),
  };
  return map as unknown as MapLibreMap;
}

const AREA = {
  west: -114 + 140 / 100,
  south: 54 + 70 / 100,
  east: -114 + 860 / 100,
  north: 54 + 430 / 100,
};

const DEFAULT_COUNT = countTiles({ ...AREA, zoomMin: 6, zoomMax: 10 });

const REGIONS: SavedRegion[] = [
  {
    id: 'r1',
    bounds: { west: -113, south: 54, east: -112, north: 55 },
    zoomMin: 6,
    zoomMax: 8,
    tileCount: 40,
    savedAt: '2026-01-05T12:00:00.000Z',
  },
  {
    id: 'r2',
    bounds: { west: -111, south: 54, east: -110, north: 55 },
    zoomMin: 7,
    zoomMax: 9,
    tileCount: 55,
    savedAt: '2026-02-10T12:00:00.000Z',
  },
];

function renderPanel(overrides: Partial<OfflineSavePanelProps> = {}) {
  const props: OfflineSavePanelProps = {
    map: makeMap(),
    styleUrl: 'https://tiles.example.com/style.json',
    savedRegions: [],
    onSaved: jest.fn(),
    onRegionRemoved: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<OfflineSavePanel {...props} />);
  return props;
}

function moveendHandler(map: MapLibreMap): () => void {
  const calls = (map.on as unknown as jest.Mock).mock.calls.filter(
    ([event]) => event === 'moveend'
  );
  const last = calls[calls.length - 1];
  if (last === undefined) throw new Error('the component bound no moveend handler');
  return last[1] as () => void;
}

describe('OfflineSavePanel (US 4.0.2)', () => {
  let rectSpy: jest.SpyInstance;

  beforeAll(() => {
    rectSpy = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue(RECT as DOMRect);
  });

  afterAll(() => {
    rectSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    unprojectImplementation = ({ x, y }) => ({ lng: -114 + x / 100, lat: 54 + y / 100 });
    removeRegionMock.mockResolvedValue(undefined);
  });

  it('renders the saved-area label and the tile estimate', () => {
    renderPanel();

    expect(screen.getByText('Saved area')).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_COUNT} tiles`)).toBeInTheDocument();
  });

  it('disables Save while the device is offline and shows the offline message', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      renderPanel();

      expect(screen.getByRole('button', { name: 'Save area' })).toBeDisabled();
      expect(screen.getByText('Go online to download tiles.')).toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });

  it('shows the hint and disables Save when the rectangle has no size', () => {
    rectSpy.mockReturnValue({ ...RECT, width: 0, height: 0 } as DOMRect);
    try {
      renderPanel();

      expect(screen.getByText('Pan or zoom the map to set the area.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save area' })).toBeDisabled();
    } finally {
      rectSpy.mockReturnValue(RECT as DOMRect);
    }
  });

  it('updates the estimate when the zoom band changes', () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('From zoom'), { target: { value: '9' } });

    const expected = countTiles({ ...AREA, zoomMin: 9, zoomMax: 10 });
    expect(screen.getByText(`${expected} tiles`)).toBeInTheDocument();
  });

  it('keeps the minimum zoom below the maximum zoom', () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('To zoom'), { target: { value: '5' } });

    expect((screen.getByLabelText('From zoom') as HTMLSelectElement).value).toBe('5');
    expect((screen.getByLabelText('To zoom') as HTMLSelectElement).value).toBe('5');
  });

  it('recomputes the estimate when the map fires moveend', () => {
    const map = makeMap();
    renderPanel({ map });

    unprojectImplementation = ({ x, y }) => ({ lng: -113 + x / 100, lat: 55 + y / 100 });
    act(() => moveendHandler(map)());

    const expected = countTiles({
      west: -113 + 140 / 100,
      south: 55 + 70 / 100,
      east: -113 + 860 / 100,
      north: 55 + 430 / 100,
      zoomMin: 6,
      zoomMax: 10,
    });
    expect(screen.getByText(`${expected} tiles`)).toBeInTheDocument();
  });

  it('disables Save when the area holds too many tiles', () => {
    unprojectImplementation = ({ x, y }) => ({ lng: -130 + x / 10, lat: 40 + y / 50 });
    renderPanel();

    const expected = countTiles({
      west: -130 + 140 / 10,
      south: 40 + 70 / 50,
      east: -130 + 860 / 10,
      north: 40 + 430 / 50,
      zoomMin: 6,
      zoomMax: 10,
    });
    expect(expected).toBeGreaterThan(4000);
    expect(screen.getByRole('button', { name: 'Save area' })).toBeDisabled();
    expect(
      screen.getByText(`Too many tiles: ${expected}. Zoom in or narrow the zoom band.`)
    ).toBeInTheDocument();
  });

  it('downloads the area, reports progress and calls onSaved on success (4.0.2 AT1)', async () => {
    const region: SavedRegion = {
      id: 'new-region',
      bounds: { ...AREA },
      zoomMin: 6,
      zoomMax: 10,
      tileCount: DEFAULT_COUNT,
      savedAt: '2026-03-01T12:00:00.000Z',
    };
    let resolveDownload: (value: { region: SavedRegion; failed: number }) => void = () => {};
    downloadAreaMock.mockImplementation((options) => {
      options.onProgress({ done: 1, total: 4, failed: 0, phase: 'style' });
      options.onProgress({ done: 2, total: 4, failed: 1, phase: 'tiles' });
      return new Promise((resolve) => {
        resolveDownload = resolve;
      });
    });
    const props = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Save area' }));

    expect(downloadAreaMock).toHaveBeenCalledTimes(1);
    const options = downloadAreaMock.mock.calls[0][0];
    expect(options.area).toEqual({ ...AREA, zoomMin: 6, zoomMax: 10 });
    expect(options.styleUrl).toBe('https://tiles.example.com/style.json');
    expect(options.signal).toBeInstanceOf(AbortSignal);

    expect(screen.getByText('tiles: 2/4')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();

    await act(async () => {
      resolveDownload({ region, failed: 1 });
    });

    expect(props.onSaved).toHaveBeenCalledWith(region);
    expect(screen.getByText(new RegExp(`Saved ${DEFAULT_COUNT} tiles\\.`))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('returns to the ready state without a message when the download aborts', async () => {
    downloadAreaMock.mockRejectedValue(new DownloadAbortedError('The download stopped.'));
    const props = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Save area' }));
    await act(async () => {});

    expect(props.onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save area' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cancels a running download and keeps the panel open', async () => {
    let abortSignal: AbortSignal | undefined;
    downloadAreaMock.mockImplementation(
      (options) =>
        new Promise((_resolve, reject) => {
          abortSignal = options.signal;
          options.signal.addEventListener('abort', () => {
            reject(new DownloadAbortedError('The download stopped.'));
          });
        })
    );
    const props = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Save area' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () => {});

    expect(abortSignal?.aborted).toBe(true);
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save area' })).toBeEnabled();
  });

  it('shows the error message when the download fails for another reason (4.0.2 AT1)', async () => {
    downloadAreaMock.mockRejectedValue(
      new RangeError('The area has 9000 tiles, which is above the download cap of 4000 tiles.')
    );
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Save area' }));
    await act(async () => {});

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'The area has 9000 tiles, which is above the download cap of 4000 tiles.'
    );
    expect(screen.getByRole('button', { name: 'Save area' })).toBeEnabled();
  });

  it('lists the saved regions and removes one through removeRegion', async () => {
    const props = renderPanel({ savedRegions: REGIONS });

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('z6 to z8')).toBeInTheDocument();
    expect(within(rows[0]).getByText(/40 tiles/)).toBeInTheDocument();

    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Delete saved area' }));
    await act(async () => {});

    expect(removeRegionMock).toHaveBeenCalledWith('r1');
    expect(props.onRegionRemoved).toHaveBeenCalledWith('r1');
    const onRegionRemoved = props.onRegionRemoved as unknown as jest.Mock;
    expect(
      removeRegionMock.mock.invocationCallOrder[0]
    ).toBeLessThan(onRegionRemoved.mock.invocationCallOrder[0]);
  });

  it('calls onClose from the close button', () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('aborts a running download before it calls onClose', async () => {
    let abortSignal: AbortSignal | undefined;
    let abortedWhenClosed = false;
    downloadAreaMock.mockImplementation(
      (options) =>
        new Promise((_resolve, reject) => {
          abortSignal = options.signal;
          options.signal.addEventListener('abort', () => {
            reject(new DownloadAbortedError('The download stopped.'));
          });
        })
    );
    const onClose = jest.fn(() => {
      abortedWhenClosed = abortSignal?.aborted ?? false;
    });
    const props = renderPanel({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Save area' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    await act(async () => {});

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(abortedWhenClosed).toBe(true);
  });
});
