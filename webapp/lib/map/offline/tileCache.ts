import pLimit from 'p-limit';

import { MAX_TILES_PER_DOWNLOAD, TileCoord, enumerateTiles, latitudeToTileY, longitudeToTileX, OfflineArea, countTiles } from '@/lib/map/offline/tileMath';

export const TILE_CACHE_NAME = 'protomaps-tiles-v1';
export const REGION_STORAGE_KEY = 'sapaa-offline-regions-v1';

const GLYPH_RANGES = ['0-255', '256-511', '8192-8447'];
const SPRITE_SUFFIXES = ['.json', '.png', '@2x.json', '@2x.png'];
const TILE_CONCURRENCY = 6;

export interface SavedRegion {
  id: string;
  bounds: { west: number; south: number; east: number; north: number };
  zoomMin: number;
  zoomMax: number;
  tileCount: number;
  savedAt: string;
}

export type DownloadPhase = 'style' | 'resources' | 'tiles' | 'done' | 'aborted';

export interface DownloadProgress {
  done: number;
  total: number;
  failed: number;
  phase: DownloadPhase;
}

export interface DownloadOptions {
  area: OfflineArea;
  styleUrl: string;
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
}

export interface DownloadResult {
  region: SavedRegion;
  failed: number;
}

export class DownloadAbortedError extends Error {}

// A cancel during a required fetch arrives as a plain AbortError, which the
// panel must not show as a failure, so it becomes a DownloadAbortedError here.
function translateAbort(signal: AbortSignal | undefined, error: unknown): unknown {
  if (signal?.aborted) {
    return new DownloadAbortedError('The download stopped before all tiles were saved.');
  }
  return error;
}

function isSavedRegion(value: unknown): value is SavedRegion {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const bounds = candidate.bounds as Record<string, unknown> | undefined;
  return (
    typeof candidate.id === 'string' &&
    typeof bounds === 'object' &&
    bounds !== null &&
    typeof bounds.west === 'number' &&
    typeof bounds.south === 'number' &&
    typeof bounds.east === 'number' &&
    typeof bounds.north === 'number' &&
    typeof candidate.zoomMin === 'number' &&
    typeof candidate.zoomMax === 'number' &&
    typeof candidate.tileCount === 'number' &&
    typeof candidate.savedAt === 'string'
  );
}

export function listRegions(): SavedRegion[] {
  if (typeof window === 'undefined') return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(window.localStorage.getItem(REGION_STORAGE_KEY) ?? '');
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isSavedRegion);
}

export function addRegion(region: SavedRegion): void {
  if (typeof window === 'undefined') return;
  const regions = listRegions();
  regions.push(region);
  window.localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(regions));
}

function writeRegions(regions: SavedRegion[]): void {
  window.localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(regions));
}

export async function openTileCache(): Promise<Cache | null> {
  if (typeof window === 'undefined' || typeof window.caches === 'undefined') return null;
  try {
    return await window.caches.open(TILE_CACHE_NAME);
  } catch {
    return null;
  }
}

export async function putUrl(url: string, response: Response): Promise<void> {
  const cache = await openTileCache();
  if (!cache) return;
  await cache.put(url, response);
}

export async function getCachedResponse(url: string): Promise<Response | null> {
  const cache = await openTileCache();
  if (!cache) return null;
  return (await cache.match(url)) ?? null;
}

function parseTileUrl(url: string): TileCoord | null {
  const match = url.match(/\/(\d{1,2})\/(\d{1,9})\/(\d{1,9})(?:\.[a-z0-9]+)?(?=$|[?#])/i);
  if (!match) return null;
  const z = Number(match[1]);
  const x = Number(match[2]);
  const y = Number(match[3]);
  if (z > 22 || x >= 2 ** z || y >= 2 ** z) return null;
  return { z, x, y };
}

function tileInRegion(coord: TileCoord, region: SavedRegion): boolean {
  if (coord.z < region.zoomMin || coord.z > region.zoomMax) return false;
  const bounds = region.bounds;
  const xMin = longitudeToTileX(bounds.west, coord.z);
  const xMax = longitudeToTileX(bounds.east, coord.z);
  const yMin = latitudeToTileY(bounds.north, coord.z);
  const yMax = latitudeToTileY(bounds.south, coord.z);
  return coord.x >= xMin && coord.x <= xMax && coord.y >= yMin && coord.y <= yMax;
}

// Counts the downloads that run now. A cache wipe must not run while a
// download stores tiles, because the wipe would delete what the download saves.
let activeDownloads = 0;

export async function removeRegion(id: string): Promise<void> {
  const regions = listRegions();
  const removed = regions.find((region) => region.id === id) || null;
  const remaining = regions.filter((region) => region.id !== id);
  if (typeof window !== 'undefined') writeRegions(remaining);

  if (!removed) return;

  if (remaining.length === 0) {
    await wipeTileCache();
    return;
  }

  // A running download writes tiles into any region, so deleting now could
  // remove tiles it is about to record. The tiles wait for the next delete.
  if (activeDownloads > 0) return;

  const cache = await openTileCache();
  if (!cache || typeof cache.keys !== 'function') return;

  const requests = await cache.keys();
  for (const request of requests) {
    const url = typeof request === 'string' ? request : request.url;
    const coord = parseTileUrl(url);
    if (!coord) continue;
    if (!tileInRegion(coord, removed)) continue;
    if (remaining.some((region) => tileInRegion(coord, region))) continue;
    await cache.delete(url);
  }
}

// A skipped wipe leaves the whole cache orphaned until the next delete of the
// last region. A queued wipe would instead delete the tiles of the running
// download, so the skip is the safer trade.
async function wipeTileCache(): Promise<void> {
  if (activeDownloads > 0) return;
  if (typeof window === 'undefined' || typeof window.caches === 'undefined') return;
  if (typeof window.caches.delete !== 'function') return;
  try {
    await window.caches.delete(TILE_CACHE_NAME);
  } catch {
    // The region record is already gone, so a failed wipe only leaves dead
    // entries behind. The caller still finishes its region-list update.
  }
}

interface VectorSource {
  type?: string;
  tiles?: unknown;
  url?: unknown;
}

interface StyleDocument {
  sources?: Record<string, VectorSource>;
  glyphs?: unknown;
  sprite?: unknown;
  layers?: { layout?: { 'text-font'?: unknown } }[];
}

function expandTileUrl(template: string, tile: TileCoord): string {
  return template
    .replace('{z}', String(tile.z))
    .replace('{x}', String(tile.x))
    .replace('{y}', String(tile.y));
}

async function cacheOptionalResource(url: string, signal: AbortSignal | undefined): Promise<boolean> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return false;
    await putUrl(url, response);
    return true;
  } catch {
    return false;
  }
}

async function resolveTileTemplate(style: StyleDocument, signal: AbortSignal | undefined): Promise<string> {
  const vectorSource = Object.values(style.sources ?? {}).find((source) => source.type === 'vector');
  if (!vectorSource) {
    throw new Error('The style document has no vector source, so no tile URL template was found.');
  }

  if (Array.isArray(vectorSource.tiles) && typeof vectorSource.tiles[0] === 'string') {
    return vectorSource.tiles[0];
  }

  if (typeof vectorSource.url === 'string') {
    let response: Response;
    try {
      response = await fetch(vectorSource.url, { signal });
    } catch (error) {
      throw translateAbort(signal, error);
    }
    if (!response.ok) {
      throw new Error(`The TileJSON request failed with status ${response.status}.`);
    }
    const tileJsonText = await response.text();
    await putUrl(vectorSource.url, new Response(tileJsonText, { headers: { 'content-type': 'application/json' } }));
    const tileJson: { tiles?: unknown } = JSON.parse(tileJsonText);
    if (Array.isArray(tileJson.tiles) && typeof tileJson.tiles[0] === 'string') {
      return tileJson.tiles[0];
    }
    throw new Error('The TileJSON document has no tiles array, so no tile URL template was found.');
  }

  throw new Error('The vector source has neither a tiles array nor a TileJSON URL.');
}

function collectFontStacks(style: StyleDocument): string[] {
  const fontStacks = new Set<string>();
  for (const layer of style.layers ?? []) {
    const textFont = layer.layout?.['text-font'];
    if (!Array.isArray(textFont)) continue;
    for (const font of textFont) {
      if (typeof font === 'string') fontStacks.add(font);
    }
  }
  return [...fontStacks];
}

export async function downloadArea(options: DownloadOptions): Promise<DownloadResult> {
  const { area, styleUrl, signal, onProgress } = options;

  const total = countTiles(area);
  if (total > MAX_TILES_PER_DOWNLOAD) {
    throw new RangeError(
      `The area has ${total} tiles, which is above the download cap of ${MAX_TILES_PER_DOWNLOAD} tiles.`
    );
  }
  // A record with zero tiles renders nothing offline, so a degenerate area is
  // refused instead of saved.
  if (total === 0) {
    throw new RangeError('The area holds no tiles, so no offline area was saved.');
  }

  activeDownloads += 1;
  try {
    let done = 0;
    let failed = 0;
    let failedTiles = 0;
    const report = (phase: DownloadPhase): void => onProgress?.({ done, total, failed, phase });

    const cache = await openTileCache();
    if (cache === null) {
      throw new Error('This browser has no offline tile storage, so the area cannot be saved.');
    }

    report('style');
    let styleResponse: Response;
    try {
      styleResponse = await fetch(styleUrl, { signal });
    } catch (error) {
      throw translateAbort(signal, error);
    }
    if (!styleResponse.ok) {
      throw new Error(`The style request failed with status ${styleResponse.status}.`);
    }
    const styleText = await styleResponse.text();
    await putUrl(styleUrl, new Response(styleText, { headers: { 'content-type': 'application/json' } }));
    const style: StyleDocument = JSON.parse(styleText);

    const tileTemplate = await resolveTileTemplate(style, signal);

    report('resources');
    const fontStacks = collectFontStacks(style);
    if (typeof style.glyphs === 'string' && style.glyphs !== '') {
      for (const fontStack of fontStacks) {
        for (const range of GLYPH_RANGES) {
          const url = style.glyphs
            .replace('{fontstack}', encodeURIComponent(fontStack))
            .replace('{range}', range);
          if (!(await cacheOptionalResource(url, signal))) failed += 1;
        }
      }
    }
    if (typeof style.sprite === 'string' && style.sprite !== '') {
      for (const suffix of SPRITE_SUFFIXES) {
        if (!(await cacheOptionalResource(style.sprite + suffix, signal))) failed += 1;
      }
    }

    const tiles = enumerateTiles(area);
    const limiter = pLimit(TILE_CONCURRENCY);
    await Promise.all(
      tiles.map((tile) =>
        limiter(async () => {
          if (signal?.aborted) return;
          const url = expandTileUrl(tileTemplate, tile);
          try {
            const response = await fetch(url, { signal });
            if (!response.ok) {
              failed += 1;
              failedTiles += 1;
            } else {
              await putUrl(url, response);
            }
          } catch {
            // An abort can reject the in-flight fetch; that is not a tile failure.
            if (!signal?.aborted) {
              failed += 1;
              failedTiles += 1;
            }
          }
          done += 1;
          report('tiles');
        })
      )
    );

    if (signal?.aborted) {
      report('aborted');
      throw new DownloadAbortedError('The download stopped before all tiles were saved.');
    }

    // A blank area is worse than no area, so a download that stored nothing fails.
    if (total > 0 && failedTiles === total) {
      throw new Error('The download stored no tiles, so no offline area was saved.');
    }

    const region: SavedRegion = {
      id: crypto.randomUUID(),
      bounds: { west: area.west, south: area.south, east: area.east, north: area.north },
      zoomMin: area.zoomMin,
      zoomMax: area.zoomMax,
      tileCount: total - failedTiles,
      savedAt: new Date().toISOString(),
    };
    addRegion(region);
    report('done');
    return { region, failed };
  } finally {
    activeDownloads -= 1;
  }
}
