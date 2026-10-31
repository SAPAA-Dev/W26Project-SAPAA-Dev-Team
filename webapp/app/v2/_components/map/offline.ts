import type { SavedRegion } from '@/lib/map/offline/tileCache';
import { mergeToDisjointRectangles } from '@/lib/map/offline/tileMath';
export { makeTransformRequest as makeOfflineTransform } from '@/components/map/offlineProtocol';

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
