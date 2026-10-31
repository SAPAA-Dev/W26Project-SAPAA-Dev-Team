import { DOMParser } from '@xmldom/xmldom';
import { strFromU8 } from 'fflate';

// A map read-back needs elevation and time, not only the count.
export interface GpxTrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: string | null;
}

export type GpxTrackErrorCode = 'not-gpx' | 'no-track-points';

export class GpxTrackError extends Error {
  readonly code: GpxTrackErrorCode;

  constructor(message: string, code: GpxTrackErrorCode) {
    super(message);
    this.name = 'GpxTrackError';
    this.code = code;
  }
}

export const NOT_GPX_MESSAGE = 'The file is not a valid GPX track.';
export const NO_TRACK_POINTS_MESSAGE = 'The GPX file has no track points.';

function readChildText(element: Element, tagName: string): string | null {
  const children = element.getElementsByTagName(tagName);
  if (children.length === 0) return null;
  const text = children[0].textContent?.trim();
  return text === undefined || text === '' ? null : text;
}

function readChildNumber(element: Element, tagName: string): number | null {
  const text = readChildText(element, tagName);
  if (text === null) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Waypoints (wpt) are not track points, so they do not count.
 */
export function parseGpxTrackFile(bytes: Uint8Array): GpxTrackPoint[] {
  return parseGpxTrackText(strFromU8(bytes));
}

export function parseGpxTrackText(gpxText: string): GpxTrackPoint[] {
  const fatalErrors: string[] = [];
  const parser = new DOMParser({
    errorHandler: (level: string, message: unknown) => {
      if (level === 'fatalError') fatalErrors.push(String(message));
    },
  });

  const document = parser.parseFromString(gpxText, 'text/xml');
  const root = document.documentElement;
  if (fatalErrors.length > 0 || root === null || root.nodeName.toLowerCase() !== 'gpx') {
    throw new GpxTrackError(NOT_GPX_MESSAGE, 'not-gpx');
  }

  const points: GpxTrackPoint[] = [];
  const trackPointElements = document.getElementsByTagName('trkpt');

  for (let index = 0; index < trackPointElements.length; index += 1) {
    const element = trackPointElements[index];
    // Number(null) is 0, so a missing attribute must fail before the cast.
    const latText = element.getAttribute('lat');
    const lonText = element.getAttribute('lon');
    if (latText === null || latText === '' || lonText === null || lonText === '') {
      throw new GpxTrackError(NOT_GPX_MESSAGE, 'not-gpx');
    }

    const lat = Number(latText);
    const lon = Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new GpxTrackError(NOT_GPX_MESSAGE, 'not-gpx');
    }

    points.push({
      lat,
      lon,
      ele: readChildNumber(element, 'ele'),
      time: readChildText(element, 'time'),
    });
  }

  if (points.length === 0) {
    throw new GpxTrackError(NO_TRACK_POINTS_MESSAGE, 'no-track-points');
  }

  return points;
}

export interface GpxTrackForMap {
  id: number;
  originalFileName: string;
  points: GpxTrackPoint[];
}

// A saved track never changes, so a parsed track is reused until the server restarts.
// ponytail: per-instance memo, move to a shared cache if the sites page is still slow.
// This lives here, not in utils/supabase/queries.ts: that file is 'use server' and may export only async functions.
export const MAP_TRACK_CACHE_LIMIT = 200;
const MAP_TRACK_MAX_POINTS = 2000;
export const mapTrackCache = new Map<string, GpxTrackPoint[]>();

export function clearGpxMapTrackCache(): void {
  mapTrackCache.clear();
}

// The map draws a line, so a long track keeps evenly spaced points, first and last included.
export function thinMapTrack(points: GpxTrackPoint[]): GpxTrackPoint[] {
  if (points.length <= MAP_TRACK_MAX_POINTS) return points;
  const step = (points.length - 1) / (MAP_TRACK_MAX_POINTS - 1);
  return Array.from({ length: MAP_TRACK_MAX_POINTS }, (_, index) => points[Math.round(index * step)]);
}

export interface GpxTrackLineFeature {
  type: 'Feature';
  properties: {
    trackId: number;
    fileName: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

export interface GpxTrackLineFeatureCollection {
  type: 'FeatureCollection';
  features: GpxTrackLineFeature[];
}

/**
 * One LineString per track, so the map draws each uploaded file as its own line.
 * A line needs two positions, so a track with one point is dropped, not drawn.
 */
export function gpxTracksToLineFeatureCollection(
  tracks: ReadonlyArray<GpxTrackForMap>
): GpxTrackLineFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: tracks
      .filter((track) => track.points.length >= 2)
      .map((track) => ({
        type: 'Feature' as const,
        properties: {
          trackId: track.id,
          fileName: track.originalFileName,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: track.points.map((point) => [point.lon, point.lat]),
        },
      })),
  };
}
