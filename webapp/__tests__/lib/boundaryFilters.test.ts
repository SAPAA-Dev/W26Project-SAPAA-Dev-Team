import {
  ACTIVE_STATUS_LABEL,
  INACTIVE_STATUS_LABEL,
  LINKED_LABEL,
  NO_STATUS_LABEL,
  NO_SUBTYPE_LABEL,
  NO_TYPE_LABEL,
  SITE_BOUNDARY_OPTIONS,
  UNKNOWN_COUNTY_LABEL,
  UNLINKED_LABEL,
  boundaryFilterOptions,
  countyFilterOptions,
  defaultMapStatuses,
  filterBoundaryFeatures,
  matchesActiveFilter,
  matchesCountyFilter,
  matchesSiteBoundaryFilter,
  toggleAllCategoryValues,
  toggleCategoryValue,
} from '@/lib/map/boundaryFilters';
import type { BoundaryFeature } from '@/lib/map/boundaries';

function feature(
  id: number,
  name: string,
  areaType: string,
  subtype: string | null,
  ocName: string | null,
  county: string | null = null,
  isActive: boolean | null = null
): BoundaryFeature {
  return {
    type: 'Feature',
    id,
    properties: {
      protected_area_id: id,
      name,
      fid: id,
      area_type: areaType,
      boundary_color: null,
      subtype,
      iucn: null,
      oc_no: null,
      acres: null,
      hectares: null,
      oc_date: null,
      date_est: null,
      oc_name: ocName,
      notes: null,
      county,
      is_active: isActive,
      site_name: null,
      last_inspection_date: null,
    },
    geometry: { type: 'MultiPolygon', coordinates: [] },
  };
}

const PEMBINA = feature(1, 'Pembina River', 'NA', 'Conservation', 'Pembina River Natural Area');
const JASPER = feature(2, 'Jasper', 'WPP', null, 'Jasper National Park');
const GOOSEBERRY = feature(3, 'Gooseberry', 'NA', 'Recreation', 'Gooseberry Natural Area');
const FEATURES = [PEMBINA, JASPER, GOOSEBERRY];

const ALL_SELECTED = { types: null, subtypes: null, counties: null, statuses: null };

describe('boundaryFilterOptions (US 2.0.6)', () => {
  it('lists each type and subtype once, in order, and adds a choice for a missing value', () => {
    const unnamed = feature(4, 'Blank', '  ', null, null);
    expect(
      boundaryFilterOptions({ type: 'FeatureCollection', features: [...FEATURES, unnamed] })
    ).toEqual({
      types: [NO_TYPE_LABEL, 'NA', 'WPP'],
      subtypes: [NO_SUBTYPE_LABEL, 'Conservation', 'Recreation'],
      counties: [UNKNOWN_COUNTY_LABEL],
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
      counties: [UNKNOWN_COUNTY_LABEL],
    });
  });
});

describe('filterBoundaryFeatures (US 2.0.6)', () => {
  it('matches NAME and OC_NAME without regard to case (2.0.6 AT1)', () => {
    expect(filterBoundaryFeatures(FEATURES, '  PEMBINA  ', ALL_SELECTED).map((item) => item.id)).toEqual([
      1,
    ]);
    expect(filterBoundaryFeatures(FEATURES, 'natural area', ALL_SELECTED).map((item) => item.id)).toEqual([
      1, 3,
    ]);
  });

  it('keeps every feature when the search is blank (2.0.6 AT2)', () => {
    expect(filterBoundaryFeatures(FEATURES, '   ', ALL_SELECTED)).toHaveLength(3);
  });

  it('treats several types as a match for any of them, and requires the subtype as well (2.0.6 AT1)', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: new Set(['NA', 'WPP']),
      subtypes: new Set(['Conservation']),
      counties: null,
      statuses: null,
    });

    expect(matched.map((item) => item.id)).toEqual([1]);
  });

  it('matches a feature with no subtype only when No Subtype is selected (2.0.6 AT1)', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: null,
      subtypes: new Set([NO_SUBTYPE_LABEL]),
      counties: null,
      statuses: null,
    });

    expect(matched.map((item) => item.id)).toEqual([2]);
  });

  it('matches a feature with no type only when No Type is selected (2.0.6 AT1)', () => {
    const blank = feature(4, 'Blank', '', 'Conservation', null);
    const matched = filterBoundaryFeatures([PEMBINA, blank], '', {
      types: new Set([NO_TYPE_LABEL]),
      subtypes: null,
      counties: null,
      statuses: null,
    });

    expect(matched.map((item) => item.id)).toEqual([4]);
  });

  it('hides a feature with no subtype when a subtype is selected (2.0.6 AT1)', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: null,
      subtypes: new Set(['Recreation']),
      counties: null,
      statuses: null,
    });

    expect(matched.map((item) => item.id)).toEqual([3]);
  });

  it('shows a feature with no subtype when every subtype is selected (2.0.6 AT2)', () => {
    const matched = filterBoundaryFeatures(FEATURES, '', {
      types: new Set(['WPP']),
      subtypes: null,
      counties: null,
      statuses: null,
    });

    expect(matched.map((item) => item.id)).toEqual([2]);
  });

  it('shows nothing when a category has no selected values (2.0.6 AT1)', () => {
    expect(
      filterBoundaryFeatures(FEATURES, '', { types: new Set(), subtypes: null, counties: null, statuses: null })
    ).toEqual([]);
  });

  it('uses Unknown county when a protected area has no county (2.0.6 AT1)', () => {
    const named = feature(8, 'Pembina River', 'NA', 'Conservation', null, 'Parkland', true);
    expect(countyFilterOptions([named.properties.county, null])).toEqual([UNKNOWN_COUNTY_LABEL, 'Parkland']);

    const matched = filterBoundaryFeatures([named, PEMBINA], '', {
      types: null,
      subtypes: null,
      counties: new Set([UNKNOWN_COUNTY_LABEL]),
      statuses: null,
    });

    expect(matched.map((item) => item.id)).toEqual([1]);
  });

  it('hides inactive sites unless Inactive is selected (2.0.6 AT2)', () => {
    const active = feature(1, 'Pembina River', 'NA', 'Conservation', null, 'Parkland', true);
    const inactive = feature(2, 'Jasper', 'WPP', null, null, 'Parkland', false);
    const unlinked = feature(3, 'Gooseberry', 'NA', 'Recreation', null, null, null);
    const rows = [active, inactive, unlinked];

    const visible = filterBoundaryFeatures(rows, '', {
      types: null,
      subtypes: null,
      counties: null,
      statuses: defaultMapStatuses(),
    });
    expect(visible.map((item) => item.id)).toEqual([1, 3]);

    const onlyInactive = filterBoundaryFeatures(rows, '', {
      types: null,
      subtypes: null,
      counties: null,
      statuses: new Set([INACTIVE_STATUS_LABEL]),
    });
    expect(onlyInactive.map((item) => item.id)).toEqual([2]);
    expect(defaultMapStatuses().has(ACTIVE_STATUS_LABEL)).toBe(true);
    expect(defaultMapStatuses().has(NO_STATUS_LABEL)).toBe(true);
    expect(defaultMapStatuses().has(INACTIVE_STATUS_LABEL)).toBe(false);
  });
});

describe('list filters (US 2.0.6)', () => {
  it('matches a site with no county only for Unknown county (2.0.6 AT1)', () => {
    expect(matchesCountyFilter(null, new Set([UNKNOWN_COUNTY_LABEL]))).toBe(true);
    expect(matchesCountyFilter('Parkland', new Set([UNKNOWN_COUNTY_LABEL]))).toBe(false);
    expect(matchesCountyFilter('Parkland', null)).toBe(true);
  });

  it('matches active and inactive site cards (2.0.6 AT1)', () => {
    expect(matchesActiveFilter(true, new Set([ACTIVE_STATUS_LABEL]))).toBe(true);
    expect(matchesActiveFilter(false, new Set([ACTIVE_STATUS_LABEL]))).toBe(false);
    expect(matchesActiveFilter(false, null)).toBe(true);
  });
});

describe('site boundary filter (US 6.0.1 AT4)', () => {
  it('offers Linked and Unlinked as one separate section', () => {
    expect(SITE_BOUNDARY_OPTIONS).toEqual([LINKED_LABEL, UNLINKED_LABEL]);
  });

  it('matches a site by its protected area link', () => {
    expect(matchesSiteBoundaryFilter(9, null)).toBe(true);
    expect(matchesSiteBoundaryFilter(null, null)).toBe(true);
    expect(matchesSiteBoundaryFilter(undefined, null)).toBe(true);

    expect(matchesSiteBoundaryFilter(9, new Set([LINKED_LABEL]))).toBe(true);
    expect(matchesSiteBoundaryFilter(9, new Set([UNLINKED_LABEL]))).toBe(false);
    expect(matchesSiteBoundaryFilter(null, new Set([UNLINKED_LABEL]))).toBe(true);
    expect(matchesSiteBoundaryFilter(undefined, new Set([UNLINKED_LABEL]))).toBe(true);
    expect(matchesSiteBoundaryFilter(null, new Set([LINKED_LABEL]))).toBe(false);

    expect(matchesSiteBoundaryFilter(9, new Set())).toBe(false);
    expect(matchesSiteBoundaryFilter(null, new Set())).toBe(false);
  });
});

describe('category selection (US 2.0.6)', () => {
  const options = ['NA', 'WPP'];

  it('can narrow the selection and then select every value again (2.0.6 AT2)', () => {
    const withoutNa = toggleCategoryValue(null, options, 'NA');
    expect(Array.from(withoutNa ?? [])).toEqual(['WPP']);

    const none = toggleAllCategoryValues(null);
    expect(none?.size).toBe(0);

    expect(toggleAllCategoryValues(none)).toBeNull();
    expect(toggleCategoryValue(withoutNa, options, 'NA')).toBeNull();
  });

  it('US 2.0.6: does not treat a value from the other view as one of these options', () => {
    // 'Banff' was picked in the card view and is not a map option. 'WPP' is still off.
    const selection = toggleCategoryValue(new Set(['Banff']), ['NA', 'WPP'], 'NA');

    expect(selection).not.toBeNull();
    expect(Array.from(selection ?? []).sort()).toEqual(['Banff', 'NA']);
  });
});
