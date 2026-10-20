/**
 * Pure Web Mercator (slippy) tile math for offline area downloads.
 *
 * The functions in this file do no network or DOM work, so tests can check
 * tile counts before a download writes anything.
 */

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

export interface OfflineArea {
  west: number;
  south: number;
  east: number;
  north: number;
  zoomMin: number;
  zoomMax: number;
}

export const MAX_TILES_PER_DOWNLOAD = 4000;
export const ESTIMATED_BYTES_PER_TILE = 10000;
export const MIN_OFFLINE_ZOOM = 5;
export const MAX_OFFLINE_ZOOM = 14;

const MAX_MERCATOR_LATITUDE = 85.0511;

export function longitudeToTileX(longitude: number, zoom: number): number {
  return Math.floor(((longitude + 180) / 360) * Math.pow(2, zoom));
}

export function latitudeToTileY(latitude: number, zoom: number): number {
  const clamped = Math.min(MAX_MERCATOR_LATITUDE, Math.max(-MAX_MERCATOR_LATITUDE, latitude));
  const radians = (clamped * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * Math.pow(2, zoom));
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_OFFLINE_ZOOM, Math.max(MIN_OFFLINE_ZOOM, Math.floor(zoom)));
}

interface TileRange {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function tileRangeForZoom(area: OfflineArea, zoom: number): TileRange | null {
  const bounds = [area.west, area.south, area.east, area.north];
  if (bounds.some((value) => !Number.isFinite(value))) return null;
  if (area.west > area.east || area.south > area.north) return null;

  const xMin = longitudeToTileX(area.west, zoom);
  const xMax = longitudeToTileX(area.east, zoom);
  const yMin = latitudeToTileY(area.north, zoom);
  const yMax = latitudeToTileY(area.south, zoom);

  if (xMax < xMin || yMax < yMin) return null;
  return { xMin, xMax, yMin, yMax };
}

function zoomLevels(area: OfflineArea): number[] {
  const lowest = clampZoom(area.zoomMin);
  const highest = clampZoom(area.zoomMax);
  if (highest < lowest) return [];

  const levels: number[] = [];
  for (let zoom = lowest; zoom <= highest; zoom += 1) levels.push(zoom);
  return levels;
}

export function countTiles(area: OfflineArea): number {
  let count = 0;
  for (const zoom of zoomLevels(area)) {
    const range = tileRangeForZoom(area, zoom);
    if (!range) continue;
    count += (range.xMax - range.xMin + 1) * (range.yMax - range.yMin + 1);
  }
  return count;
}

export function enumerateTiles(area: OfflineArea): TileCoord[] {
  const tiles: TileCoord[] = [];
  for (const zoom of zoomLevels(area)) {
    const range = tileRangeForZoom(area, zoom);
    if (!range) continue;
    for (let x = range.xMin; x <= range.xMax; x += 1) {
      for (let y = range.yMin; y <= range.yMax; y += 1) {
        tiles.push({ z: zoom, x, y });
      }
    }
  }
  return tiles;
}

export function estimateBytes(area: OfflineArea): number {
  return countTiles(area) * ESTIMATED_BYTES_PER_TILE;
}

export interface AreaRectangle {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Dissolves rectangles into disjoint rectangles with the same union.
 *
 * Mask holes must not cross or nest, because MapLibre renders such rings in an
 * undefined way. The sorted edges of the inputs split the plane into cells, and
 * every cell is fully inside or fully outside every input, so a covered cell is
 * always safe to emit. The output runs from the bottom row to the top row, and
 * within a row from west to east.
 */
export function mergeToDisjointRectangles(rectangles: AreaRectangle[]): AreaRectangle[] {
  const usable = rectangles.filter(
    (rectangle) =>
      Number.isFinite(rectangle.west) &&
      Number.isFinite(rectangle.south) &&
      Number.isFinite(rectangle.east) &&
      Number.isFinite(rectangle.north) &&
      rectangle.west < rectangle.east &&
      rectangle.south < rectangle.north
  );
  if (usable.length === 0) return [];

  const xValues = [...new Set(usable.flatMap((rectangle) => [rectangle.west, rectangle.east]))].sort(
    (first, second) => first - second
  );
  const yValues = [
    ...new Set(usable.flatMap((rectangle) => [rectangle.south, rectangle.north])),
  ].sort((first, second) => first - second);

  const covered: boolean[][] = yValues.slice(0, -1).map((south, yIndex) =>
    xValues.slice(0, -1).map(
      (west, xIndex) =>
        usable.some(
          (rectangle) =>
            rectangle.west <= west &&
            xValues[xIndex + 1] <= rectangle.east &&
            rectangle.south <= south &&
            yValues[yIndex + 1] <= rectangle.north
        )
    )
  );

  interface OpenRun {
    xStart: number;
    xEnd: number;
    south: number;
  }

  const output: AreaRectangle[] = [];
  const openRuns = new Map<string, OpenRun>();

  for (let yIndex = 0; yIndex < covered.length; yIndex += 1) {
    const row = covered[yIndex];
    const runs: Array<[number, number]> = [];
    let runStart: number | null = null;
    for (let xIndex = 0; xIndex < row.length; xIndex += 1) {
      if (row[xIndex] && runStart === null) runStart = xIndex;
      if (!row[xIndex] && runStart !== null) {
        runs.push([runStart, xIndex - 1]);
        runStart = null;
      }
    }
    if (runStart !== null) runs.push([runStart, row.length - 1]);

    const rowKeys = new Set(runs.map(([start, end]) => `${start},${end}`));
    for (const [key, run] of openRuns) {
      if (rowKeys.has(key)) continue;
      output.push({
        west: xValues[run.xStart],
        south: run.south,
        east: xValues[run.xEnd + 1],
        north: yValues[yIndex],
      });
      openRuns.delete(key);
    }
    for (const [start, end] of runs) {
      const key = `${start},${end}`;
      if (!openRuns.has(key)) {
        openRuns.set(key, { xStart: start, xEnd: end, south: yValues[yIndex] });
      }
    }
  }

  for (const run of openRuns.values()) {
    output.push({
      west: xValues[run.xStart],
      south: run.south,
      east: xValues[run.xEnd + 1],
      north: yValues[yValues.length - 1],
    });
  }

  return output;
}
