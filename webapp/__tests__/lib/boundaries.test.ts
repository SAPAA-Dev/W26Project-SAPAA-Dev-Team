import {
  applyBoundaryColor,
  boundaryBounds,
  normalizeBoundaryColor,
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
    site_name: null,
    last_inspection_date: null,
    boundary_color: null,
    geometry: { type: 'MultiPolygon', coordinates: [[squareRing(4)]] },
    ...overrides,
  };
}

describe('roundCoordinates (US 2.0.6)', () => {
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

describe('simplifyRing (US 2.0.6)', () => {
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

describe('simplifyMultiPolygon (US 2.0.6)', () => {
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

describe('toBoundaryFeatureCollection (US 2.0.6)', () => {
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
      protected_area_id: 7,
      name: 'Wainwright Dunes',
      fid: 12,
      area_type: 'ER',
      boundary_color: null,
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
      site_name: null,
      last_inspection_date: null,
    });
  });

  it('maps the linked site name and last inspection date (2.0.8 AT2)', () => {
    const collection = toBoundaryFeatureCollection([
      row({ site_name: 'Wainwright Dunes', last_inspection_date: '2024-03-15' }),
    ]);

    expect(collection.features[0].properties.site_name).toBe('Wainwright Dunes');
    expect(collection.features[0].properties.last_inspection_date).toBe('2024-03-15');
  });

  it('maps null when the area has no linked site (2.0.8 AT2)', () => {
    const collection = toBoundaryFeatureCollection([row({ site_name: null, last_inspection_date: null })]);

    expect(collection.features[0].properties.site_name).toBeNull();
    expect(collection.features[0].properties.last_inspection_date).toBeNull();
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

describe('boundary colors', () => {
  function threeAreas() {
    return toBoundaryFeatureCollection([
      row({ id: 1, area_type: 'NA', boundary_color: null }),
      row({ id: 2, area_type: 'NA', boundary_color: '#111111' }),
      row({ id: 3, area_type: 'ER', boundary_color: '#222222' }),
    ]);
  }

  it('normalizes a six-digit hex color and rejects anything else', () => {
    expect(normalizeBoundaryColor(' #AABBCC ')).toBe('#aabbcc');
    expect(normalizeBoundaryColor('#aabbc')).toBeNull();
    expect(normalizeBoundaryColor('red')).toBeNull();
    expect(normalizeBoundaryColor(42)).toBeNull();
  });

  it('maps the stored color into the feature properties', () => {
    expect(threeAreas().features[0].properties.boundary_color).toBeNull();
    expect(threeAreas().features[1].properties.boundary_color).toBe('#111111');
    expect(threeAreas().features[0].properties.protected_area_id).toBe(1);
  });

  it('sets the color on one site only and leaves the input unchanged', () => {
    const collection = threeAreas();

    const updated = applyBoundaryColor(collection, {
      scope: 'site',
      protectedAreaId: 1,
      areaType: null,
      color: '#ABCDEF',
    });

    expect(updated.features.map((feature) => feature.properties.boundary_color)).toEqual([
      '#abcdef',
      '#111111',
      '#222222',
    ]);
    expect(collection.features[0].properties.boundary_color).toBeNull();
  });

  it('sets the color on every boundary of a site type, replacing individual colors', () => {
    const updated = applyBoundaryColor(threeAreas(), {
      scope: 'type',
      protectedAreaId: 0,
      areaType: ' NA ',
      color: '#00ff00',
    });

    expect(updated.features.map((feature) => feature.properties.boundary_color)).toEqual([
      '#00ff00',
      '#00ff00',
      '#222222',
    ]);
  });

  it('does nothing for a blank type, an invalid color, or no match (2.0.14 AT1)', () => {
    const collection = threeAreas();

    expect(
      applyBoundaryColor(collection, {
        scope: 'type',
        protectedAreaId: 0,
        areaType: '  ',
        color: '#00ff00',
      })
    ).toBe(collection);
    expect(
      applyBoundaryColor(collection, {
        scope: 'site',
        protectedAreaId: 1,
        areaType: null,
        color: 'nope',
      })
    ).toBe(collection);
    expect(
      applyBoundaryColor(collection, {
        scope: 'site',
        protectedAreaId: 99,
        areaType: null,
        color: '#00ff00',
      })
    ).toBe(collection);
  });
});
