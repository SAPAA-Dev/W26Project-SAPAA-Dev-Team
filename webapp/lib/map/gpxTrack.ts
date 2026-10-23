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
