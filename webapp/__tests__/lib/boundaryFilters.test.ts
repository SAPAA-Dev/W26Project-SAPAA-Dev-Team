import {
  NO_SUBTYPE_LABEL,
  NO_TYPE_LABEL,
  boundaryFilterOptions,
  filterBoundaryFeatures,
  toggleAllCategoryValues,
  toggleCategoryValue,
} from '@/lib/map/boundaryFilters';
import type { BoundaryFeature } from '@/lib/map/boundaries';

function feature(
  id: number,
  name: string,
  areaType: string,
  subtype: string | null,
  ocName: string | null
): BoundaryFeature {
  return {
    type: 'Feature',
    id,
    properties: {
      name,
      fid: id,
      area_type: areaType,
      subtype,
      iucn: null,
      oc_no: null,
      acres: null,
      hectares: null,
      oc_date: null,
      date_est: null,
      oc_name: ocName,
      notes: null,
    },
    geometry: { type: 'MultiPolygon', coordinates: [] },
  };
}

const PEMBINA = feature(1, 'Pembina River', 'NA', 'Conservation', 'Pembina River Natural Area');
const JASPER = feature(2, 'Jasper', 'WPP', null, 'Jasper National Park');
const GOOSEBERRY = feature(3, 'Gooseberry', 'NA', 'Recreation', 'Gooseberry Natural Area');
const FEATURES = [PEMBINA, JASPER, GOOSEBERRY];

const ALL_SELECTED = { types: null, subtypes: null };

describe('boundaryFilterOptions', () => {
  it('lists each type and subtype once, in order, and adds a choice for a missing value', () => {
    const unnamed = feature(4, 'Blank', '  ', null, null);
    expect(
      boundaryFilterOptions({ type: 'FeatureCollection', features: [...FEATURES, unnamed] })
    ).toEqual({
      types: [NO_TYPE_LABEL, 'NA', 'WPP'],
      subtypes: [NO_SUBTYPE_LABEL, 'Conservation', 'Recreation'],
    });
  });

  it('omits the missing-value choice when every feature has that value', () => {
    expect(
      boundaryFilterOptions({
        type: 'FeatureCollection',
        features: [PEMBINA, GOOSEBERRY],
      })
    ).toEqual({
      types: ['NA'],
      subtypes: ['Conservation', 'Recreation'],
    });
  });
});

describe('filterBoundaryFeatures', () => {
  it('matches NAME and OC_NAME without regard to case', () => {
    expect(filterBoundaryFeatures(FEATURES, '  PEMBINA  ', ALL_SELECTED).map((item) => item.id)).toEqual([
      1,
    ]);
    expect(filterBoundaryFeatures(FEATURES, 'natural area', ALL_SELECTED).map((item) => item.id)).toEqual([
      1, 3,
    ]);
  });

  it('keeps every feature when the search is blank', () => {
    expect(filterBoundaryFeatures(FEATURES, '   ', ALL_SELECTED)).toHaveLength(3);
  });

  it('treats several types as a match for any of them, and requires the subtype as well', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: new Set(['NA', 'WPP']),
      subtypes: new Set(['Conservation']),
    });

    expect(matched.map((item) => item.id)).toEqual([1]);
  });

  it('matches a feature with no subtype only when No Subtype is selected', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: null,
      subtypes: new Set([NO_SUBTYPE_LABEL]),
    });

    expect(matched.map((item) => item.id)).toEqual([2]);
  });

  it('matches a feature with no type only when No Type is selected', () => {
    const blank = feature(4, 'Blank', '', 'Conservation', null);
    const matched = filterBoundaryFeatures([PEMBINA, blank], '', {
      types: new Set([NO_TYPE_LABEL]),
      subtypes: null,
    });

    expect(matched.map((item) => item.id)).toEqual([4]);
  });

  it('hides a feature with no subtype when a subtype is selected', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: null,
      subtypes: new Set(['Recreation']),
    });

    expect(matched.map((item) => item.id)).toEqual([3]);
  });

  it('shows a feature with no subtype when every subtype is selected', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: new Set(['WPP']),
      subtypes: null,
    });

    expect(matched.map((item) => item.id)).toEqual([2]);
  });

  it('shows nothing when a category has no selected values', () => {
    expect(
      filterBoundaryFeatures(FEATURES, '', { types: new Set(), subtypes: null })
    ).toEqual([]);
  });
});

describe('category selection', () => {
  const options = ['NA', 'WPP'];

  it('can narrow the selection and then select every value again', () => {
    const withoutNa = toggleCategoryValue(null, options, 'NA');
    expect(Array.from(withoutNa ?? [])).toEqual(['WPP']);

    const none = toggleAllCategoryValues(null);
    expect(none?.size).toBe(0);

    expect(toggleAllCategoryValues(none)).toBeNull();
    expect(toggleCategoryValue(withoutNa, options, 'NA')).toBeNull();
  });
});
