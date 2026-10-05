import { parseProtectedAreaKml } from '@/lib/map/kmlParser';

const DEFAULT_ATTRIBUTES: Record<string, string> = {
  OBJECTID: '1',
  PASITES_ID: '1001',
  NAME: 'Test Area',
  OC_NAME: 'Test Area OC',
  TYPE: 'ER',
  SUBTYPE: 'Ecological Reserve',
  STATUS: 'Active',
  SOURCE: 'Parks',
  IUCN: 'Ia',
  OC_NO: 'OC-1',
  ACRES: '100.5',
  HECTARES: '40.7',
  OC_DATE: '1990-05-01',
  DATE_EST: '1988-01-14',
  NOTES: 'A note',
  GlobalID: '{ABC-123}',
  'Shape.STArea()': '12345.6',
  'Shape.STLength()': '678.9',
};

function simpleData(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([name, value]) => `<SimpleData name="${name}">${value}</SimpleData>`)
    .join('');
}

function polygonXml(outerCoordinates: string, innerCoordinates: string[] = []): string {
  const inner = innerCoordinates
    .map(
      (ring) =>
        `<innerBoundaryIs><LinearRing><coordinates>${ring}</coordinates></LinearRing></innerBoundaryIs>`
    )
    .join('');

  return (
    '<Polygon><outerBoundaryIs><LinearRing>' +
    `<coordinates>${outerCoordinates}</coordinates>` +
    '</LinearRing></outerBoundaryIs>' +
    inner +
    '</Polygon>'
  );
}

interface PlacemarkOptions {
  name?: string | null;
  attributes?: Record<string, string>;
  geometry?: string;
  labelPoint?: string;
}

function placemarkXml(options: PlacemarkOptions = {}): string {
  const name = options.name === undefined ? 'Test Area' : options.name;
  const nameElement = name === null ? '' : `<name>${name}</name>`;
  const geometry = options.geometry ?? polygonXml('1,2 5,2 5,6 1,6 1,2');
  const point =
    options.labelPoint === undefined
      ? ''
      : `<Point><coordinates>${options.labelPoint}</coordinates></Point>`;

  return (
    `<Placemark>${nameElement}${geometry}${point}` +
    `<ExtendedData><SchemaData schemaUrl="#sites">${simpleData(
      options.attributes ?? DEFAULT_ATTRIBUTES
    )}</SchemaData></ExtendedData></Placemark>`
  );
}

function documentXml(placemarks: string): string {
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<kml xmlns="http://www.opengis.net/kml/2.2">' +
    '<Document>' +
    placemarks +
    '</Document></kml>'
  );
}

describe('parseProtectedAreaKml', () => {
  it('reads one placemark into a protected area record', () => {
    const records = parseProtectedAreaKml(documentXml(placemarkXml()));

    expect(records).toHaveLength(1);
    expect(records[0]).toEqual({
      objectid: 1,
      pasites_id: 1001,
      name: 'Test Area',
      short_name: 'Test Area',
      oc_name: 'Test Area OC',
      area_type: 'ER',
      subtype: 'Ecological Reserve',
      status: 'Active',
      source: 'Parks',
      iucn: 'Ia',
      oc_no: 'OC-1',
      acres: 100.5,
      hectares: 40.7,
      oc_date: '1990-05-01',
      date_est: '1988-01-14',
      notes: 'A note',
      global_id: '{ABC-123}',
      shape_area: 12345.6,
      shape_length: 678.9,
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [1, 2],
              [5, 2],
              [5, 6],
              [1, 6],
              [1, 2],
            ],
          ],
        ],
      },
      label_point: null,
    });
  });

  it('keeps the inner rings of a polygon as holes', () => {
    const geometry = polygonXml('0,0 10,0 10,10 0,10 0,0', ['2,2 2,4 4,4 4,2 2,2']);
    const records = parseProtectedAreaKml(documentXml(placemarkXml({ geometry })));

    expect(records[0].geometry.coordinates).toEqual([
      [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
        [
          [2, 2],
          [2, 4],
          [4, 4],
          [4, 2],
          [2, 2],
        ],
      ],
    ]);
  });

  it('puts every polygon of a MultiGeometry in one MultiPolygon', () => {
    const geometry =
      '<MultiGeometry>' +
      polygonXml('0,0 1,0 1,1 0,1 0,0') +
      polygonXml('5,5 6,5 6,6 5,6 5,5') +
      '</MultiGeometry>';
    const records = parseProtectedAreaKml(documentXml(placemarkXml({ geometry })));

    expect(records[0].geometry.coordinates).toEqual([
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
      [
        [
          [5, 5],
          [6, 5],
          [6, 6],
          [5, 6],
          [5, 5],
        ],
      ],
    ]);
  });

  it('ignores the altitude of a coordinate and tolerates newlines', () => {
    const geometry = polygonXml('\n    1,2,0\n    5,2,0\n    5,6,0\n    1,6,0\n    1,2,0\n  ');
    const records = parseProtectedAreaKml(documentXml(placemarkXml({ geometry })));

    expect(records[0].geometry.coordinates[0][0][0]).toEqual([1, 2]);
    expect(records[0].geometry.coordinates[0][0]).toHaveLength(5);
  });

  it('matches the label points of a second file on OBJECTID', () => {
    const outline = documentXml(
      placemarkXml({ attributes: { ...DEFAULT_ATTRIBUTES, OBJECTID: '7' } })
    );
    const labels = documentXml(
      placemarkXml({
        attributes: { ...DEFAULT_ATTRIBUTES, OBJECTID: '7', TYPE: 'ER' },
        geometry: '',
        labelPoint: '-113.5,52.25,0',
      })
    );

    const records = parseProtectedAreaKml(outline, labels);

    expect(records[0].label_point).toEqual({ type: 'Point', coordinates: [-113.5, 52.25] });
  });

  it('leaves label_point null when the labels file has no match', () => {
    const outline = documentXml(
      placemarkXml({ attributes: { ...DEFAULT_ATTRIBUTES, OBJECTID: '7' } })
    );
    const labels = documentXml(
      placemarkXml({
        attributes: { ...DEFAULT_ATTRIBUTES, OBJECTID: '8' },
        geometry: '',
        labelPoint: '-113.5,52.25',
      })
    );

    const records = parseProtectedAreaKml(outline, labels);

    expect(records[0].label_point).toBeNull();
  });

  it('reads a point from the outline file when the placemark has one', () => {
    const records = parseProtectedAreaKml(
      documentXml(placemarkXml({ labelPoint: '-114.1,51.05' }))
    );

    expect(records[0].label_point).toEqual({ type: 'Point', coordinates: [-114.1, 51.05] });
  });

  it('prefers the label point of the labels file over the one in the outline', () => {
    const outline = documentXml(placemarkXml({ labelPoint: '-114.1,51.05' }));
    const labels = documentXml(
      placemarkXml({ geometry: '', labelPoint: '-113.5,52.25' })
    );

    const records = parseProtectedAreaKml(outline, labels);

    expect(records[0].label_point).toEqual({ type: 'Point', coordinates: [-113.5, 52.25] });
  });

  it('ignores markup in a CDATA block before the placemarks', () => {
    const style =
      '<Style id="defaultStyle0"><BalloonStyle><text><![CDATA[' +
      '<html><body><table><tr><th colspan="2">$[name]</th></tr>' +
      '<tr><td>$[Parks.GDB.ParksProtectedAreasAlberta/OBJECTID]</td></tr>' +
      '</table></body></html>' +
      ']]></text></BalloonStyle></Style>';

    const records = parseProtectedAreaKml(
      documentXml(style + placemarkXml({ attributes: { ...DEFAULT_ATTRIBUTES, OBJECTID: '3' } }))
    );

    expect(records).toHaveLength(1);
    expect(records[0].objectid).toBe(3);
    expect(records[0].name).toBe('Test Area');
  });

  it('keeps markup that is inside a CDATA attribute value', () => {
    const attributes = {
      ...DEFAULT_ATTRIBUTES,
      NOTES: '<![CDATA[A note with <b>markup</b>]]>',
    };
    const records = parseProtectedAreaKml(documentXml(placemarkXml({ attributes })));

    expect(records[0].notes).toBe('A note with <b>markup</b>');
  });

  it('decodes XML entities in the name and the attributes', () => {
    const attributes = { ...DEFAULT_ATTRIBUTES, NOTES: 'Fish &amp; wildlife' };
    const records = parseProtectedAreaKml(
      documentXml(placemarkXml({ name: 'Antelope &amp; Co', attributes }))
    );

    expect(records[0].name).toBe('Antelope & Co');
    expect(records[0].notes).toBe('Fish & wildlife');
  });

  it('turns an empty or an invalid attribute value into null', () => {
    const attributes = { ...DEFAULT_ATTRIBUTES, PASITES_ID: '', NOTES: '', OC_DATE: 'not-a-date' };
    const records = parseProtectedAreaKml(documentXml(placemarkXml({ attributes })));

    expect(records[0].pasites_id).toBeNull();
    expect(records[0].notes).toBeNull();
    expect(records[0].oc_date).toBeNull();
    expect(records[0].date_est).toBe('1988-01-14');
    expect(records[0].area_type).toBe('ER');
  });

  it('throws when the outline file has no placemark', () => {
    expect(() => parseProtectedAreaKml(documentXml(''))).toThrow(
      'The outline KML file has no Placemark elements.'
    );
  });

  it('throws when a placemark has no name', () => {
    expect(() => parseProtectedAreaKml(documentXml(placemarkXml({ name: null })))).toThrow(
      'A KML Placemark has no name.'
    );
  });

  it('throws when a placemark has no OBJECTID', () => {
    const attributes = { ...DEFAULT_ATTRIBUTES };
    delete attributes.OBJECTID;

    expect(() => parseProtectedAreaKml(documentXml(placemarkXml({ attributes })))).toThrow(
      'A KML Placemark has no numeric OBJECTID field.'
    );
  });

  it('throws when a placemark has no TYPE', () => {
    const attributes = { ...DEFAULT_ATTRIBUTES };
    delete attributes.TYPE;

    expect(() => parseProtectedAreaKml(documentXml(placemarkXml({ attributes })))).toThrow(
      'A KML Placemark has no TYPE field.'
    );
  });

  it('throws when a placemark has no GlobalID', () => {
    const attributes = { ...DEFAULT_ATTRIBUTES };
    delete attributes.GlobalID;

    expect(() => parseProtectedAreaKml(documentXml(placemarkXml({ attributes })))).toThrow(
      'A KML Placemark has no GlobalID field.'
    );
  });

  it('throws when a placemark has no polygon', () => {
    expect(() =>
      parseProtectedAreaKml(documentXml(placemarkXml({ geometry: '', labelPoint: '1,2' })))
    ).toThrow('has no Polygon geometry.');
  });

  it('throws when two placemarks share an OBJECTID', () => {
    const placemark = placemarkXml();

    expect(() => parseProtectedAreaKml(documentXml(placemark + placemark))).toThrow(
      'The outline KML has two placemarks with OBJECTID 1.'
    );
  });

  it('throws on an invalid coordinate pair', () => {
    const geometry = polygonXml('1,2 5,nope 5,6 1,6 1,2');

    expect(() => parseProtectedAreaKml(documentXml(placemarkXml({ geometry })))).toThrow(
      'Invalid KML coordinate pair: 5,nope'
    );
  });

  it('throws when a polygon has no outer ring', () => {
    const geometry = '<Polygon><innerBoundaryIs><LinearRing><coordinates>1,2 3,4 5,6 1,2</coordinates></LinearRing></innerBoundaryIs></Polygon>';

    expect(() => parseProtectedAreaKml(documentXml(placemarkXml({ geometry })))).toThrow(
      'A KML Polygon must have exactly one outerBoundaryIs ring.'
    );
  });
});
