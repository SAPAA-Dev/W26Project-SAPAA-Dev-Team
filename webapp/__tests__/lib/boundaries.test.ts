import {
  boundaryBounds,
  roundCoordinates,
  simplifyMultiPolygon,
  simplifyRing,
  toBoundaryFeatureCollection,
} from '@/lib/map/boundaries';
import type { GeoJsonMultiPolygon, ProtectedAreaBoundaryRow } from '@/lib/map/boundaries';

const TOLERANCE = 0.0001;

/** A closed square ring with its lower left corner at (offset, offset). */
function squareRing(size: number, offset = 0): number[][] {
  return [
    [offset, offset],
    [offset + size, offset],
    [offset + size, offset + size],
    [offset, offset + size],
    [offset, offset],
  ];
}

/** A ring whose positions all sit inside one tolerance step. */
const TINY_RING: number[][] = [
  [0, 0],
  [0.00001, 0],
  [0.00001, 0.00001],
  [0, 0.00001],
  [0, 0],
];

function row(overrides: Partial<ProtectedAreaBoundaryRow> = {}): ProtectedAreaBoundaryRow {
  return {
    id: 7,
    name: 'Wainwright Dunes',
    fid: 12,
    area_type: 'ER',
    subtype: null,
    iucn: 'Ia',
    oc_no: 'OC 123/45',
    acres: 10.5,
    hectares: 4.25,
    oc_date: '1971-03-15',
    date_est: '1971-03-15',
    oc_name: 'Wainwright Dunes Ecological Reserve',
    notes: null,
    geometry: { type: 'MultiPolygon', coordinates: [[squareRing(4)]] },
    ...overrides,
  };
}

describe('roundCoordinates', () => {
  it('rounds each coordinate to five decimals and drops the third value', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [-110.676916, 52.623369, 0],
            [-110.6769124, 52.6233612, 0],
            [-110.676619, 52.623369, 0],
            [-110.676916, 52.623369, 0],
          ],
        ],
      ],
    };

    const rounded = roundCoordinates(geometry);

    expect(rounded.coordinates[0][0][0]).toEqual([-110.67692, 52.62337]);
    expect(rounded.coordinates[0][0][1]).toEqual([-110.67691, 52.62336]);
    // The elevation every export writes as 0 is removed, not rounded.
    expect(rounded.coordinates[0][0][0]).toHaveLength(2);
  });

  it('accepts a different number of decimals', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[[[-110.676916, 52.623369]]]],
    };

    expect(roundCoordinates(geometry, 3).coordinates[0][0][0]).toEqual([-110.677, 52.623]);
  });
});

describe('simplifyRing', () => {
  it('drops collinear positions and keeps the corners', () => {
    const ring = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ];

    expect(simplifyRing(ring, TOLERANCE)).toEqual([
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ]);
  });

  it('closes a ring the import left open', () => {
    const open = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ];

    expect(simplifyRing(open, TOLERANCE)).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ]);
  });

  it('returns null when the positions collapse to a line', () => {
    const flat = [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 0],
    ];

    expect(simplifyRing(flat, TOLERANCE)).toBeNull();
  });

  it('returns null when every position sits inside the tolerance', () => {
    expect(simplifyRing(TINY_RING, TOLERANCE)).toBeNull();
  });

  it('returns null for a ring with fewer than four positions', () => {
    expect(
      simplifyRing(
        [
          [0, 0],
          [1, 1],
          [0, 0],
        ],
        TOLERANCE
      )
    ).toBeNull();
  });
});

describe('simplifyMultiPolygon', () => {
  it('keeps a hole and simplifies it on its own', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[squareRing(4), squareRing(1, 1)]],
    };

    const simplified = simplifyMultiPolygon(geometry, TOLERANCE);

    expect(simplified?.coordinates[0]).toHaveLength(2);
    expect(simplified?.coordinates[0][1]).toEqual(squareRing(1, 1));
  });

  it('drops a polygon when its outer ring collapses', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[TINY_RING]],
    };

    expect(simplifyMultiPolygon(geometry, TOLERANCE)).toBeNull();
  });

  it('keeps the polygons that survive and drops the rest', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[TINY_RING], [squareRing(4)]],
    };

    const simplified = simplifyMultiPolygon(geometry, TOLERANCE);

    expect(simplified?.coordinates).toHaveLength(1);
    expect(simplified?.coordinates[0][0]).toEqual(squareRing(4));
  });
});

describe('toBoundaryFeatureCollection', () => {
  it('returns an empty collection for no rows', () => {
    expect(toBoundaryFeatureCollection([])).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('maps the row fields into the feature properties', () => {
    const collection = toBoundaryFeatureCollection([row()]);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].id).toBe(7);
    expect(collection.features[0].properties).toEqual({
      name: 'Wainwright Dunes',
      fid: 12,
      area_type: 'ER',
      subtype: null,
      iucn: 'Ia',
      oc_no: 'OC 123/45',
      acres: 10.5,
      hectares: 4.25,
      oc_date: '1971-03-15',
      date_est: '1971-03-15',
      oc_name: 'Wainwright Dunes Ecological Reserve',
      notes: null,
      county: null,
      is_active: null,
    });
  });

  it('returns rounded coordinates', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [-110.1234567, 52.1234567],
            [-110.1234567, 52.2],
            [-110.0, 52.2],
            [-110.0, 52.1234567],
            [-110.1234567, 52.1234567],
          ],
        ],
      ],
    };

    const collection = toBoundaryFeatureCollection([row({ geometry })]);

    expect(collection.features[0].geometry.coordinates[0][0][0]).toEqual([-110.12346, 52.12346]);
  });

  it('leaves out a row whose geometry collapses at the tolerance', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[TINY_RING]],
    };

    const collection = toBoundaryFeatureCollection([row({ id: 9, geometry })]);

    expect(collection.features).toHaveLength(0);
  });

  it('keeps the rows that survive next to the ones that do not', () => {
    const tiny: GeoJsonMultiPolygon = { type: 'MultiPolygon', coordinates: [[TINY_RING]] };

    const collection = toBoundaryFeatureCollection([
      row({ id: 1, geometry: tiny }),
      row({ id: 2 }),
      row({ id: 3, geometry: tiny }),
    ]);

    expect(collection.features.map((feature) => feature.id)).toEqual([2]);
  });
});

describe('boundaryBounds', () => {
  it('US 2.0.6 AT3: returns the box around every polygon of the boundary', () => {
    const geometry: GeoJsonMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[squareRing(1, -114)], [squareRing(2, -110)]],
    };

    expect(boundaryBounds(geometry)).toEqual([
      [-114, -114],
      [-108, -108],
    ]);
  });

  it('returns null for a boundary with no positions', () => {
    expect(boundaryBounds({ type: 'MultiPolygon', coordinates: [] })).toBeNull();
  });
});
