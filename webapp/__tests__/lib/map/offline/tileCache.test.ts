import {
  DownloadAbortedError,
  DownloadProgress,
  REGION_STORAGE_KEY,
  SavedRegion,
  TILE_CACHE_NAME,
  addRegion,
  downloadArea,
  getCachedResponse,
  listRegions,
  openTileCache,
  putUrl,
  removeRegion,
} from '@/lib/map/offline/tileCache';
import { OfflineArea, enumerateTiles } from '@/lib/map/offline/tileMath';

const ALBERTA_BOX: OfflineArea = {
  west: -114.1,
  south: 54.3,
  east: -113.9,
  north: 54.5,
  zoomMin: 7,
  zoomMax: 8,
};

const WIDE_BOX: OfflineArea = {
  west: -114.5,
  south: 54.0,
  east: -113.0,
  north: 55.5,
  zoomMin: 7,
  zoomMax: 7,
};

const STYLE_URL = 'https://style.test/style.json';
const TILE_HOST = 'https://tiles.test';

const VECTOR_STYLE = {
  version: 8,
  sources: { protomaps: { type: 'vector', tiles: [`${TILE_HOST}/{z}/{x}/{y}.pbf`] } },
  glyphs: 'https://glyphs.test/{fontstack}/{range}.pbf',
  sprite: 'https://style.test/sprite',
  layers: [{ id: 'label', type: 'symbol', layout: { 'text-font': ['Noto Sans Regular'] } }],
};

const TILEJSON_STYLE = {
  version: 8,
  sources: { protomaps: { type: 'vector', url: `${TILE_HOST}/tilejson.json` } },
  layers: [],
};

const originalFetch = global.fetch;

let cacheStore: Map<string, Response>;
let putMock: jest.Mock;
let deleteMock: jest.Mock;
let deleteCacheMock: jest.Mock;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function textResponse(body = 'ok', status = 200): Response {
  return new Response(body, { status });
}

function makeRegion(overrides: Partial<SavedRegion> = {}): SavedRegion {
  return {
    id: 'region-a',
    bounds: { west: -114.1, south: 54.3, east: -113.9, north: 54.5 },
    zoomMin: 7,
    zoomMax: 8,
    tileCount: 3,
    savedAt: '2026-10-19T12:00:00.000Z',
    ...overrides,
  };
}

function tileUrls(area: OfflineArea): string[] {
  return enumerateTiles(area).map((tile) => `${TILE_HOST}/${tile.z}/${tile.x}/${tile.y}.pbf`);
}

function installCache(): void {
  cacheStore = new Map();
  putMock = jest.fn(async (url: string, response: Response) => {
    cacheStore.set(url, response);
  });
  deleteMock = jest.fn(async (url: string) => {
    cacheStore.delete(url);
    return true;
  });
  const cacheStub = {
    put: putMock,
    match: jest.fn(async (url: string) => cacheStore.get(url) ?? null),
    delete: deleteMock,
    keys: jest.fn(async () => [...cacheStore.keys()].map((url) => ({ url }))),
  } as unknown as Cache;
  deleteCacheMock = jest.fn(async () => true);
  (globalThis as Record<string, unknown>).caches = {
    open: jest.fn(async (name: string) => {
      expect(name).toBe(TILE_CACHE_NAME);
      return cacheStub;
    }),
    delete: deleteCacheMock,
  };
}

function installFetch(
  routes: Record<string, Response | (() => Response | Promise<Response>)>,
  fallback: Response = textResponse()
): jest.Mock {
  const fetchMock = jest.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    const route = routes[url];
    if (route) return typeof route === 'function' ? await route() : route;
    return fallback;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  window.localStorage.clear();
  installCache();
});

afterAll(() => {
  global.fetch = originalFetch;
  delete (globalThis as Record<string, unknown>).caches;
});

describe('saved regions', () => {
  it('starts with no saved regions', () => {
    expect(listRegions()).toEqual([]);
  });

  it('adds regions and lists them', () => {
    const first = makeRegion();
    const second = makeRegion({ id: 'region-b' });

    addRegion(first);
    addRegion(second);

    expect(listRegions()).toEqual([first, second]);
    const stored = JSON.parse(window.localStorage.getItem(REGION_STORAGE_KEY) ?? '');
    expect(stored).toHaveLength(2);
  });

  it('returns no regions when the stored JSON is corrupt', () => {
    for (const corrupt of ['{ not json', '"a string"', '{"regions": []}']) {
      window.localStorage.setItem(REGION_STORAGE_KEY, corrupt);
      expect(listRegions()).toEqual([]);
    }
  });

  it('returns no regions when a stored entry is not a region', () => {
    window.localStorage.setItem(REGION_STORAGE_KEY, '[1, "text"]');
    expect(listRegions()).toEqual([]);
  });

  it('removes a region record', async () => {
    const first = makeRegion();
    const second = makeRegion({ id: 'region-b' });
    addRegion(first);
    addRegion(second);

    await removeRegion(first.id);

    expect(listRegions()).toEqual([second]);
  });

  it('deletes the whole tile cache when the last region goes', async () => {
    addRegion(makeRegion());

    await removeRegion('region-a');

    expect(listRegions()).toEqual([]);
    expect(deleteCacheMock).toHaveBeenCalledWith(TILE_CACHE_NAME);
  });

  it('keeps the cache while another region remains', async () => {
    const kept = makeRegion({ id: 'region-b' });
    addRegion(makeRegion());
    addRegion(kept);

    await removeRegion('region-a');

    expect(deleteCacheMock).not.toHaveBeenCalled();
    expect(listRegions()).toEqual([kept]);
  });

  it('does not wipe the cache while a download runs', async () => {
    let releaseStyle!: (response: Response) => void;
    const styleGate = new Promise<Response>((resolve) => {
      releaseStyle = resolve;
    });
    installFetch({ [STYLE_URL]: () => styleGate });

    const download = downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL });

    addRegion(makeRegion());
    await removeRegion('region-a');

    expect(listRegions()).toEqual([]);
    expect(deleteCacheMock).not.toHaveBeenCalled();

    releaseStyle(jsonResponse(VECTOR_STYLE));
    const result = await download;

    expect(result.failed).toBe(0);
    expect(listRegions()).toEqual([result.region]);
  });

  it('keeps the tiles of a running download when another region remains', async () => {
    let releaseStyle!: (response: Response) => void;
    const styleGate = new Promise<Response>((resolve) => {
      releaseStyle = resolve;
    });
    installFetch({ [STYLE_URL]: () => styleGate });

    const download = downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL });

    // The kept region does not cover the removed tile, so only the download
    // guard keeps that tile alive during the delete.
    const keptRegion = makeRegion({
      id: 'region-b',
      bounds: { west: -110.0, south: 52.0, east: -109.9, north: 52.1 },
    });
    addRegion(makeRegion());
    addRegion(keptRegion);
    const removedTile = `${TILE_HOST}/7/23/40.pbf`;
    await putUrl(removedTile, textResponse());
    await removeRegion('region-a');

    expect(listRegions()).toEqual([keptRegion]);
    expect(deleteMock).not.toHaveBeenCalled();
    expect(cacheStore.has(removedTile)).toBe(true);

    releaseStyle(jsonResponse(VECTOR_STYLE));
    await download;
  });

  it('still finishes the region delete when the cache wipe fails', async () => {
    addRegion(makeRegion());
    (deleteCacheMock as jest.Mock).mockRejectedValueOnce(new Error('storage busy'));

    await expect(removeRegion('region-a')).resolves.toBeUndefined();

    expect(listRegions()).toEqual([]);
  });

  it('keeps every region when the id is unknown', async () => {
    const region = makeRegion();
    addRegion(region);

    await removeRegion('unknown-id');

    expect(listRegions()).toEqual([region]);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('deletes only the tiles that no other region uses', async () => {
    const removedRegion = makeRegion({
      id: 'wide-region',
      bounds: { west: WIDE_BOX.west, south: WIDE_BOX.south, east: WIDE_BOX.east, north: WIDE_BOX.north },
      zoomMin: WIDE_BOX.zoomMin,
      zoomMax: WIDE_BOX.zoomMax,
      tileCount: 2,
    });
    const keptRegion = makeRegion({
      id: 'small-region',
      bounds: { west: ALBERTA_BOX.west, south: ALBERTA_BOX.south, east: ALBERTA_BOX.east, north: ALBERTA_BOX.north },
      zoomMin: 7,
      zoomMax: 7,
      tileCount: 1,
    });
    addRegion(removedRegion);
    addRegion(keptRegion);
    const wideUrls = tileUrls(WIDE_BOX);
    const smallUrls = tileUrls({ ...ALBERTA_BOX, zoomMin: 7, zoomMax: 7 });
    expect(wideUrls).toEqual(expect.arrayContaining(smallUrls));
    expect(wideUrls).toHaveLength(2);
    for (const url of [...wideUrls, STYLE_URL]) {
      await putUrl(url, textResponse());
    }

    await removeRegion(removedRegion.id);

    const onlyInRemovedRegion = wideUrls.filter((url) => !smallUrls.includes(url));
    expect(deleteMock).toHaveBeenCalledTimes(onlyInRemovedRegion.length);
    for (const url of onlyInRemovedRegion) {
      expect(deleteMock).toHaveBeenCalledWith(url);
    }
    for (const url of smallUrls) {
      expect(cacheStore.has(url)).toBe(true);
    }
    expect(cacheStore.has(STYLE_URL)).toBe(true);
  });
});

describe('tile cache', () => {
  it('opens the tile cache', async () => {
    await expect(openTileCache()).resolves.toBeDefined();
  });

  it('returns null when the Cache API is not available', async () => {
    (globalThis as Record<string, unknown>).caches = undefined;

    await expect(openTileCache()).resolves.toBe(null);
    await expect(putUrl(STYLE_URL, textResponse())).resolves.toBeUndefined();
    await expect(getCachedResponse(STYLE_URL)).resolves.toBe(null);
  });

  it('puts a response and returns it on a match', async () => {
    const response = textResponse('cached body');
    await putUrl(STYLE_URL, response);

    await expect(getCachedResponse(STYLE_URL)).resolves.toBe(response);
    await expect(getCachedResponse('https://style.test/missing.json')).resolves.toBe(null);
  });
});

describe('downloadArea', () => {
  it('downloads the style, the resources, and every tile', async () => {
    const fetchMock = installFetch({ [STYLE_URL]: jsonResponse(VECTOR_STYLE) });
    const progress: DownloadProgress[] = [];

    const result = await downloadArea({
      area: ALBERTA_BOX,
      styleUrl: STYLE_URL,
      onProgress: (update) => progress.push(update),
    });

    expect(result.failed).toBe(0);
    expect(result.region.tileCount).toBe(3);
    expect(result.region.bounds).toEqual({ west: -114.1, south: 54.3, east: -113.9, north: 54.5 });
    expect(result.region.zoomMin).toBe(7);
    expect(result.region.zoomMax).toBe(8);
    expect(new Date(result.region.savedAt).toISOString()).toBe(result.region.savedAt);
    expect(listRegions()).toEqual([result.region]);

    const phases = progress.map((update) => update.phase);
    expect(phases[0]).toBe('style');
    expect(phases).toContain('resources');
    expect(phases.filter((phase) => phase === 'tiles')).toHaveLength(3);
    expect(phases[phases.length - 1]).toBe('done');
    expect(progress[progress.length - 1]).toEqual({ done: 3, total: 3, failed: 0, phase: 'done' });

    expect(fetchMock).toHaveBeenCalledWith(STYLE_URL, expect.anything());
    for (const url of tileUrls(ALBERTA_BOX)) {
      expect(fetchMock).toHaveBeenCalledWith(url, expect.anything());
      expect(cacheStore.has(url)).toBe(true);
    }
    for (const range of ['0-255', '256-511', '8192-8447']) {
      expect(cacheStore.has(`https://glyphs.test/Noto%20Sans%20Regular/${range}.pbf`)).toBe(true);
    }
    for (const suffix of ['.json', '.png', '@2x.json', '@2x.png']) {
      expect(cacheStore.has(`https://style.test/sprite${suffix}`)).toBe(true);
    }
    expect(cacheStore.has(STYLE_URL)).toBe(true);
  });

  it('refuses an area above the download cap', async () => {
    const fetchMock = installFetch({ [STYLE_URL]: jsonResponse(VECTOR_STYLE) });
    const hugeArea: OfflineArea = { west: -120, south: 49, east: -110, north: 60, zoomMin: 10, zoomMax: 12 };

    await expect(downloadArea({ area: hugeArea, styleUrl: STYLE_URL })).rejects.toThrow(RangeError);
    await expect(downloadArea({ area: hugeArea, styleUrl: STYLE_URL })).rejects.toThrow(/33100 tiles.*4000/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses an area with no tiles', async () => {
    const fetchMock = installFetch({ [STYLE_URL]: jsonResponse(VECTOR_STYLE) });
    const invertedArea: OfflineArea = { west: -113, south: 54, east: -114, north: 55, zoomMin: 7, zoomMax: 8 };

    await expect(downloadArea({ area: invertedArea, styleUrl: STYLE_URL })).rejects.toThrow(
      /holds no tiles/
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(listRegions()).toEqual([]);
  });

  it('counts a 404 tile as failed and still saves the region', async () => {
    installFetch({
      [STYLE_URL]: jsonResponse(VECTOR_STYLE),
      [`${TILE_HOST}/7/23/40.pbf`]: textResponse('missing', 404),
    });

    const result = await downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL });

    expect(result.failed).toBe(1);
    expect(result.region.tileCount).toBe(2);
    expect(listRegions()).toEqual([result.region]);
    expect(cacheStore.has(`${TILE_HOST}/7/23/40.pbf`)).toBe(false);
    expect(cacheStore.has(`${TILE_HOST}/8/46/81.pbf`)).toBe(true);
  });

  it('counts a network error on a tile as failed and still saves the region', async () => {
    installFetch({
      [STYLE_URL]: jsonResponse(VECTOR_STYLE),
      [`${TILE_HOST}/8/47/81.pbf`]: () => {
        throw new Error('network down');
      },
    });

    const result = await downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL });

    expect(result.failed).toBe(1);
    expect(result.region.tileCount).toBe(2);
    expect(listRegions()).toEqual([result.region]);
  });

  it('throws and saves no region when every tile fails', async () => {
    installFetch({
      [STYLE_URL]: jsonResponse(VECTOR_STYLE),
      [`${TILE_HOST}/7/23/40.pbf`]: textResponse('missing', 404),
      [`${TILE_HOST}/8/46/81.pbf`]: textResponse('missing', 404),
      [`${TILE_HOST}/8/47/81.pbf`]: textResponse('missing', 404),
    });

    await expect(downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL })).rejects.toThrow(
      /stored no tiles/
    );
    expect(listRegions()).toEqual([]);
  });

  it('fails when the browser has no Cache API', async () => {
    installFetch({ [STYLE_URL]: jsonResponse(VECTOR_STYLE) });
    delete (globalThis as Record<string, unknown>).caches;

    await expect(downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL })).rejects.toThrow(
      /no offline tile storage/
    );
    expect(listRegions()).toEqual([]);
  });

  it('turns a cancel during the style fetch into DownloadAbortedError', async () => {
    const controller = new AbortController();
    installFetch({
      [STYLE_URL]: () => {
        controller.abort();
        throw new DOMException('The operation was aborted.', 'AbortError');
      },
    });

    await expect(
      downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL, signal: controller.signal })
    ).rejects.toThrow(DownloadAbortedError);
    expect(listRegions()).toEqual([]);
  });

  it('aborts a running tile download', async () => {
    const controller = new AbortController();
    const fetchMock = installFetch({
      [STYLE_URL]: jsonResponse(VECTOR_STYLE),
      [`${TILE_HOST}/7/23/40.pbf`]: () => {
        controller.abort();
        return textResponse('tile');
      },
    });

    await expect(
      downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL, signal: controller.signal })
    ).rejects.toThrow(DownloadAbortedError);
    expect(listRegions()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(`${TILE_HOST}/7/23/40.pbf`, expect.anything());
  });

  it('throws when the style request fails', async () => {
    installFetch({ [STYLE_URL]: textResponse('no access', 403) });

    await expect(downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL })).rejects.toThrow(/403/);
    expect(listRegions()).toEqual([]);
  });

  it('throws when the style has no vector source', async () => {
    const rasterOnlyStyle = {
      version: 8,
      sources: { photos: { type: 'raster', tiles: ['https://raster.test/{z}/{x}/{y}.png'] } },
      layers: [],
    };
    installFetch({ [STYLE_URL]: jsonResponse(rasterOnlyStyle) });

    await expect(downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL })).rejects.toThrow(/vector source/);
    expect(listRegions()).toEqual([]);
  });

  it('aborts with DownloadAbortedError before it fetches tiles', async () => {
    const fetchMock = installFetch({ [STYLE_URL]: jsonResponse(VECTOR_STYLE) });
    const controller = new AbortController();
    controller.abort();
    const progress: DownloadProgress[] = [];

    await expect(
      downloadArea({
        area: ALBERTA_BOX,
        styleUrl: STYLE_URL,
        signal: controller.signal,
        onProgress: (update) => progress.push(update),
      })
    ).rejects.toThrow(DownloadAbortedError);
    expect(new DownloadAbortedError('stopped')).toBeInstanceOf(Error);

    expect(listRegions()).toEqual([]);
    expect(progress[progress.length - 1].phase).toBe('aborted');
    for (const url of tileUrls(ALBERTA_BOX)) {
      expect(fetchMock).not.toHaveBeenCalledWith(url, expect.anything());
    }
  });

  it('reads the tile template from a TileJSON url', async () => {
    const fetchMock = installFetch({
      [STYLE_URL]: jsonResponse(TILEJSON_STYLE),
      [`${TILE_HOST}/tilejson.json`]: jsonResponse({ tiles: ['https://tiles.alt.test/{z}/{x}/{y}.pbf'] }),
    });

    const result = await downloadArea({ area: ALBERTA_BOX, styleUrl: STYLE_URL });

    expect(result.failed).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(`${TILE_HOST}/tilejson.json`, expect.anything());
    expect(cacheStore.has(`${TILE_HOST}/tilejson.json`)).toBe(true);
    for (const tile of enumerateTiles(ALBERTA_BOX)) {
      const url = `https://tiles.alt.test/${tile.z}/${tile.x}/${tile.y}.pbf`;
      expect(fetchMock).toHaveBeenCalledWith(url, expect.anything());
      expect(cacheStore.has(url)).toBe(true);
    }
    expect(listRegions()).toEqual([result.region]);
  });
});
