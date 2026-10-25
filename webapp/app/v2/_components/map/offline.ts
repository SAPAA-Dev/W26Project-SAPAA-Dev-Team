import type { RequestTransformFunction } from 'maplibre-gl';
import type { SavedRegion } from '@/lib/map/offline/tileCache';
import { mergeToDisjointRectangles } from '@/lib/map/offline/tileMath';

// Offline maps: the tile cache, the downloader and the `sapaa-offline://` protocol belong to the offline-tiles
// feature (lib/map/offline, components/map/offlineProtocol) and are used here unchanged. The downloader works
// on any style; only the protocol's request rewrite is tied to Protomaps, so v2 (OpenFreeMap) has its own.

export const BASEMAP_ORIGIN = 'https://tiles.openfreemap.org/';
// The scheme components/map/offlineProtocol registers (not exported there). offline.test.ts keeps the two in step.
export const OFFLINE_PREFIX = 'sapaa-offline://';

/** While offline, send basemap requests (style, TileJSON, tiles, glyphs, sprites) to the saved copies. */
export function makeOfflineTransform(online: () => boolean): RequestTransformFunction {
  return (url) => {
    if (online() || !url.startsWith(BASEMAP_ORIGIN)) return undefined;
    return { url: `${OFFLINE_PREFIX}${url}` };
  };
}

type FeatureCollection = { type: 'FeatureCollection'; features: unknown[] };

const ring = (b: { west: number; south: number; east: number; north: number }) => [
  [b.west, b.south],
  [b.east, b.south],
  [b.east, b.north],
  [b.west, b.north],
  [b.west, b.south],
];

/** Dashed outlines of the saved areas. */
export function regionOutlines(regions: SavedRegion[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: regions.map((r) => ({
      type: 'Feature',
      properties: { id: r.id },
      geometry: { type: 'Polygon', coordinates: [ring(r.bounds)] },
    })),
  };
}

const WORLD = [
  [-180, -85.0511],
  [180, -85.0511],
  [180, 85.0511],
  [-180, 85.0511],
  [-180, -85.0511],
];

/** The whole world with the saved areas cut out, while offline; nothing while online or with nothing saved. */
export function offlineMask(regions: SavedRegion[], online: boolean): FeatureCollection {
  if (online || regions.length === 0) return { type: 'FeatureCollection', features: [] };
  // Holes must not cross or nest, so overlapping saves are merged first.
  const holes = mergeToDisjointRectangles(regions.map((r) => r.bounds));
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [WORLD, ...holes.map(ring)] } }],
  };
}
