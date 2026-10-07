import { DOMParser } from '@xmldom/xmldom';
import { strFromU8, unzipSync } from 'fflate';
import toGeoJSON from '@mapbox/togeojson';
import type { GeoJsonFeature, GeoJsonGeometry } from '@mapbox/togeojson';

// The protected_areas geometry column only accepts this shape, so every record carries it.
export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface ProtectedAreaRecord {
  folder: string;
  fid: number;
  name: string;
  area_type: string;
  subtype: string | null;
  status: string | null;
  source: string | null;
  iucn: string | null;
  oc_no: string | null;
  oc_name: string | null;
  acres: number | null;
  hectares: number | null;
  area_ha: number | null;
  oc_date: string | null;
  date_est: string | null;
  date_res: string | null;
  notes: string | null;
  geometry: GeoJsonMultiPolygon;
}

export interface KmlImportStats {
  placemarks: number;
  inserted: number;
  skipped: number;
  folders: number;
}

export interface KmlImportResult {
  records: ProtectedAreaRecord[];
  warnings: string[];
  stats: KmlImportStats;
}

export type KmlImportErrorCode = 'not-kml' | 'no-placemarks' | 'bad-zip' | 'too-large' | 'mismatch';

export class KmlImportError extends Error {
  readonly code: KmlImportErrorCode;

  constructor(message: string, code: KmlImportErrorCode) {
    super(message);
    this.name = 'KmlImportError';
    this.code = code;
  }
}

// FID restarts inside every folder, so a placemark without one gets this value.
// It cannot collide because every FID in the export is 0 or higher.
export const NO_FID = -1;

const ZIP_MAGIC_FIRST_BYTE = 0x50; // 'P'
const ZIP_MAGIC_SECOND_BYTE = 0x4b; // 'K'
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;

// The description is a CDATA block whose lines look like "   FID   12    ".
// Only these keys are read. A line whose first word is something else is the
// placemark name or a stray link, and is ignored.
const DESCRIPTION_KEYS = new Set([
  'FID',
  'PASITES_ID',
  'NAME',
  'TYPE',
  'SUBTYPE',
  'STATUS',
  'SOURCE',
  'IUCN',
  'OC_NO',
  'OC_NAME',
  'ACRES',
  'HECTARES',
  'AREA_HA',
  'OC_DATE',
  'DATE_EST',
  'DATE_RES',
  'NOTES',
]);

function toText(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function toNumber(
  value: string | undefined,
  field: string,
  label: string,
  warnings: string[]
): number | null {
  const text = toText(value);
  if (text === null) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    warnings.push(`${label}: the ${field} value "${text}" is not a number, so that column stays empty.`);
    return null;
  }

  return parsed;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(month: number, year: number): number {
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  if (month === 2 && isLeapYear) return 29;
  return DAYS_IN_MONTH[month - 1];
}

// The export writes M/D/YYYY. new Date() would read that in the host time zone and
// can move the day, so the parts are split by hand.
function toIsoDate(value: string | undefined): string | null {
  const text = toText(value);
  if (text === null) return null;

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match === null) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(month, year)) return null;

  return `${match[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Reads the key/value lines of a placemark description. togeojson gives the CDATA
 * body as plain text, so the <br> separators are still literal characters.
 */
function parseDescription(raw: string | null): Record<string, string> {
  const fields: Record<string, string> = {};
  if (raw === null) return fields;

  // <br> becomes a line break. Any other tag is dropped, which also turns the
  // literal "<Null>" that the export writes into an empty value.
  const lines = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ').split('\n');

  for (const line of lines) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)(?:\s+([\s\S]*))?$/.exec(line.trim());
    if (match === null) continue;
    if (!DESCRIPTION_KEYS.has(match[1])) continue;
    fields[match[1]] = (match[2] ?? '').trim();
  }

  return fields;
}

function toFid(raw: string | undefined, label: string, warnings: string[]): number {
  const text = toText(raw);
  if (text === null) {
    warnings.push(`${label}: the description has no FID, so the row uses ${NO_FID}.`);
    return NO_FID;
  }

  const parsed = Number(text);
  if (!Number.isInteger(parsed)) {
    warnings.push(`${label}: the FID "${text}" is not a whole number, so the row uses ${NO_FID}.`);
    return NO_FID;
  }

  return parsed;
}

function reduceToTwoDimensions(ring: number[][]): number[][] {
  return ring.map((position) => [position[0], position[1]]);
}

/**
 * The database accepts MultiPolygon only. togeojson gives a Polygon for a single
 * polygon, a MultiPolygon for several, and a GeometryCollection when a placemark
 * mixes types, which happens twice in the SAPAA-Map export.
 */
function toMultiPolygon(
  geometry: GeoJsonGeometry | null,
  label: string,
  warnings: string[]
): GeoJsonMultiPolygon | null {
  const polygons: number[][][][] = [];

  const collect = (current: GeoJsonGeometry): void => {
    switch (current.type) {
      case 'Polygon':
        polygons.push(current.coordinates.map(reduceToTwoDimensions));
        return;
      case 'MultiPolygon':
        for (const polygon of current.coordinates) {
          polygons.push(polygon.map(reduceToTwoDimensions));
        }
        return;
      case 'GeometryCollection':
        for (const member of current.geometries) collect(member);
        return;
      default:
        warnings.push(`${label}: ignored a ${current.type} geometry and kept the polygons only.`);
    }
  };

  if (geometry === null) return null;
  collect(geometry);
  if (polygons.length === 0) return null;

  return { type: 'MultiPolygon', coordinates: polygons };
}

// togeojson makes no feature for a placemark that holds none of these, which would
// push the feature list out of step with the element list and give a record the
// folder of a different placemark.
const KML_GEOMETRY_TAGS = ['Polygon', 'LineString', 'Point', 'Track', 'gx:Track'];

function holdsGeometry(placemark: Element): boolean {
  return KML_GEOMETRY_TAGS.some((tag) => placemark.getElementsByTagName(tag).length > 0);
}

// togeojson drops the folder, so the name comes from the nearest Folder ancestor.
function readFolderName(placemark: Element): string {
  let node: Node | null = placemark.parentNode;

  while (node !== null && node.nodeType === 1) {
    const element = node as Element;
    if (element.nodeName.toLowerCase() === 'folder') {
      const nameElement = Array.from(element.childNodes).find(
        (child) => child.nodeType === 1 && child.nodeName === 'name'
      );
      const folderName = nameElement?.textContent?.trim();
      if (folderName !== undefined && folderName !== '') return folderName;
    }
    node = node.parentNode;
  }

  return '';
}

// The KMZ specification names the entry doc.kml. Some writers use another name,
// so any .kml entry is accepted. An archive without one is not a usable export.
function chooseKmlEntry(entries: Record<string, Uint8Array>): string | null {
  const names = Object.keys(entries);

  const documentEntry = names.find((name) => name.toLowerCase() === 'doc.kml');
  if (documentEntry !== undefined) return documentEntry;

  return names.find((name) => name.toLowerCase().endsWith('.kml')) ?? null;
}

function parseKmz(bytes: Uint8Array): KmlImportResult {
  let kmlEntryIsTooLarge = false;
  let acceptedBytes = 0;
  let entries: Record<string, Uint8Array>;

  try {
    // Only KML entries are opened, and only while the declared uncompressed total
    // stays inside the cap. Checking after unzipSync would be too late: the archive
    // would already have expanded in memory, which is how a small .kmz can exhaust
    // the server.
    entries = unzipSync(bytes, {
      filter: (file) => {
        if (!file.name.toLowerCase().endsWith('.kml')) return false;
        if (file.originalSize > MAX_ENTRY_BYTES) {
          kmlEntryIsTooLarge = true;
          return false;
        }
        // An entry dropped here is an entry the archive claimed this app could not
        // hold, so the file is refused rather than read from a different entry.
        if (acceptedBytes + file.originalSize > MAX_ENTRY_BYTES) {
          kmlEntryIsTooLarge = true;
          return false;
        }
        acceptedBytes += file.originalSize;
        return true;
      },
    });
  } catch {
    throw new KmlImportError('The .kmz archive could not be read.', 'bad-zip');
  }

  if (kmlEntryIsTooLarge) {
    throw new KmlImportError('The KML inside the .kmz archive is too large.', 'too-large');
  }

  const chosen = chooseKmlEntry(entries);
  if (chosen === null) {
    throw new KmlImportError('The .kmz archive holds no KML file.', 'bad-zip');
  }

  return parseProtectedAreaKmlText(strFromU8(entries[chosen]));
}

/**
 * Reads a .kml or .kmz export into protected area records.
 * The file type comes from the ZIP magic bytes, not from the file name, so a
 * mislabelled file still reads correctly.
 */
export function parseProtectedAreaFile(bytes: Uint8Array): KmlImportResult {
  if (bytes.length >= 2 && bytes[0] === ZIP_MAGIC_FIRST_BYTE && bytes[1] === ZIP_MAGIC_SECOND_BYTE) {
    return parseKmz(bytes);
  }

  return parseProtectedAreaKmlText(strFromU8(bytes));
}

export function parseProtectedAreaKmlText(kmlText: string): KmlImportResult {
  const fatalErrors: string[] = [];
  const parser = new DOMParser({
    errorHandler: (level: string, message: unknown) => {
      if (level === 'fatalError') fatalErrors.push(String(message));
    },
  });

  const document = parser.parseFromString(kmlText, 'text/xml');
  const root = document.documentElement;
  if (fatalErrors.length > 0 || root === null || root.nodeName.toLowerCase() !== 'kml') {
    throw new KmlImportError('The file is not a KML document.', 'not-kml');
  }

  const featureCollection = toGeoJSON.kml(document);
  const placemarkElements = Array.from(document.getElementsByTagName('Placemark')).filter(holdsGeometry);

  const warnings: string[] = [];
  const records: ProtectedAreaRecord[] = [];
  const folders = new Set<string>();
  const seenKeys = new Set<string>();
  let skipped = 0;

  const readFeature = (feature: GeoJsonFeature, index: number): void => {
    // The counts are checked before this runs, so the element is always present.
    const folderName = readFolderName(placemarkElements[index]);
    const folder = folderName === '' ? 'Unknown' : folderName;

    const fields = parseDescription(
      typeof feature.properties.description === 'string' ? feature.properties.description : null
    );
    const nameFromElement = typeof feature.properties.name === 'string' ? feature.properties.name : null;
    const name = toText(fields.NAME) ?? toText(nameFromElement ?? undefined);
    const label = name === null ? `Placemark ${index + 1}` : `"${name}"`;

    if (name === null) {
      skipped += 1;
      warnings.push(`Skipped ${label}: it has no name.`);
      return;
    }

    const geometry = toMultiPolygon(feature.geometry, label, warnings);
    if (geometry === null) {
      skipped += 1;
      warnings.push(`Skipped ${label}: it has no polygon geometry.`);
      return;
    }

    const fid = toFid(fields.FID, label, warnings);
    const key = `${folder}\u0000${fid}`;
    if (seenKeys.has(key)) {
      skipped += 1;
      warnings.push(`Skipped ${label}: folder "${folder}" already has FID ${fid}.`);
      return;
    }
    seenKeys.add(key);
    folders.add(folder);

    records.push({
      folder,
      fid,
      name,
      area_type: toText(fields.TYPE) ?? folder,
      subtype: toText(fields.SUBTYPE),
      status: toText(fields.STATUS),
      source: toText(fields.SOURCE),
      iucn: toText(fields.IUCN),
      oc_no: toText(fields.OC_NO),
      oc_name: toText(fields.OC_NAME),
      acres: toNumber(fields.ACRES, 'ACRES', label, warnings),
      hectares: toNumber(fields.HECTARES, 'HECTARES', label, warnings),
      area_ha: toNumber(fields.AREA_HA, 'AREA_HA', label, warnings),
      oc_date: toIsoDate(fields.OC_DATE),
      date_est: toIsoDate(fields.DATE_EST),
      date_res: toIsoDate(fields.DATE_RES),
      notes: toText(fields.NOTES),
      geometry,
    });
  };

  if (placemarkElements.length === 0) {
    throw new KmlImportError('The KML file has no Placemark elements.', 'no-placemarks');
  }
  // A placemark reaches a record only through the element at its index, so the two
  // lists must agree. A mismatch would file records under the wrong folder, and the
  // folder is half of the row identity.
  if (featureCollection.features.length !== placemarkElements.length) {
    throw new KmlImportError(
      `The file has ${placemarkElements.length} placemarks that hold geometry, but ${featureCollection.features.length} could be read.`,
      'mismatch'
    );
  }

  featureCollection.features.forEach(readFeature);

  return {
    records,
    warnings,
    stats: {
      placemarks: placemarkElements.length,
      inserted: records.length,
      skipped,
      folders: folders.size,
    },
  };
}
