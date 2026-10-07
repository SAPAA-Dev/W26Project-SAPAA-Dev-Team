/**
 * @jest-environment node
 *
 * The node environment is required. jest.config.ts sets jest-environment-jsdom
 * for the whole project, and jsdom installs a global XMLSerializer. togeojson
 * hashes the KML Style elements with XMLSerializer, and the jsdom one throws when
 * it is handed a node built by @xmldom/xmldom. With no global present, togeojson
 * falls back to the xmldom serializer, which is what the server does.
 */
import { strToU8, zipSync } from 'fflate';
import {
  KmlImportError,
  NO_FID,
  parseProtectedAreaFile,
  parseProtectedAreaKmlText,
} from '@/lib/map/kmlImport';

const OUTER_RING = '1,2,0 3,4,0 5,6,0 1,2,0';
const HOLE_RING = '1.5,2,0 2,2,0 2,2.5,0 1.5,2,0';
const LINE_RING = '10,10,0 20,20,0';

// A Style element makes togeojson hash styles, which is the code path that needs
// a working XMLSerializer.
const STYLE =
  '<Style id="poly-0288D1-1200-76-normal"><LineStyle><color>ffd18802</color><width>1.2</width></LineStyle></Style>';

function polygon(outerCoordinates: string, holeCoordinates?: string): string {
  const outer = `<outerBoundaryIs><LinearRing><coordinates>${outerCoordinates}</coordinates></LinearRing></outerBoundaryIs>`;
  const hole =
    holeCoordinates === undefined
      ? ''
      : `<innerBoundaryIs><LinearRing><coordinates>${holeCoordinates}</coordinates></LinearRing></innerBoundaryIs>`;
  return `<Polygon>${outer}${hole}</Polygon>`;
}

function lineString(coordinates: string): string {
  return `<LineString><coordinates>${coordinates}</coordinates></LineString>`;
}

function placemark(name: string, description: string, geometry: string): string {
  return `<Placemark><name>${name}</name><description><![CDATA[${description}]]></description><MultiGeometry>${geometry}</MultiGeometry></Placemark>`;
}

function folder(name: string, placemarks: string[]): string {
  return `<Folder><name>${name}</name>${placemarks.join('')}</Folder>`;
}

function kmlDocument(...folders: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Test</name>${STYLE}${folders.join('')}</Document></kml>`;
}

function descriptionBlock(name: string, fields: Record<string, string>): string {
  const body = Object.entries(fields)
    .map(([key, value]) => `   ${key}   ${value}    <br>`)
    .join('');
  return `${name}    <br>       <br>${body}`;
}

function variantA(overrides: Record<string, string> = {}): string {
  return descriptionBlock('Wainwright Dunes', {
    FID: '7',
    NAME: 'Wainwright Dunes',
    TYPE: 'ER',
    SUBTYPE: '',
    IUCN: 'Ia',
    OC_NO: 'OC 1/90',
    ACRES: '100.5',
    HECTARES: '40.7',
    OC_DATE: '3/18/1998',
    DATE_EST: '3/18/1998',
    OC_NAME: 'Wainwright Dunes Ecological Reserve',
    NOTES: '',
    ...overrides,
  });
}

function variantB(overrides: Record<string, string> = {}): string {
  return descriptionBlock('Beaverdam-Paine', {
    FID: '0',
    PASITES_ID: '5554',
    NAME: 'Beaverdam-Paine',
    TYPE: 'PP',
    SUBTYPE: '',
    STATUS: 'CNT',
    SOURCE: '41',
    ACRES: '1444.411697',
    HECTARES: '584.532675',
    DATE_RES: '4/4/1978',
    NOTES: '',
    AREA_HA: '584.532675',
    ...overrides,
  });
}

describe('parseProtectedAreaKmlText', () => {
  it('maps the fields of a Variant A placemark', () => {
    const kml = kmlDocument(folder('Ecological Reserves', [placemark('Wainwright Dunes', variantA(), polygon(OUTER_RING))]));

    const result = parseProtectedAreaKmlText(kml);

    expect(result.stats).toEqual({ placemarks: 1, inserted: 1, skipped: 0, folders: 1 });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toEqual({
      folder: 'Ecological Reserves',
      fid: 7,
      name: 'Wainwright Dunes',
      area_type: 'ER',
      subtype: null,
      status: null,
      source: null,
      iucn: 'Ia',
      oc_no: 'OC 1/90',
      oc_name: 'Wainwright Dunes Ecological Reserve',
      acres: 100.5,
      hectares: 40.7,
      area_ha: null,
      oc_date: '1998-03-18',
      date_est: '1998-03-18',
      date_res: null,
      notes: null,
      geometry: { type: 'MultiPolygon', coordinates: [[[[1, 2], [3, 4], [5, 6], [1, 2]]]] },
    });
  });

  it('maps the fields that only a Variant B placemark carries', () => {
    const kml = kmlDocument(folder('Protective Notations (PNT)', [placemark('Beaverdam-Paine', variantB(), polygon(OUTER_RING))]));

    const record = parseProtectedAreaKmlText(kml).records[0];

    expect(record.status).toBe('CNT');
    expect(record.source).toBe('41');
    expect(record.date_res).toBe('1978-04-04');
    expect(record.area_ha).toBe(584.532675);
    expect(record.hectares).toBe(584.532675);
    expect(record.oc_date).toBeNull();
    expect(record.date_est).toBeNull();
  });

  it('turns the literal <Null> date into null and keeps the record', () => {
    const kml = kmlDocument(folder('National Parks', [placemark('Banff', variantA({ OC_DATE: '<Null>' }), polygon(OUTER_RING))]));

    const result = parseProtectedAreaKmlText(kml);

    expect(result.stats.skipped).toBe(0);
    expect(result.records[0].oc_date).toBeNull();
    expect(result.records[0].date_est).toBe('1998-03-18');
  });

  it('turns empty values into null', () => {
    const kml = kmlDocument(
      folder('Provincial Parks', [placemark('Opal', variantA({ SUBTYPE: '', OC_NO: '', NOTES: '', OC_NAME: '' }), polygon(OUTER_RING))])
    );

    const record = parseProtectedAreaKmlText(kml).records[0];

    expect(record.subtype).toBeNull();
    expect(record.oc_no).toBeNull();
    expect(record.notes).toBeNull();
    expect(record.oc_name).toBeNull();
  });

  it('reads a real description block with uneven spacing', () => {
    const description =
      'Fidler-Greywillow Wildland    <br>       <br>   FID   0    <br>   NAME   Fidler-Greywillow Wildland    <br>   TYPE   WPP    <br>   SUBTYPE       <br>   IUCN   IB    <br>   OC_NO   OC 101/98    <br>   ACRES   18245.129129    <br>   HECTARES   7383.541799    <br>   OC_DATE   3/18/1998    <br>   DATE_EST   3/18/1998    <br>   OC_NAME   Fidler-Greywillow Wildland Provincial Park    <br>   NOTES';
    const kml = kmlDocument(folder('Wildland Provincial Parks', [placemark('Fidler-Greywillow Wildland', description, polygon(OUTER_RING))]));

    const result = parseProtectedAreaKmlText(kml);

    expect(result.warnings).toEqual([]);
    expect(result.records[0]).toMatchObject({
      folder: 'Wildland Provincial Parks',
      fid: 0,
      name: 'Fidler-Greywillow Wildland',
      area_type: 'WPP',
      subtype: null,
      iucn: 'IB',
      oc_no: 'OC 101/98',
      acres: 18245.129129,
      hectares: 7383.541799,
      oc_date: '1998-03-18',
      notes: null,
    });
  });

  it('falls back to the name element, the folder and the FID sentinel when the description holds no fields', () => {
    const description = '<a>https://www.google.com/maps/dir//53.59880109999999,-113.7324483<a/>';
    const kml = kmlDocument(folder('Provincial Parks', [placemark('Lois Hole Centennial', description, polygon(OUTER_RING))]));

    const result = parseProtectedAreaKmlText(kml);

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      folder: 'Provincial Parks',
      fid: NO_FID,
      name: 'Lois Hole Centennial',
      area_type: 'Provincial Parks',
      subtype: null,
      oc_date: null,
    });
    expect(result.warnings).toEqual([
      '"Lois Hole Centennial": the description has no FID, so the row uses -1.',
    ]);
  });

  it('wraps a single Polygon in a MultiPolygon', () => {
    const kml = kmlDocument(folder('Natural Areas', [placemark('Area', variantA(), polygon(OUTER_RING))]));

    const geometry = parseProtectedAreaKmlText(kml).records[0].geometry;

    expect(geometry.type).toBe('MultiPolygon');
    expect(geometry.coordinates).toHaveLength(1);
  });

  it('keeps every Polygon of a MultiGeometry', () => {
    const kml = kmlDocument(
      folder('Natural Areas', [placemark('Area', variantA(), polygon(OUTER_RING) + polygon('7,8,0 9,10,0 11,12,0 7,8,0'))])
    );

    const geometry = parseProtectedAreaKmlText(kml).records[0].geometry;

    expect(geometry.coordinates).toHaveLength(2);
  });

  it('drops a LineString that shares a MultiGeometry with a Polygon and warns', () => {
    const kml = kmlDocument(
      folder('Consultative Notations (CNT)', [placemark('Castle River', variantA({ NAME: 'Castle River' }), lineString(LINE_RING) + polygon(OUTER_RING))])
    );

    const result = parseProtectedAreaKmlText(kml);

    expect(result.stats.skipped).toBe(0);
    expect(result.records[0].geometry.coordinates).toEqual([[[[1, 2], [3, 4], [5, 6], [1, 2]]]]);
    expect(result.warnings).toEqual([
      '"Castle River": ignored a LineString geometry and kept the polygons only.',
    ]);
  });

  it('skips a placemark that has no polygon at all', () => {
    const kml = kmlDocument(
      folder('Natural Areas', [placemark('Only A Line', variantA({ NAME: 'Only A Line' }), lineString(LINE_RING))])
    );

    const result = parseProtectedAreaKmlText(kml);

    expect(result.records).toEqual([]);
    expect(result.stats).toEqual({ placemarks: 1, inserted: 0, skipped: 1, folders: 0 });
    expect(result.warnings).toEqual([
      '"Only A Line": ignored a LineString geometry and kept the polygons only.',
      'Skipped "Only A Line": it has no polygon geometry.',
    ]);
  });

  it('reduces coordinates to longitude and latitude', () => {
    const kml = kmlDocument(folder('Natural Areas', [placemark('Area', variantA(), polygon(OUTER_RING))]));

    const ring = parseProtectedAreaKmlText(kml).records[0].geometry.coordinates[0][0];

    expect(ring).toEqual([[1, 2], [3, 4], [5, 6], [1, 2]]);
    for (const position of ring) expect(position).toHaveLength(2);
  });

  it('keeps an inner boundary as a second ring', () => {
    const kml = kmlDocument(folder('Natural Areas', [placemark('Area', variantA(), polygon(OUTER_RING, HOLE_RING))]));

    const rings = parseProtectedAreaKmlText(kml).records[0].geometry.coordinates[0];

    expect(rings).toHaveLength(2);
    expect(rings[1]).toEqual([[1.5, 2], [2, 2], [2, 2.5], [1.5, 2]]);
  });

  it('keeps the first placemark when two share a folder and a FID', () => {
    const kml = kmlDocument(
      folder('Natural Areas', [
        placemark('First', variantA({ NAME: 'First' }), polygon(OUTER_RING)),
        placemark('Second', variantA({ NAME: 'Second' }), polygon(OUTER_RING)),
      ])
    );

    const result = parseProtectedAreaKmlText(kml);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].name).toBe('First');
    expect(result.stats.skipped).toBe(1);
    expect(result.warnings).toEqual(['Skipped "Second": folder "Natural Areas" already has FID 7.']);
  });

  it('keeps the same FID when it appears in two different folders', () => {
    const kml = kmlDocument(
      folder('Fidler', [placemark('One', variantA({ NAME: 'One' }), polygon(OUTER_RING))]),
      folder('Grizzly', [placemark('Two', variantA({ NAME: 'Two' }), polygon(OUTER_RING))])
    );

    const result = parseProtectedAreaKmlText(kml);

    expect(result.records).toHaveLength(2);
    expect(result.stats.folders).toBe(2);
    expect(result.records.map((record) => [record.folder, record.fid])).toEqual([
      ['Fidler', 7],
      ['Grizzly', 7],
    ]);
  });

  it('keeps two placemarks that share a name in different folders', () => {
    const kml = kmlDocument(
      folder('First Folder', [placemark('Bear River', variantA({ FID: '1', NAME: 'Bear River' }), polygon(OUTER_RING))]),
      folder('Second Folder', [placemark('Bear River', variantA({ FID: '1', NAME: 'Bear River' }), polygon(OUTER_RING))])
    );

    expect(parseProtectedAreaKmlText(kml).records).toHaveLength(2);
  });

  it('falls back to the folder name when the placemark carries no TYPE', () => {
    const kml = kmlDocument(folder('Heritage Rangelands', [placemark('Area', variantA({ TYPE: '' }), polygon(OUTER_RING))]));

    expect(parseProtectedAreaKmlText(kml).records[0].area_type).toBe('Heritage Rangelands');
  });

  it('keeps the folder of a placemark that follows one with no geometry', () => {
    const bare =
      '<Placemark><name>Just A Pin</name><description><![CDATA[Just A Pin <br> FID 1 <br> NAME Just A Pin <br> TYPE NA ]]></description></Placemark>';
    const kml = kmlDocument(
      folder('First Folder', [bare]),
      folder('Second Folder', [placemark('Real Site', variantA({ NAME: 'Real Site' }), polygon(OUTER_RING))])
    );

    const result = parseProtectedAreaKmlText(kml);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].folder).toBe('Second Folder');
  });

  it('rejects a date the month does not have', () => {
    const kml = kmlDocument(folder('National Parks', [placemark('Area', variantA({ OC_DATE: '2/31/2020' }), polygon(OUTER_RING))]));

    expect(parseProtectedAreaKmlText(kml).records[0].oc_date).toBeNull();
  });

  it('accepts 29 February in a leap year', () => {
    const kml = kmlDocument(folder('National Parks', [placemark('Area', variantA({ OC_DATE: '2/29/2020' }), polygon(OUTER_RING))]));

    expect(parseProtectedAreaKmlText(kml).records[0].oc_date).toBe('2020-02-29');
  });

  it('warns and leaves the column empty when a number does not parse', () => {
    const kml = kmlDocument(folder('Natural Areas', [placemark('Area', variantA({ ACRES: '1,444.41' }), polygon(OUTER_RING))]));

    const result = parseProtectedAreaKmlText(kml);

    expect(result.records[0].acres).toBeNull();
    expect(result.warnings).toEqual([
      '"Wainwright Dunes": the ACRES value "1,444.41" is not a number, so that column stays empty.',
    ]);
  });

  it('rejects a file that is not XML', () => {
    expect(() => parseProtectedAreaKmlText('this is not a KML file')).toThrow(KmlImportError);
  });

  it('rejects XML that is not KML', () => {
    expect(() => parseProtectedAreaKmlText('<root><child>text</child></root>')).toThrow(KmlImportError);
  });

  it('rejects a KML document with no placemarks', () => {
    const kml = '<?xml version="1.0"?><kml><Document><name>Empty</name></Document></kml>';

    expect(() => parseProtectedAreaKmlText(kml)).toThrow('The KML file has no Placemark elements.');
  });
});

describe('parseProtectedAreaFile', () => {
  const kmlText = kmlDocument(
    folder('Ecological Reserves', [placemark('Wainwright Dunes', variantA(), polygon(OUTER_RING))])
  );

  it('reads a .kml file', () => {
    const result = parseProtectedAreaFile(strToU8(kmlText));

    expect(result.records).toHaveLength(1);
    expect(result.records[0].folder).toBe('Ecological Reserves');
  });

  it('reads a .kmz file and gives the same records as the .kml', () => {
    const archive = zipSync({ 'doc.kml': strToU8(kmlText) });

    const result = parseProtectedAreaFile(archive);

    expect(result.records).toEqual(parseProtectedAreaFile(strToU8(kmlText)).records);
  });

  it('prefers doc.kml over another KML entry in the archive', () => {
    const decoy = kmlDocument(
      folder('Decoy Folder', [placemark('Decoy', variantA({ NAME: 'Decoy' }), polygon(OUTER_RING))])
    );
    const archive = zipSync({ 'other.kml': strToU8(decoy), 'doc.kml': strToU8(kmlText) });

    const result = parseProtectedAreaFile(archive);

    expect(result.records[0].folder).toBe('Ecological Reserves');
  });

  it('reads a .kml entry that is not called doc.kml', () => {
    const archive = zipSync({ 'export.kml': strToU8(kmlText) });

    expect(parseProtectedAreaFile(archive).records).toHaveLength(1);
  });

  it('chooses the reader from the bytes, not from the file name', () => {
    const archive = zipSync({ 'doc.kml': strToU8(kmlText) });

    const result = parseProtectedAreaFile(archive);

    expect(result.records).toHaveLength(1);
  });

  it('rejects a damaged archive', () => {
    const damaged = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02, 0x03, 0x04]);

    expect(() => parseProtectedAreaFile(damaged)).toThrow(KmlImportError);
  });

  it('rejects an archive that holds no KML file', () => {
    const archive = zipSync({ 'readme.txt': strToU8('nothing to import') });

    expect(() => parseProtectedAreaFile(archive)).toThrow(
      'The .kmz archive holds no KML file.'
    );
  });

  it('rejects a KML entry that expands beyond the size limit without unpacking it', () => {
    // The archive stays small; the declared uncompressed size is what trips the guard.
    const archive = zipSync({ 'doc.kml': new Uint8Array(65 * 1024 * 1024) });

    expect(() => parseProtectedAreaFile(archive)).toThrow(
      'The KML inside the .kmz archive is too large.'
    );
  });
});
