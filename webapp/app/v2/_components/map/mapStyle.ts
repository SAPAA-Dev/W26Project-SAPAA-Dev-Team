import type {
  AddLayerObject,
  ExpressionSpecification,
  Map as MlMap,
} from 'maplibre-gl';
import type { InspectionStatus } from '@/lib/api/v1/types';

import { protomapsStyleUrl } from '@/lib/map/basemap';

export const STYLE_URL = protomapsStyleUrl();

/** The province itself: the first view before sites load. */
export const ALBERTA: [[number, number], [number, number]] = [
  [-120, 49],
  [-110, 60],
];

export const C = {
  canopy: '#122a1c',
  forest: '#1b3a2a',
  birch: '#f4f1e8',
  shale: '#5b6b61',
  lichen: '#7f9a86',
  sky: '#4f78b8',
  // Basemap
  land: '#ece8dc',
  park: '#dde4d1',
  wood: '#d3dcc7',
  ice: '#f7f6f1',
  built: '#e4dfd2',
  water: '#b5cfcc',
  waterLine: '#9cc0be',
  waterInk: '#356d6f',
  road: '#e0dbcc',
  roadCasing: '#d3cdbb',
  roadMajor: '#f6f3eb',
  border: '#a7a08b',
  label: '#4f5d55',
  labelStrong: '#2c3a32',
  halo: 'rgba(244, 241, 232, 0.9)',
  // Protected areas with no SAPAA site
  neutral: '#8f8c78',
};

/** Pin and polygon fills (the forest.css --st-* tokens). */
export const STATUS_FILL: Record<InspectionStatus, string> = {
  overdue: '#d08a55',
  due: '#e9b44c',
  recent: '#4f9d69',
  never: '#7f9a86',
};
/** Outlines: the --st-*-ink tokens, dark enough to read against birch. */
export const STATUS_LINE: Record<InspectionStatus, string> = {
  overdue: '#9a5a2b',
  due: '#8a6210',
  recent: '#2f6b43',
  never: '#4f6155',
};

// ---------------------------------------------------------------- basemap

/** First basemap label layer: our polygons go under it so place names stay readable. */
export function firstSymbolLayer(map: MlMap): string | undefined {
  return map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
}

// ---------------------------------------------------------------- overlays

export const SRC = {
  sites: 'sites',
  boundaries: 'boundaries',
  tracks: 'tracks',
  offlineMask: 'offline-mask',
  offlineRegions: 'offline-regions',
  me: 'me',
} as const;
export const LAYER = {
  boundaryFill: 'boundary-fill',
  boundaryLine: 'boundary-line',
  tracks: 'gpx-tracks',
  trackCasing: 'gpx-tracks-casing',
  offlineMask: 'offline-mask',
  offlineRegions: 'offline-regions',
  halo: 'site-halo',
  pins: 'site-pins',
  labels: 'site-labels',
  meHalo: 'me-halo',
  meDot: 'me-dot',
} as const;

const SELECTED: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];
const HOVER: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];

/** `st` is set on every feature we add: the site status, or 'none' for unlinked areas. */
const byStatus = (m: Record<InspectionStatus, string>, fallback: string): ExpressionSpecification => [
  'match',
  ['get', 'st'],
  'overdue',
  m.overdue,
  'due',
  m.due,
  'recent',
  m.recent,
  'never',
  m.never,
  fallback,
];

/** The orange of a GPX track, also drawn in the map key. */
export const TRACK_COLOR = '#c2410c';

/** An admin-chosen colour (`color`, #rrggbb, '' when unset) wins over the status colour. Pins keep their status colour. */
const chosen = (fallback: ExpressionSpecification): ExpressionSpecification => [
  'case',
  ['!=', ['get', 'color'], ''],
  ['get', 'color'],
  fallback,
];

/** Airbnb-style tiers: what needs a visit is big, what is fine is a quiet dot. */
const TIER: ExpressionSpecification = ['match', ['get', 'st'], 'overdue', 7.5, 'never', 6.5, 'due', 5.5, 3.75];
const BUMP: ExpressionSpecification = ['case', SELECTED, 4, HOVER, 2.5, 0];
/** Draw order: overdue on top, then never, due, recent. */
export const RANK: Record<InspectionStatus, number> = { overdue: 3, never: 2, due: 1, recent: 0 };

export const OVERLAY_LAYERS: { layer: AddLayerObject; belowLabels: boolean }[] = [
  {
    // Offline only: hides the basemap wherever no tiles were saved. The data is empty while online.
    belowLabels: true,
    layer: { id: LAYER.offlineMask, type: 'fill', source: SRC.offlineMask, paint: { 'fill-color': C.land, 'fill-opacity': 1 } },
  },
  {
    belowLabels: true,
    layer: {
      id: LAYER.boundaryFill,
      type: 'fill',
      source: SRC.boundaries,
      paint: {
        'fill-color': chosen(byStatus(STATUS_FILL, C.neutral)),
        'fill-opacity': ['case', SELECTED, 0.36, HOVER, 0.28, ['==', ['get', 'st'], 'none'], 0.08, 0.17],
      },
    },
  },
  {
    belowLabels: true,
    layer: {
      id: LAYER.boundaryLine,
      type: 'line',
      source: SRC.boundaries,
      paint: {
        'line-color': ['case', SELECTED, C.canopy, chosen(byStatus(STATUS_LINE, C.border))],
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, ['case', SELECTED, 2, 0.6], 11, ['case', SELECTED, 3, 1.6]],
        'line-opacity': ['case', ['==', ['get', 'st'], 'none'], 0.6, 0.9],
      },
    },
  },
  {
    belowLabels: true,
    layer: {
      id: LAYER.trackCasing,
      type: 'line',
      source: SRC.tracks,
      paint: { 'line-color': '#FFFFFF', 'line-width': 7 },
    },
  },
  {
    // A walked path, not a boundary: dashed orange over the outlines (US 2.0.1 AT2). Under the pins and labels.
    belowLabels: true,
    layer: {
      id: LAYER.tracks,
      type: 'line',
      source: SRC.tracks,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': TRACK_COLOR, 'line-width': 3, 'line-dasharray': [2, 1] },
    },
  },
  {
    // Outlines of the areas saved for offline use.
    belowLabels: true,
    layer: {
      id: LAYER.offlineRegions,
      type: 'line',
      source: SRC.offlineRegions,
      paint: { 'line-color': C.forest, 'line-width': 2, 'line-dasharray': [2, 2] },
    },
  },
  {
    belowLabels: false,
    layer: {
      id: LAYER.halo,
      type: 'circle',
      source: SRC.sites,
      filter: ['==', ['get', 'slug'], ''],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 17, 12, 26],
        'circle-color': byStatus(STATUS_FILL, C.neutral),
        'circle-opacity': 0.22,
        'circle-stroke-color': byStatus(STATUS_LINE, C.border),
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': 0.7,
      },
    },
  },
  {
    belowLabels: false,
    layer: {
      id: LAYER.pins,
      type: 'circle',
      source: SRC.sites,
      layout: { 'circle-sort-key': ['get', 'rank'] },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          ['+', TIER, BUMP],
          12,
          ['+', ['*', TIER, 1.5], BUMP],
        ],
        // Never inspected is a hollow ring: it reads without colour, as "nothing on record".
        'circle-color': ['match', ['get', 'st'], 'never', C.birch, byStatus(STATUS_FILL, C.neutral)],
        'circle-stroke-color': [
          'case',
          SELECTED,
          C.canopy,
          ['==', ['get', 'st'], 'never'],
          STATUS_LINE.never,
          C.birch,
        ],
        'circle-stroke-width': [
          'case',
          SELECTED,
          3,
          ['match', ['get', 'st'], 'overdue', 2.5, 'never', 2.75, 'due', 2, 1.25],
        ],
      },
    },
  },
  {
    belowLabels: false,
    layer: {
      id: LAYER.labels,
      type: 'symbol',
      source: SRC.sites,
      minzoom: 7.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 12, 13],
        'text-variable-anchor': ['top', 'bottom', 'right', 'left'],
        'text-radial-offset': 1.1,
        'text-justify': 'auto',
        'text-max-width': 9,
        'text-optional': true,
        'symbol-sort-key': ['-', 3, ['get', 'rank']],
      },
      paint: { 'text-color': C.canopy, 'text-halo-color': C.halo, 'text-halo-width': 1.6 },
    },
  },
  {
    belowLabels: false,
    layer: {
      id: LAYER.meHalo,
      type: 'circle',
      source: SRC.me,
      paint: { 'circle-radius': 18, 'circle-color': C.sky, 'circle-opacity': 0.18 },
    },
  },
  {
    belowLabels: false,
    layer: {
      id: LAYER.meDot,
      type: 'circle',
      source: SRC.me,
      paint: {
        'circle-radius': 7,
        'circle-color': C.sky,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    },
  },
];
