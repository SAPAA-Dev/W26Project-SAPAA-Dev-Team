/**
 * Boundary helpers for the sites map.
 *
 * The rows come from public.protected_areas. The geometry column is jsonb that holds
 * a GeoJSON MultiPolygon. PostGIS is not enabled on the project, so every transform
 * happens here in JavaScript.
 *
 * The functions in this file are pure. They hold no React and no database code, so
 * they are cheap to test and safe to import from a client component.
 */

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface ProtectedAreaBoundaryRow {
  id: number;
  name: string;
  fid: number;
  area_type: string;
  subtype: string | null;
  iucn: string | null;
  oc_no: string | null;
  acres: number | null;
  hectares: number | null;
  oc_date: string | null;
  date_est: string | null;
  oc_name: string | null;
  notes: string | null;
  geometry: GeoJsonMultiPolygon;
  // Null when no sites_pa row points at this protected area, or the site has no county.
  county?: string | null;
  // Null when no sites_pa row points at this protected area.
  is_active?: boolean | null;
}

export interface BoundaryProperties {
  name: string;
  fid: number;
  area_type: string;
  subtype: string | null;
  iucn: string | null;
  oc_no: string | null;
  acres: number | null;
  hectares: number | null;
  oc_date: string | null;
  date_est: string | null;
  oc_name: string | null;
  notes: string | null;
  county: string | null;
  is_active: boolean | null;
}

export interface BoundaryFeature {
  type: 'Feature';
  id: number;
  properties: BoundaryProperties;
  geometry: GeoJsonMultiPolygon;
}

export interface BoundaryFeatureCollection {
  type: 'FeatureCollection';
  features: BoundaryFeature[];
}

export const DEFAULT_COORDINATE_DECIMALS = 5;

/**
 * The simplifier works in degrees. At the latitude of Alberta 0.0001 degrees is about
 * 11 m from north to south and about 6 m from east to west, because a degree of
 * longitude is shorter away from the equator. Both are smaller than one pixel at every
 * zoom level the map allows.
 */
export const DEFAULT_SIMPLIFY_TOLERANCE_DEGREES = 0.0001;

// A GeoJSON linear ring needs 4 positions: 3 corners and a repeat of the first.
const MIN_RING_POSITIONS = 4;

function roundTo(value: number, factor: number): number {
  return Math.round(value * factor) / factor;
}

/**
 * Rounds every coordinate and drops the third value.
 *
 * The export writes elevation as 0 on every position. The map is two dimensional, so
 * the value is removed rather than rounded.
 */
export function roundCoordinates(
  geometry: GeoJsonMultiPolygon,
  decimals: number = DEFAULT_COORDINATE_DECIMALS
): GeoJsonMultiPolygon {
  const factor = 10 ** decimals;

  return {
    type: 'MultiPolygon',
    coordinates: geometry.coordinates.map((polygon) =>
      polygon.map((ring) =>
        ring.map((position) => [roundTo(position[0], factor), roundTo(position[1], factor)])
      )
    ),
  };
}

/**
 * The squared distance from a point to a line segment. The square root is left out
 * because the caller only compares distances with one another.
 */
function squaredSegmentDistance(point: number[], start: number[], end: number[]): number {
  let nearestX = start[0];
  let nearestY = start[1];
  let deltaX = end[0] - nearestX;
  let deltaY = end[1] - nearestY;

  if (deltaX !== 0 || deltaY !== 0) {
    const ratio =
      ((point[0] - nearestX) * deltaX + (point[1] - nearestY) * deltaY) /
      (deltaX * deltaX + deltaY * deltaY);

    if (ratio > 1) {
      nearestX = end[0];
      nearestY = end[1];
    } else if (ratio > 0) {
      nearestX += deltaX * ratio;
      nearestY += deltaY * ratio;
    }
  }

  deltaX = point[0] - nearestX;
  deltaY = point[1] - nearestY;
  return deltaX * deltaX + deltaY * deltaY;
}

/**
 * Douglas-Peucker. The first and the last position always survive, so a closed ring
 * stays closed.
 *
 * The section list is an explicit array, not recursion. A long ring can hold several
 * thousand positions, and the worst case would nest that many calls.
 */
function simplifyPositions(positions: number[][], tolerance: number): number[][] {
  const squaredTolerance = tolerance * tolerance;
  const lastIndex = positions.length - 1;
  const kept = new Uint8Array(positions.length);
  kept[0] = 1;
  kept[lastIndex] = 1;

  const sections: Array<[number, number]> = [[0, lastIndex]];

  while (sections.length > 0) {
    const section = sections.pop();
    if (section === undefined) break;

    const [first, last] = section;
    let greatestSquaredDistance = squaredTolerance;
    let farthest = -1;

    for (let index = first + 1; index < last; index += 1) {
      const squaredDistance = squaredSegmentDistance(positions[index], positions[first], positions[last]);
      if (squaredDistance > greatestSquaredDistance) {
        farthest = index;
        greatestSquaredDistance = squaredDistance;
      }
    }

    if (farthest === -1) continue;

    kept[farthest] = 1;
    sections.push([first, farthest], [farthest, last]);
  }

  return positions.filter((_position, index) => kept[index] === 1);
}

function isSamePosition(first: number[], second: number[]): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

/**
 * Simplifies one linear ring.
 *
 * The function returns null when the ring cannot survive as a polygon. The caller
 * drops that ring instead of writing an invalid one.
 */
export function simplifyRing(ring: number[][], tolerance: number): number[][] | null {
  if (ring.length < MIN_RING_POSITIONS) return null;

  // GeoJSON repeats the first position at the end of a ring. The import usually keeps
  // that repeat, but not always, so close the ring before the simplifier reads it.
  const closed = isSamePosition(ring[0], ring[ring.length - 1]) ? ring : [...ring, ring[0]];

  const simplified = simplifyPositions(closed, tolerance);

  // The two ends always survive, so the result is still closed. A small ring can
  // still flatten to a line, and a line is not a polygon.
  if (simplified.length < MIN_RING_POSITIONS) return null;

  return simplified;
}

/**
 * Simplifies every ring of every polygon. Returns null when no polygon survives.
 */
export function simplifyMultiPolygon(
  geometry: GeoJsonMultiPolygon,
  tolerance: number = DEFAULT_SIMPLIFY_TOLERANCE_DEGREES
): GeoJsonMultiPolygon | null {
  const polygons: number[][][][] = [];

  for (const polygon of geometry.coordinates) {
    // The first ring is the outer boundary and the rest are holes. A hole is kept
    // only while its outer ring survives.
    const outer = simplifyRing(polygon[0] ?? [], tolerance);
    if (outer === null) continue;

    const holes: number[][][] = [];
    for (const hole of polygon.slice(1)) {
      const simplifiedHole = simplifyRing(hole, tolerance);
      if (simplifiedHole !== null) holes.push(simplifiedHole);
    }

    polygons.push([outer, ...holes]);
  }

  if (polygons.length === 0) return null;

  return { type: 'MultiPolygon', coordinates: polygons };
}

/**
 * Turns table rows into the FeatureCollection that MapLibre reads.
 *
 * A boundary that collapses at this tolerance is left out. The map then draws one
 * shape fewer instead of a shape with no area.
 */
export function toBoundaryFeatureCollection(
  rows: ProtectedAreaBoundaryRow[],
  tolerance: number = DEFAULT_SIMPLIFY_TOLERANCE_DEGREES
): BoundaryFeatureCollection {
  const features: BoundaryFeature[] = [];

  for (const row of rows) {
    const geometry = simplifyMultiPolygon(roundCoordinates(row.geometry), tolerance);
    if (geometry === null) continue;

    features.push({
      type: 'Feature',
      id: row.id,
      properties: {
        name: row.name,
        fid: row.fid,
        area_type: row.area_type,
        subtype: row.subtype,
        iucn: row.iucn,
        oc_no: row.oc_no,
        acres: row.acres,
        hectares: row.hectares,
        oc_date: row.oc_date,
        date_est: row.date_est,
        oc_name: row.oc_name,
        notes: row.notes,
        county: row.county ?? null,
        is_active: row.is_active ?? null,
      },
      geometry,
    });
  }

  return { type: 'FeatureCollection', features };
}
