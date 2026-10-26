import {
  ESTIMATED_BYTES_PER_TILE,
  MAX_OFFLINE_ZOOM,
  MAX_TILES_PER_DOWNLOAD,
  MIN_OFFLINE_ZOOM,
  AreaRectangle,
  OfflineArea,
  countTiles,
  enumerateTiles,
  estimateBytes,
  latitudeToTileY,
  longitudeToTileX,
  mergeToDisjointRectangles,
} from '@/lib/map/offline/tileMath';

const ALBERTA_BOX: OfflineArea = {
  west: -114.1,
  south: 54.3,
  east: -113.9,
  north: 54.5,
  zoomMin: 7,
  zoomMax: 8,
};

describe('tileMath constants', () => {
  it('exports the download cap and the size estimate', () => {
    expect(MAX_TILES_PER_DOWNLOAD).toBe(4000);
    expect(ESTIMATED_BYTES_PER_TILE).toBe(10000);
  });

  it('exports the supported zoom band', () => {
    expect(MIN_OFFLINE_ZOOM).toBe(5);
    expect(MAX_OFFLINE_ZOOM).toBe(14);
  });
});

describe('countTiles', () => {
  it('counts the tiles that cover the Alberta box at zoom 7 and 8', () => {
    // z=7: x 23..23, y 40..40. z=8: x 46..47, y 81..81.
    expect(countTiles(ALBERTA_BOX)).toBe(3);
  });

  it('counts a single zoom level', () => {
    expect(countTiles({ ...ALBERTA_BOX, zoomMin: 7, zoomMax: 7 })).toBe(1);
    expect(countTiles({ ...ALBERTA_BOX, zoomMin: 8, zoomMax: 8 })).toBe(2);
  });

  it('returns 0 tiles for inverted bounds', () => {
    const invertedLongitude: OfflineArea = { ...ALBERTA_BOX, west: -113.9, east: -114.1 };
    const invertedLatitude: OfflineArea = { ...ALBERTA_BOX, south: 54.5, north: 54.3 };

    expect(countTiles(invertedLongitude)).toBe(0);
    expect(countTiles(invertedLatitude)).toBe(0);
  });

  it('returns 0 tiles for bounds that are not numbers', () => {
    const emptyBounds: OfflineArea = {
      west: Number.NaN,
      south: 54.3,
      east: -113.9,
      north: 54.5,
      zoomMin: 7,
      zoomMax: 8,
    };

    expect(countTiles(emptyBounds)).toBe(0);
  });

  it('clamps the zoom band to the supported range', () => {
    const clamped: OfflineArea = { ...ALBERTA_BOX, zoomMin: 12, zoomMax: 20 };
    const expected: OfflineArea = { ...ALBERTA_BOX, zoomMin: 12, zoomMax: 14 };

    expect(countTiles(clamped)).toBe(countTiles(expected));
  });
});

describe('enumerateTiles', () => {
  it('lists the Alberta box tiles in zoom, x, then y order', () => {
    expect(enumerateTiles(ALBERTA_BOX)).toEqual([
      { z: 7, x: 23, y: 40 },
      { z: 8, x: 46, y: 81 },
      { z: 8, x: 47, y: 81 },
    ]);
  });

  it('lists as many tiles as countTiles counts', () => {
    expect(enumerateTiles(ALBERTA_BOX)).toHaveLength(countTiles(ALBERTA_BOX));
  });

  it('returns no tiles for inverted bounds', () => {
    const inverted: OfflineArea = { ...ALBERTA_BOX, west: -113.9, east: -114.1 };

    expect(enumerateTiles(inverted)).toEqual([]);
  });
});

describe('estimateBytes', () => {
  it('multiplies the tile count by the estimate per tile', () => {
    expect(estimateBytes(ALBERTA_BOX)).toBe(30000);
  });

  it('returns 0 bytes for an empty area', () => {
    const inverted: OfflineArea = { ...ALBERTA_BOX, west: -113.9, east: -114.1 };

    expect(estimateBytes(inverted)).toBe(0);
  });
});

describe('slippy tile conversion', () => {
  it('converts longitude to tile x', () => {
    // (-114.1 + 180) / 360 * 128 = 23.43, so the tile x is 23.
    expect(longitudeToTileX(-114.1, 7)).toBe(23);
    // (-113.9 + 180) / 360 * 256 = 47.00, so the tile x is 47.
    expect(longitudeToTileX(-113.9, 8)).toBe(47);
  });

  it('clamps latitude to the Web Mercator limit', () => {
    expect(latitudeToTileY(89, 5)).toBe(0);
    expect(latitudeToTileY(85.0511, 5)).toBe(0);
    expect(latitudeToTileY(-89, 5)).toBe(31);
    expect(latitudeToTileY(-85.0511, 5)).toBe(31);
  });

  it('counts the same tiles for a latitude past the limit and at the limit', () => {
    const pastLimit: OfflineArea = { ...ALBERTA_BOX, south: -89, north: 89 };
    const atLimit: OfflineArea = { ...ALBERTA_BOX, south: -85.0511, north: 85.0511 };

    expect(countTiles(pastLimit)).toBe(countTiles(atLimit));
  });
});

describe('mergeToDisjointRectangles', () => {
  it('passes a single rectangle through unchanged', () => {
    const rectangle: AreaRectangle = { west: -115.1, south: 52.0, east: -113.5, north: 53.5 };

    expect(mergeToDisjointRectangles([rectangle])).toEqual([rectangle]);
  });

  it('keeps two disjoint rectangles separate', () => {
    const first: AreaRectangle = { west: 0, south: 0, east: 1, north: 1 };
    const second: AreaRectangle = { west: 2, south: 2, east: 3, north: 3 };

    expect(mergeToDisjointRectangles([first, second])).toEqual([first, second]);
  });

  it('splits two overlapping rectangles into the exact union pieces', () => {
    const first: AreaRectangle = { west: 0, south: 0, east: 2, north: 2 };
    const second: AreaRectangle = { west: 1, south: 1, east: 3, north: 3 };

    expect(mergeToDisjointRectangles([first, second])).toEqual([
      { west: 0, south: 0, east: 2, north: 1 },
      { west: 0, south: 1, east: 3, north: 2 },
      { west: 1, south: 2, east: 3, north: 3 },
    ]);
  });

  it('drops a nested rectangle into its container', () => {
    const outer: AreaRectangle = { west: 0, south: 0, east: 4, north: 4 };
    const inner: AreaRectangle = { west: 1, south: 1, east: 2, north: 2 };

    expect(mergeToDisjointRectangles([outer, inner])).toEqual([outer]);
    expect(mergeToDisjointRectangles([inner, outer])).toEqual([outer]);
  });

  it('merges two rectangles that touch at an edge', () => {
    const first: AreaRectangle = { west: 0, south: 0, east: 1, north: 1 };
    const second: AreaRectangle = { west: 1, south: 0, east: 2, north: 1 };

    expect(mergeToDisjointRectangles([first, second])).toEqual([
      { west: 0, south: 0, east: 2, north: 1 },
    ]);
  });

  it('returns an empty array for an empty input', () => {
    expect(mergeToDisjointRectangles([])).toEqual([]);
  });

  it('drops a degenerate zero-width rectangle', () => {
    const rectangle: AreaRectangle = { west: 1, south: 0, east: 1, north: 1 };

    expect(mergeToDisjointRectangles([rectangle])).toEqual([]);
  });
});
