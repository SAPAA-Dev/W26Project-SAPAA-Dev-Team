import type { BoundaryFeature, BoundaryFeatureCollection } from '@/lib/map/boundaries';

export interface BoundaryFilterOptions {
  types: string[];
  subtypes: string[];
}

export const NO_TYPE_LABEL = 'No Type';
export const NO_SUBTYPE_LABEL = 'No Subtype';

export interface BoundaryFilterSelection {
  // null means every value in that category, including a feature with no type or no subtype.
  types: ReadonlySet<string> | null;
  subtypes: ReadonlySet<string> | null;
}

const EMPTY_COLLECTION: BoundaryFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === '';
}

function uniqueSorted(values: Array<string | null>): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    if (value === null) continue;
    const trimmed = value.trim();
    if (trimmed === '') continue;
    unique.add(trimmed);
  }
  return Array.from(unique).sort((left, right) => left.localeCompare(right));
}

function categoryOptions(values: Array<string | null>, missingLabel: string): string[] {
  const present = uniqueSorted(values);
  const hasMissing = values.some((value) => isBlank(value));
  if (!hasMissing || present.includes(missingLabel)) return present;
  return [missingLabel, ...present];
}

export function boundaryFilterOptions(
  boundaries: BoundaryFeatureCollection | null
): BoundaryFilterOptions {
  const features = boundaries?.features ?? [];
  return {
    types: categoryOptions(
      features.map((feature) => feature.properties.area_type),
      NO_TYPE_LABEL
    ),
    subtypes: categoryOptions(
      features.map((feature) => feature.properties.subtype),
      NO_SUBTYPE_LABEL
    ),
  };
}

function includesQuery(value: string | null, query: string): boolean {
  return value !== null && value.toLowerCase().includes(query);
}

// Inside one category, any selected value is enough. A feature must pass every category and the search.
function matchesCategory(
  value: string | null,
  selected: ReadonlySet<string> | null,
  missingLabel: string
): boolean {
  if (selected === null) return true;
  if (isBlank(value)) return selected.has(missingLabel);
  return selected.has(value?.trim() ?? '');
}

export function filterBoundaryFeatures(
  features: BoundaryFeature[],
  search: string,
  selection: BoundaryFilterSelection
): BoundaryFeature[] {
  const query = search.trim().toLowerCase();

  return features.filter((feature) => {
    const properties = feature.properties;
    const matchesSearch =
      query === '' ||
      includesQuery(properties.name, query) ||
      includesQuery(properties.oc_name, query);

    return (
      matchesSearch &&
      matchesCategory(properties.area_type, selection.types, NO_TYPE_LABEL) &&
      matchesCategory(properties.subtype, selection.subtypes, NO_SUBTYPE_LABEL)
    );
  });
}

export function filterBoundaryCollection(
  boundaries: BoundaryFeatureCollection | null,
  search: string,
  selection: BoundaryFilterSelection
): BoundaryFeatureCollection {
  if (boundaries === null) return EMPTY_COLLECTION;
  return {
    type: 'FeatureCollection',
    features: filterBoundaryFeatures(boundaries.features, search, selection),
  };
}

export function toggleCategoryValue(
  selected: ReadonlySet<string> | null,
  options: readonly string[],
  value: string
): ReadonlySet<string> | null {
  const next = new Set(selected === null ? options : selected);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  if (next.size === options.length) return null;
  return next;
}

export function toggleAllCategoryValues(
  selected: ReadonlySet<string> | null
): ReadonlySet<string> | null {
  return selected === null ? new Set() : null;
}
