// Minimal GeoJSON TypeScript interfaces for boundaries (MultiPolygon) and label points (Point).
export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: number[];
}

// Exact TypeScript object structure returned for every parsed record
export interface ProtectedAreaRecord {
  objectid: number;
  pasites_id: number | null;
  name: string;
  short_name: string | null;
  oc_name: string | null;
  area_type: string;
  subtype: string | null;
  status: string | null;
  source: string | null;
  iucn: string | null;
  oc_no: string | null;
  acres: number | null;
  hectares: number | null;
  oc_date: string | null;
  date_est: string | null;
  notes: string | null;
  global_id: string;
  shape_area: number | null;
  shape_length: number | null;
  geometry: GeoJsonMultiPolygon;
  label_point: GeoJsonPoint | null;
}


/**
 * An intermediate internal interface used while reading individual <Placemark> XML blocks before 
 * they get assembled into the final ProtectedAreaRecord.
 */
interface ParsedPlacemark {
  name: string;
  attributes: Record<string, string>;
  polygons: number[][][][];
  labelPoint: GeoJsonPoint | null;
}

const SIMPLE_DATA_OPEN = '<SimpleData name="';

/**
 * CDATA holds literal text, so the wrapper comes off and the text stays.
 */
function unwrapCdata(xml: string): string {
  return xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

//Replaces standard XML-encoded entities back into readable text strings
function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * readElementBlock finds and extracts raw XML content enclosed between <tag> and </tag>. 
 * readElementText runs that raw content through decodeXmlEntities to return clean text.
 */
function readElementBlock(block: string, tag: string): string | null {
  const open = `<${tag}>`;
  const start = block.indexOf(open);
  if (start === -1) return null;

  const end = block.indexOf(`</${tag}>`, start + open.length);
  if (end === -1) return null;

  return block.slice(start + open.length, end);
}

function readElementText(block: string, tag: string): string | null {
  const inner = readElementBlock(block, tag);
  return inner === null ? null : decodeXmlEntities(inner);
}

//casts extracted string attributes into strict runtime types
function toText(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function toNumber(value: string | null): number | null {
  const text = toText(value);
  if (text === null) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value: string | null): number | null {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function toDate(value: string | null): string | null {
  const text = toText(value);
  if (text === null) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}


//Takes space-delimited KML coordinate streams and converts them into [longitude, latitude] numeric tuples
function parseCoordinateList(raw: string): number[][] {
  const positions: number[][] = [];

  for (const token of raw.trim().split(/\s+/)) {
    if (token === '') continue;

    const parts = token.split(',');
    const longitude = Number(parts[0]);
    const latitude = Number(parts[1]);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new Error(`Invalid KML coordinate pair: ${token}`);
    }

    positions.push([longitude, latitude]);
  }

  if (positions.length === 0) {
    throw new Error('A KML LinearRing has no coordinates.');
  }

  return positions;
}

/**
 * Scans inside a <Polygon> block for outer (<outerBoundaryIs>) or inner hole (<innerBoundaryIs>) tags, 
 * parsing each coordinate set into linear rings.
 */
function readBoundaryRings(polygonBlock: string, boundaryTag: string): number[][][] {
  const rings: number[][][] = [];
  const open = `<${boundaryTag}>`;

  let cursor = polygonBlock.indexOf(open);
  while (cursor !== -1) {
    const close = polygonBlock.indexOf(`</${boundaryTag}>`, cursor);
    if (close === -1) break;

    const segment = polygonBlock.slice(cursor, close);
    const coordinates = readElementText(segment, 'coordinates');
    if (coordinates !== null) rings.push(parseCoordinateList(coordinates));

    cursor = polygonBlock.indexOf(open, close);
  }

  return rings;
}

/**
 * readPolygonBlocks extracts all <Polygon>...</Polygon> raw XML strings in a placemark. 
 * parsePolygon processes a single polygon by placing its outer boundary ring first, followed 
 * by any inner hole rings (the GeoJSON ring convention)
 */
function readPolygonBlocks(body: string): string[] {
  const blocks: string[] = [];

  let cursor = body.indexOf('<Polygon>');
  while (cursor !== -1) {
    const close = body.indexOf('</Polygon>', cursor);
    if (close === -1) break;

    blocks.push(body.slice(cursor, close));
    cursor = body.indexOf('<Polygon>', close);
  }

  return blocks;
}

function parsePolygon(polygonBlock: string): number[][][] {
  const outerRings = readBoundaryRings(polygonBlock, 'outerBoundaryIs');
  if (outerRings.length !== 1) {
    throw new Error('A KML Polygon must have exactly one outerBoundaryIs ring.');
  }

  return [outerRings[0], ...readBoundaryRings(polygonBlock, 'innerBoundaryIs')];
}

//Parses KML ExtendedData fields (<SimpleData name="FIELD">value</SimpleData>) into a key-value dictionary Record<string, string>.
function readAttributes(body: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  let cursor = body.indexOf(SIMPLE_DATA_OPEN);
  while (cursor !== -1) {
    const nameStart = cursor + SIMPLE_DATA_OPEN.length;
    const nameEnd = body.indexOf('"', nameStart);
    if (nameEnd === -1) break;

    const valueStart = body.indexOf('>', nameEnd) + 1;
    const valueEnd = body.indexOf('</SimpleData>', valueStart);
    if (valueStart === 0 || valueEnd === -1) break;

    attributes[body.slice(nameStart, nameEnd)] = decodeXmlEntities(
      body.slice(valueStart, valueEnd)
    );
    cursor = body.indexOf(SIMPLE_DATA_OPEN, valueEnd);
  }

  return attributes;
}

//Extracts a single point geometry (Point) if present inside a placemark.
function readLabelPoint(body: string): GeoJsonPoint | null {
  const pointBlock = readElementBlock(body, 'Point');
  if (pointBlock === null) return null;

  const coordinates = readElementText(pointBlock, 'coordinates');
  if (coordinates === null) return null;

  const positions = parseCoordinateList(coordinates);
  return { type: 'Point', coordinates: positions[0] };
}

//Assembles names, attributes, polygons, and point data for one placemark.
function parsePlacemark(body: string): ParsedPlacemark {
  const name = toText(readElementText(body, 'name'));
  if (name === null) {
    throw new Error('A KML Placemark has no name.');
  }

  return {
    name,
    attributes: readAttributes(body),
    polygons: readPolygonBlocks(body).map(parsePolygon),
    labelPoint: readLabelPoint(body),
  };
}

//Loops through the entire XML string to extract all <Placemark> elements.
function parsePlacemarks(xml: string): ParsedPlacemark[] {
  const documentBody = unwrapCdata(xml);
  const placemarks: ParsedPlacemark[] = [];

  let cursor = documentBody.indexOf('<Placemark');
  while (cursor !== -1) {
    const openEnd = documentBody.indexOf('>', cursor);
    if (openEnd === -1) break;

    const close = documentBody.indexOf('</Placemark>', openEnd);
    if (close === -1) break;

    placemarks.push(parsePlacemark(documentBody.slice(openEnd + 1, close)));
    cursor = documentBody.indexOf('<Placemark', close);
  }

  return placemarks;
}

/**
 * Utility guards that throw runtime errors immediately if crucial fields
 * (TYPE, GlobalID, or OBJECTID) are missing or improperly formatted. 
 */
function requireAttribute(attributes: Record<string, string>, key: string): string {
  const value = toText(attributes[key] ?? null);
  if (value === null) {
    throw new Error(`A KML Placemark has no ${key} field.`);
  }
  return value;
}

function requireObjectId(attributes: Record<string, string>): number {
  const value = toInteger(attributes['OBJECTID'] ?? null);
  if (value === null) {
    throw new Error('A KML Placemark has no numeric OBJECTID field.');
  }
  return value;
}

/**
 * Reads the Parks Protected Areas export. The outline file holds the polygons.
 * The optional labels file holds one Point for each area, matched on OBJECTID.
 */
export function parseProtectedAreaKml(
  outlineKml: string,
  labelsKml?: string
): ProtectedAreaRecord[] {
  const outlinePlacemarks = parsePlacemarks(outlineKml);
  if (outlinePlacemarks.length === 0) {
    throw new Error('The outline KML file has no Placemark elements.');
  }

  const labelPointsByObjectId = new Map<number, GeoJsonPoint>();
  if (labelsKml !== undefined) {
    for (const placemark of parsePlacemarks(labelsKml)) {
      if (placemark.labelPoint === null) continue;
      labelPointsByObjectId.set(requireObjectId(placemark.attributes), placemark.labelPoint);
    }
  }

  const seenObjectIds = new Set<number>();
  const records: ProtectedAreaRecord[] = [];

  for (const placemark of outlinePlacemarks) {
    if (placemark.polygons.length === 0) {
      throw new Error(`The placemark "${placemark.name}" has no Polygon geometry.`);
    }

    const objectId = requireObjectId(placemark.attributes);
    if (seenObjectIds.has(objectId)) {
      throw new Error(`The outline KML has two placemarks with OBJECTID ${objectId}.`);
    }
    seenObjectIds.add(objectId);

    const attributes = placemark.attributes;
    records.push({
      objectid: objectId,
      pasites_id: toInteger(attributes['PASITES_ID'] ?? null),
      name: placemark.name,
      short_name: toText(attributes['NAME'] ?? null),
      oc_name: toText(attributes['OC_NAME'] ?? null),
      area_type: requireAttribute(attributes, 'TYPE'),
      subtype: toText(attributes['SUBTYPE'] ?? null),
      status: toText(attributes['STATUS'] ?? null),
      source: toText(attributes['SOURCE'] ?? null),
      iucn: toText(attributes['IUCN'] ?? null),
      oc_no: toText(attributes['OC_NO'] ?? null),
      acres: toNumber(attributes['ACRES'] ?? null),
      hectares: toNumber(attributes['HECTARES'] ?? null),
      oc_date: toDate(attributes['OC_DATE'] ?? null),
      date_est: toDate(attributes['DATE_EST'] ?? null),
      notes: toText(attributes['NOTES'] ?? null),
      global_id: requireAttribute(attributes, 'GlobalID'),
      shape_area: toNumber(attributes['Shape.STArea()'] ?? null),
      shape_length: toNumber(attributes['Shape.STLength()'] ?? null),
      geometry: { type: 'MultiPolygon', coordinates: placemark.polygons },
      label_point: labelPointsByObjectId.get(objectId) ?? placemark.labelPoint ?? null,
    });
  }

  return records;
}
