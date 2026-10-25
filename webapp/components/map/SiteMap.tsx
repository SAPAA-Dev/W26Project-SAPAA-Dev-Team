'use client';

import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Popup } from 'maplibre-gl';
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/map/enableMapLibreWorker';
import { Download, KeyRound } from 'lucide-react';
import {
  DEFAULT_BOUNDARY_FILL_COLOR,
  DEFAULT_BOUNDARY_OUTLINE_COLOR,
  boundaryBounds,
} from '@/lib/map/boundaries';
import type {
  BoundaryColorRequest,
  BoundaryColorResult,
  BoundaryFeature,
  BoundaryFeatureCollection,
} from '@/lib/map/boundaries';
import type { GpxTrackLineFeatureCollection } from '@/lib/map/gpxTrack';
import { listRegions } from '@/lib/map/offline/tileCache';
import type { SavedRegion } from '@/lib/map/offline/tileCache';
import { mergeToDisjointRectangles } from '@/lib/map/offline/tileMath';
import {
  OFFLINE_MISS_MARKER,
  makeTransformRequest,
  releaseOfflineProtocol,
  retainOfflineProtocol,
} from '@/components/map/offlineProtocol';
import OfflineSavePanel from '@/components/map/OfflineSavePanel';

const STYLE_URL = 'https://api.protomaps.com/styles/v5/light/en.json';

// Alberta's provincial extent. The map fits this box on load, so the whole province
// and every boundary are visible at the widest practical zoom.
const ALBERTA_BOUNDS: [[number, number], [number, number]] = [
  [-120.0, 49.0],
  [-110.0, 60.0],
];
const VIEW_PADDING = 32;

const SOURCE_ID = 'protected-areas';
const FILL_LAYER_ID = 'protected-areas-fill';
const OUTLINE_LAYER_ID = 'protected-areas-outline';

// The track reads as a path a steward walked, not a boundary: a dashed orange
// line over the solid green outline (US 2.0.1 AT2).
const GPX_SOURCE_ID = 'gpx-tracks';
const GPX_LINE_LAYER_ID = 'gpx-tracks-line';
const GPX_LINE_COLOR = '#C2410C';
const GPX_LINE_WIDTH = 3;
const GPX_LINE_DASHARRAY = [2, 1];
const EMPTY_TRACK_COLLECTION = { type: 'FeatureCollection' as const, features: [] };

const OFFLINE_REGIONS_SOURCE_ID = 'offline-regions';
const OFFLINE_REGIONS_LAYER_ID = 'offline-regions-outline';
const OFFLINE_REGIONS_COLOR = '#356B43';

const OFFLINE_MASK_SOURCE_ID = 'offline-mask';
const OFFLINE_MASK_LAYER_ID = 'offline-mask-fill';
const OFFLINE_MASK_COLOR = '#F7F2EA';

const MISSING_TILE_FLUSH_MS = 500;

// The hover state is a boolean on the feature, so the map repaints one polygon
// instead of every polygon.
const HOVERED: ['boolean', ['feature-state', 'hover'], boolean] = [
  'boolean',
  ['feature-state', 'hover'],
  false,
];

// A color from the database wins. A boundary without one keeps the original green.
type BoundaryColorExpression = ['coalesce', ['get', string], string];
const BOUNDARY_FILL_COLOR: BoundaryColorExpression = [
  'coalesce',
  ['get', 'boundary_color'],
  DEFAULT_BOUNDARY_FILL_COLOR,
];
const BOUNDARY_OUTLINE_COLOR: BoundaryColorExpression = [
  'coalesce',
  ['get', 'boundary_color'],
  DEFAULT_BOUNDARY_OUTLINE_COLOR,
];

// The selected site carries its own state, so a selection change repaints two
// polygons: the old one loses the highlight, the new one gains it.
const SELECTED: ['boolean', ['feature-state', 'selected'], boolean] = [
  'boolean',
  ['feature-state', 'selected'],
  false,
];

// Values a developer leaves in .env.local before the real key arrives.
const PLACEHOLDER_KEYS = new Set([
  'your_api_key',
  'your-protomaps-key',
  'your-protomaps-api-key',
  'changeme',
]);

const BOX_CLASSES =
  'h-[70vh] min-h-[420px] w-full rounded-2xl border-2 border-[#E4EBE4] overflow-hidden bg-white';

function readApiKey(): string | null {
  const value = process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY?.trim();
  if (!value || PLACEHOLDER_KEYS.has(value.toLowerCase())) return null;
  return value;
}

interface SiteMapProps {
  /** Boundaries to draw. The page loads them when the map view opens. */
  boundaries?: BoundaryFeatureCollection | null;
  boundariesLoading?: boolean;
  boundariesError?: string | null;
  /** The area the user picked from the search matches. The map fits its bounds. */
  focusedArea?: BoundaryFeature | null;
  /** Admins get the color control in the click popup. The server action checks the role too. */
  canEditBoundaryColors?: boolean;
  onSetBoundaryColor?: (request: BoundaryColorRequest) => Promise<BoundaryColorResult>;
  /** The protected area id of the selected site. Only that site is highlighted. */
  selectedAreaId?: number | null;
  /** Fires when the user clicks a boundary. The parent owns the selection. */
  onBoundarySelect?: (areaId: number) => void;
  /** GPX tracks of the selected site, drawn as lines over the boundaries. */
  gpxTracks?: GpxTrackLineFeatureCollection | null;
  /** Set when the track load failed, so an empty map is not mistaken for success. */
  gpxTracksError?: string | null;
}

interface BoundaryColorEditor {
  onSet: (request: BoundaryColorRequest) => Promise<BoundaryColorResult>;
  // The map source is replaced when the page applies the saved color. This flag keeps
  // the open popup for that one update.
  preservePopup: () => void;
  releasePopup: () => void;
}

function readProperty(properties: unknown, key: string): string | null {
  if (properties === null || typeof properties !== 'object') return null;
  const value = (properties as Record<string, unknown>)[key];
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function readProtectedAreaId(properties: unknown): number | null {
  const text = readProperty(properties, 'protected_area_id');
  if (text === null) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// The five rows the card shows at rest. The rest of the export sits behind the
// expand control, so the card stays short on the map.
const BOUNDARY_SUMMARY_FIELDS: ReadonlyArray<PopupField> = [
  { label: 'FID', key: 'fid' },
  { label: 'IUCN', key: 'iucn' },
  { label: 'Order in Council', key: 'oc_no' },
  { label: 'Area', key: 'hectares', unit: ' ha', measurement: true },
  { label: 'Established', key: 'date_est' },
];

const BOUNDARY_EXTRA_FIELDS: ReadonlyArray<PopupField> = [
  { label: 'Name', key: 'name' },
  { label: 'Acres', key: 'acres', measurement: true },
  { label: 'Order date', key: 'oc_date' },
  { label: 'Order name', key: 'oc_name' },
];

// The same format as the Site card, so the popup and the card show one date (US 2.0.8 AT2).
const INSPECTION_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const SECTION_LABEL_CLASS = 'text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7A6B]';
const SECTION_TITLE_CLASS = 'mt-1 text-xl font-bold leading-tight text-[#254431]';
const DETAIL_ROW_CLASS =
  'flex gap-3 border-b border-[#DCE4D4] py-1.5 text-xs leading-5 last:border-b-0';
const DETAIL_LABEL_CLASS = 'w-[7.5rem] shrink-0 font-bold text-[#254431]';

interface PopupField {
  label: string;
  key: string;
  unit?: string;
  measurement?: boolean;
}

/**
 * The measurement columns hold long decimals from the export. The card shows two
 * decimals so a number like 106.737077 reads as 106.74 ha.
 */
function readPopupValue(properties: unknown, field: PopupField): string | null {
  const value = readProperty(properties, field.key);
  if (value === null) return null;

  const number = Number(value);
  const text =
    field.measurement === true && Number.isFinite(number)
      ? number.toLocaleString('en-US', { maximumFractionDigits: 2 })
      : value;
  return `${text}${field.unit ?? ''}`;
}

function createSectionLabel(text: string): HTMLElement {
  const label = document.createElement('div');
  label.className = SECTION_LABEL_CLASS;
  label.textContent = text;
  return label;
}

function createTitle(text: string): HTMLElement {
  const title = document.createElement('div');
  title.className = SECTION_TITLE_CLASS;
  title.style.fontFamily = 'var(--font-heading)';
  title.textContent = text;
  return title;
}

function createDetailRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.className = DETAIL_ROW_CLASS;
  row.dataset.field = label;

  const term = document.createElement('span');
  term.className = DETAIL_LABEL_CLASS;
  term.textContent = label;

  const description = document.createElement('span');
  description.className = 'min-w-0 flex-1 text-[#254431]';
  description.dataset.fieldValue = 'true';
  description.textContent = value;

  row.append(term, description);
  return row;
}

function createBadge(text: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className =
    'rounded-full bg-[#E1E8DA] px-3 py-1 text-xs font-semibold text-[#254431]';
  badge.dataset.boundaryBadge = 'true';
  badge.textContent = text;
  return badge;
}

function createChevron(): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg';
  const chevron = document.createElementNS(namespace, 'svg');
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('aria-hidden', 'true');
  chevron.setAttribute('class', 'h-4 w-4 shrink-0 transition-transform');

  const path = document.createElementNS(namespace, 'path');
  path.setAttribute('d', 'm6 9 6 6 6-6');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  chevron.appendChild(path);
  return chevron;
}

function createSiteSection(properties: unknown): HTMLElement {
  const section = document.createElement('div');
  section.className = 'bg-white px-5 pb-5 pt-5';

  const siteName = readProperty(properties, 'site_name');
  const county = readProperty(properties, 'county');
  const lastInspectionDate = readProperty(properties, 'last_inspection_date');
  section.dataset.siteInfo = siteName === null ? 'unlinked' : 'linked';

  section.appendChild(createSectionLabel('SAPAA SITE'));

  if (siteName === null) {
    const unlinked = document.createElement('div');
    unlinked.className = 'mt-1 text-base font-semibold text-[#7A8075]';
    unlinked.dataset.noLinkedSite = 'true';
    unlinked.textContent = 'No linked site';
    section.appendChild(unlinked);
    return section;
  }

  const title = createTitle(siteName);
  title.dataset.siteName = 'true';
  section.appendChild(title);

  const siteInfo = document.createElement('div');
  siteInfo.className = 'mt-3';
  if (county !== null) {
    const countyRow = createDetailRow('County', county);
    countyRow.dataset.siteCounty = 'true';
    siteInfo.appendChild(countyRow);
  }

  const inspectionRow = createDetailRow(
    'Last inspection',
    lastInspectionDate === null
      ? 'Never inspected'
      : new Date(lastInspectionDate).toLocaleDateString('en-US', INSPECTION_DATE_FORMAT)
  );
  inspectionRow.dataset.lastInspection = 'true';
  siteInfo.appendChild(inspectionRow);
  section.appendChild(siteInfo);

  const viewSite = document.createElement('a');
  viewSite.href = `/detail/${encodeURIComponent(siteName)}`;
  viewSite.textContent = 'View site & SIRs';
  viewSite.dataset.viewSirs = 'true';
  viewSite.className =
    'mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-[#356B43] px-4 text-sm font-bold text-white transition-colors hover:bg-[#254431] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356B43]';
  section.appendChild(viewSite);

  return section;
}

function createBoundarySection(
  properties: unknown,
  colorEditor?: BoundaryColorEditor
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'border-t border-[#E4EBE4] bg-[#F1F5EB] px-5 pb-4 pt-4';

  section.appendChild(createSectionLabel('PROTECTED AREA BOUNDARY'));

  // The long order name reads better as the heading; the short export name is in the details.
  const boundaryName = readProperty(properties, 'oc_name') ?? readProperty(properties, 'name');
  const title = createTitle(boundaryName ?? 'Protected area');
  title.dataset.boundaryName = 'true';
  section.appendChild(title);

  const badges = document.createElement('div');
  badges.className = 'mt-2 flex flex-wrap gap-2';
  for (const key of ['area_type', 'subtype']) {
    const value = readProperty(properties, key);
    if (value !== null) badges.appendChild(createBadge(value));
  }
  if (badges.childElementCount > 0) section.appendChild(badges);

  const summary = document.createElement('div');
  summary.className = 'mt-3';
  summary.dataset.boundarySummary = 'true';
  for (const field of BOUNDARY_SUMMARY_FIELDS) {
    const value = readPopupValue(properties, field);
    if (value !== null) summary.appendChild(createDetailRow(field.label, value));
  }
  if (summary.childElementCount > 0) section.appendChild(summary);

  const extra = document.createElement('div');
  extra.className = 'hidden';
  extra.dataset.boundaryExtra = 'true';
  for (const field of BOUNDARY_EXTRA_FIELDS) {
    const value = readPopupValue(properties, field);
    // The heading already shows the order name when the export has one.
    if (value === null || (field.key === 'oc_name' && value === boundaryName)) continue;
    extra.appendChild(createDetailRow(field.label, value));
  }

  const notes = readProperty(properties, 'notes');
  if (notes !== null) {
    const notesBlock = document.createElement('div');
    notesBlock.className = 'mt-3';

    const heading = document.createElement('div');
    heading.className = SECTION_LABEL_CLASS;
    heading.dataset.notesHeading = 'true';
    heading.textContent = 'NOTES';
    notesBlock.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'mt-1 whitespace-pre-wrap text-xs leading-5 text-[#254431]';
    body.dataset.notesBody = 'true';
    body.textContent = notes;
    notesBlock.appendChild(body);

    extra.appendChild(notesBlock);
  }

  if (extra.childElementCount > 0) {
    const expand = document.createElement('button');
    expand.type = 'button';
    expand.dataset.boundaryExpand = 'true';
    expand.setAttribute('aria-expanded', 'false');
    expand.className =
      'mt-1 flex w-full items-center justify-between rounded-lg py-1.5 text-left text-xs font-bold text-[#254431] hover:bg-[#E1E8DA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356B43]';

    const expandLabel = document.createElement('span');
    expandLabel.textContent = 'View all boundary details';

    const chevron = createChevron();
    expand.append(expandLabel, chevron);

    expand.addEventListener('click', () => {
      const willExpand = extra.classList.contains('hidden');
      extra.classList.toggle('hidden', !willExpand);
      expand.setAttribute('aria-expanded', String(willExpand));
      expandLabel.textContent = willExpand
        ? 'Hide boundary details'
        : 'View all boundary details';
      chevron.classList.toggle('rotate-180', willExpand);
    });

    section.appendChild(expand);
    section.appendChild(extra);
  }

  // The color control is separate from the details control, so it is present even
  // when the export has no extra boundary fields.
  if (colorEditor !== undefined) {
    section.appendChild(createColorSection(properties, colorEditor));
  }

  return section;
}

const COLOR_BUTTON_CLASS =
  'mt-2 flex h-8 w-full items-center justify-center rounded-lg px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356B43]';

function createColorSection(properties: unknown, editor: BoundaryColorEditor): HTMLElement {
  const section = document.createElement('div');
  section.className = 'mt-1';

  const expand = document.createElement('button');
  expand.type = 'button';
  expand.dataset.boundaryColorExpand = 'true';
  expand.setAttribute('aria-expanded', 'false');
  expand.className =
    'flex w-full items-center justify-between rounded-lg py-1.5 text-left text-xs font-bold text-[#254431] hover:bg-[#E1E8DA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356B43]';

  const expandLabel = document.createElement('span');
  expandLabel.textContent = 'Set Color';

  const chevron = createChevron();
  expand.append(expandLabel, chevron);

  const body = document.createElement('div');
  body.className = 'mt-1 hidden';
  body.dataset.boundaryColorBody = 'true';

  const inputLabel = document.createElement('label');
  inputLabel.className = 'flex items-center gap-3 text-xs font-semibold text-[#254431]';

  const input = document.createElement('input');
  input.type = 'color';
  input.dataset.boundaryColorInput = 'true';
  input.setAttribute('aria-label', 'Boundary color');
  input.className =
    'h-8 w-12 shrink-0 cursor-pointer rounded border border-[#DCE4D4] bg-white p-0.5';

  const storedColor = readProperty(properties, 'boundary_color');
  input.value =
    storedColor !== null && /^#[0-9A-Fa-f]{6}$/.test(storedColor)
      ? storedColor
      : DEFAULT_BOUNDARY_FILL_COLOR;

  const inputText = document.createElement('span');
  inputText.textContent = 'Boundary colour';
  inputLabel.append(input, inputText);

  const protectedAreaId = readProtectedAreaId(properties);
  const areaType = readProperty(properties, 'area_type')?.trim() ?? '';

  const siteButton = document.createElement('button');
  siteButton.type = 'button';
  siteButton.dataset.boundaryColorSite = 'true';
  siteButton.textContent = 'Set for this site';
  siteButton.className = `${COLOR_BUTTON_CLASS} bg-[#356B43] text-white hover:bg-[#254431]`;

  const typeButton = document.createElement('button');
  typeButton.type = 'button';
  typeButton.dataset.boundaryColorType = 'true';
  typeButton.textContent = 'Set for site type';
  typeButton.className = `${COLOR_BUTTON_CLASS} border border-[#DCE4D4] bg-white text-[#254431] hover:bg-[#E1E8DA]`;

  const hint = document.createElement('p');
  hint.className = 'mt-2 text-[10px] leading-4 text-[#6B7A6B]';
  hint.textContent = 'A type color replaces individual colors of that type.';

  const status = document.createElement('div');
  status.dataset.boundaryColorStatus = 'true';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.className = 'mt-1 min-h-4 text-[10px] leading-4';

  let pending = false;
  const syncDisabled = () => {
    siteButton.disabled = pending || protectedAreaId === null;
    typeButton.disabled = pending || areaType === '';
  };
  syncDisabled();

  const submit = async (scope: 'site' | 'type') => {
    if (pending) return;
    if (scope === 'site' && protectedAreaId === null) return;
    if (scope === 'type' && areaType === '') return;

    pending = true;
    syncDisabled();
    status.style.color = '';
    status.textContent = 'Saving…';

    // The successful write updates the page state, which replaces the map source.
    // The flag keeps the open popup in place for that one update.
    editor.preservePopup();
    let result: BoundaryColorResult;
    try {
      result = await editor.onSet({
        scope,
        protectedAreaId: protectedAreaId ?? 0,
        areaType: scope === 'type' ? areaType : null,
        color: input.value,
      });
    } catch {
      result = { ok: false, error: 'The color could not be saved.' };
    }
    pending = false;
    syncDisabled();

    if (result.ok) {
      status.style.color = '#356B43';
      status.textContent = 'Saved.';
      return;
    }

    // No state change follows a failure, so the flag must not hide a later filter change.
    editor.releasePopup();
    status.style.color = '#B91C1C';
    status.textContent = result.error;
  };

  siteButton.addEventListener('click', () => void submit('site'));
  typeButton.addEventListener('click', () => void submit('type'));

  expand.addEventListener('click', () => {
    const willExpand = body.classList.contains('hidden');
    body.classList.toggle('hidden', !willExpand);
    expand.setAttribute('aria-expanded', String(willExpand));
    expandLabel.textContent = willExpand ? 'Hide color' : 'Set Color';
    chevron.classList.toggle('rotate-180', willExpand);
  });

  body.append(inputLabel, siteButton, typeButton, hint, status);
  section.append(expand, body);
  return section;
}

/**
 * Builds the popup body from DOM nodes, not from an HTML string. The values come from
 * an imported file, and a node cannot carry markup.
 *
 * The card keeps the linked site and the protected-area boundary apart: the site name
 * comes from sites_pa.namesite, and the boundary name comes from protected_areas.
 */
function createPopupContent(
  properties: unknown,
  colorEditor?: BoundaryColorEditor
): HTMLElement {
  const container = document.createElement('div');
  container.className =
    'max-h-[70vh] w-[min(320px,80vw)] overflow-y-auto bg-white font-sans';

  container.appendChild(createSiteSection(properties));
  container.appendChild(createBoundarySection(properties, colorEditor));

  return container;
}

export default function SiteMap({
  boundaries,
  boundariesLoading,
  boundariesError,
  focusedArea,
  canEditBoundaryColors,
  onSetBoundaryColor,
  selectedAreaId,
  onBoundarySelect,
  gpxTracks,
  gpxTracksError,
}: SiteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const hoveredFeatureRef = useRef<string | number | null>(null);
  // Set before a color write and consumed by the next boundaries update.
  const preservePopupRef = useRef(false);
  const selectedAreaIdRef = useRef<number | null>(null);
  const missingTilesRef = useRef(0);
  const apiKey = readApiKey();
  const styleUrl = `${STYLE_URL}?key=${encodeURIComponent(apiKey ?? '')}`;

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  // transformRequest reads this ref, so the callback stays current without a new Map.
  const onlineRef = useRef(isOnline);
  const [missingTiles, setMissingTiles] = useState(0);
  const [saveMode, setSaveMode] = useState(false);
  const [savedRegions, setSavedRegions] = useState<SavedRegion[]>(() => listRegions());
  // The panel render needs the instance, and a ref read during render is not allowed.
  const [map, setMap] = useState<MapLibreMap | null>(null);

  // A style reload is the only way to move in-flight resource requests to the
  // other path, so the map swaps the style when the connection mode flips.
  useEffect(() => {
    const handleConnectionChange = () => {
      const online = typeof navigator === 'undefined' ? true : navigator.onLine;
      const previous = onlineRef.current;
      onlineRef.current = online;
      setIsOnline(online);
      if (online !== previous) mapRef.current?.setStyle(styleUrl);
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, [styleUrl]);

  // The boundaries effect binds the click handler once for the life of the map, so
  // the parent callback reaches it through a ref instead of a new listener set.
  const onBoundarySelectRef = useRef(onBoundarySelect);
  useEffect(() => {
    onBoundarySelectRef.current = onBoundarySelect;
  }, [onBoundarySelect]);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    retainOfflineProtocol();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: styleUrl,
      // MapLibre fits these bounds when it builds the map. A fixed zoom cannot show
      // the full province on every container height.
      bounds: ALBERTA_BOUNDS,
      fitBoundsOptions: { padding: VIEW_PADDING },
      renderWorldCopies: false,
      transformRequest: makeTransformRequest(() => onlineRef.current),
    });
    mapRef.current = map;
    setMap(map);

    popupRef.current = new Popup({
      closeButton: false,
      closeOnClick: true,
      maxWidth: '360px',
      className: 'site-detail-popup',
    });

    // The canvas keeps the size it had when the toggle revealed the map, so a
    // later layout change (a window resize, a wrapped toolbar) needs a resize call.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      hoveredFeatureRef.current = null;
      mapRef.current = null;
      setMap(null);
      observer.disconnect();
      // map.remove() also drops every source, layer and listener on the map, so
      // there is nothing else to detach here.
      releaseOfflineProtocol();
      map.remove();
    };
  }, [apiKey, styleUrl]);

  // The boundaries arrive after the map exists, so the data lives in its own effect.
  // The first set builds the source and the layers; a later set only replaces the data,
  // which keeps the pan, the zoom and the WebGL context.
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    const clearHover = () => {
      const hovered = hoveredFeatureRef.current;
      if (hovered === null) return;
      map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: false });
      hoveredFeatureRef.current = null;
    };

    const handleMouseMove = (event: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';

      const feature = event.features?.[0];
      if (feature === undefined || feature.id === undefined) return;
      if (hoveredFeatureRef.current === feature.id) return;

      clearHover();
      hoveredFeatureRef.current = feature.id;
      map.setFeatureState({ source: SOURCE_ID, id: feature.id }, { hover: true });
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      clearHover();
    };

    const handleClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const popup = popupRef.current;
      if (feature === undefined || popup === null) return;

      const colorEditor: BoundaryColorEditor | undefined =
        canEditBoundaryColors === true && onSetBoundaryColor !== undefined
          ? {
              onSet: onSetBoundaryColor,
              preservePopup: () => {
                preservePopupRef.current = true;
              },
              releasePopup: () => {
                preservePopupRef.current = false;
              },
            }
          : undefined;

      popup
        .setLngLat(event.lngLat)
        .setDOMContent(createPopupContent(feature.properties, colorEditor))
        .addTo(map);
      // The source keeps the protected area ids of the collection, so the id is a number.
      if (feature.id !== undefined) onBoundarySelectRef.current?.(Number(feature.id));
    };

    // Layer listeners survive a style swap, so they are registered once for the
    // life of the map. Re-adding them on every style.load would stack duplicates.
    map.on('mousemove', FILL_LAYER_ID, handleMouseMove);
    map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave);
    map.on('click', FILL_LAYER_ID, handleClick);

    const applyBoundaries = () => {
      if (!boundaries) return;

      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        clearHover();
        map.getCanvas().style.cursor = '';
        const preservePopup = preservePopupRef.current;
        preservePopupRef.current = false;
        if (!preservePopup) popupRef.current?.remove();
        source.setData(boundaries);
        return;
      }

      if (boundaries.features.length === 0) return;

      // generateId would replace the protected area id with the feature index.
      map.addSource(SOURCE_ID, { type: 'geojson', data: boundaries });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': BOUNDARY_FILL_COLOR,
          'fill-opacity': [
            'case',
            SELECTED,
            0.6,
            ['case', HOVERED, 0.45, 0.25],
          ],
        },
      });

      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': BOUNDARY_OUTLINE_COLOR,
          'line-width': ['case', SELECTED, 4, ['case', HOVERED, 3, 2]],
        },
      });

      applySelection();
    };

    // A style swap drops every feature state, so the selection comes back with the
    // boundaries it belongs to.
    const applySelection = () => {
      const selected = selectedAreaIdRef.current;
      if (selected !== null) {
        map.setFeatureState({ source: SOURCE_ID, id: selected }, { selected: true });
      }
    };

    // A source or a layer can be added only once the style has loaded. A style
    // swap drops them, so the same function also runs on style.load. The map
    // fires load once per instance, so a busy style waits for idle instead.
    map.on('style.load', applyBoundaries);

    if (map.isStyleLoaded()) {
      applyBoundaries();
    } else {
      map.once('idle', applyBoundaries);
    }

    return () => {
      map.off('mousemove', FILL_LAYER_ID, handleMouseMove);
      map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave);
      map.off('click', FILL_LAYER_ID, handleClick);
      // The effect above clears the ref before it removes the map, so this runs only
      // while the map is still alive.
      map.off('style.load', applyBoundaries);
      if (mapRef.current !== null) mapRef.current.off('idle', applyBoundaries);
    };
  }, [apiKey, boundaries, canEditBoundaryColors, onSetBoundaryColor]);

  // The parent owns the selection, so this effect only moves the highlight: the
  // previous site loses it, the new one gains it (US 2.0.1 AT4).
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    const previous = selectedAreaIdRef.current;
    selectedAreaIdRef.current = selectedAreaId ?? null;

    // Before the style loads the source does not exist, and setFeatureState on a
    // missing source fires a map error. applySelection restores the highlight once
    // the boundaries build the source.
    if (map.getSource(SOURCE_ID) === undefined) return;

    if (previous !== null && previous !== selectedAreaId) {
      map.setFeatureState({ source: SOURCE_ID, id: previous }, { selected: false });
    }
    if (selectedAreaId != null && previous !== selectedAreaId) {
      map.setFeatureState({ source: SOURCE_ID, id: selectedAreaId }, { selected: true });
    }
  }, [apiKey, selectedAreaId]);

  // The tracks arrive after the map exists, so they live in their own effect like
  // the boundaries. A style swap drops the source and the layer, so the same
  // function also runs on style.load.
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    const applyGpxTracks = () => {
      const source = map.getSource(GPX_SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        source.setData(gpxTracks ?? EMPTY_TRACK_COLLECTION);
        return;
      }
      if (gpxTracks == null || gpxTracks.features.length === 0) {
        return;
      }
      map.addSource(GPX_SOURCE_ID, { type: 'geojson', data: gpxTracks });
      map.addLayer({
        id: GPX_LINE_LAYER_ID,
        type: 'line',
        source: GPX_SOURCE_ID,
        paint: {
          'line-color': GPX_LINE_COLOR,
          'line-width': GPX_LINE_WIDTH,
          'line-dasharray': GPX_LINE_DASHARRAY,
        },
      });
    };

    // The map fires load once per instance, so a busy style waits for idle instead.
    map.on('style.load', applyGpxTracks);
    if (map.isStyleLoaded()) {
      applyGpxTracks();
    } else {
      map.once('idle', applyGpxTracks);
    }

    return () => {
      map.off('style.load', applyGpxTracks);
      if (mapRef.current !== null) mapRef.current.off('idle', applyGpxTracks);
    };
  }, [apiKey, gpxTracks]);

  // The camera can move before the style loads, so this effect does not wait for it.
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !focusedArea) return;
    const bounds = boundaryBounds(focusedArea.geometry);
    if (bounds !== null) map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
  }, [apiKey, focusedArea]);

  // The outlines show what the user saved, and a style swap drops them, so the
  // apply function also runs on style.load.
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    const collection = {
      type: 'FeatureCollection' as const,
      features: savedRegions.map((region) => ({
        type: 'Feature' as const,
        properties: { id: region.id },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [region.bounds.west, region.bounds.south],
              [region.bounds.east, region.bounds.south],
              [region.bounds.east, region.bounds.north],
              [region.bounds.west, region.bounds.north],
              [region.bounds.west, region.bounds.south],
            ],
          ],
        },
      })),
    };

    const applyOfflineRegions = () => {
      const source = map.getSource(OFFLINE_REGIONS_SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        source.setData(collection);
        return;
      }
      // An empty list only clears an existing source, so an empty map adds nothing.
      if (savedRegions.length === 0) return;
      map.addSource(OFFLINE_REGIONS_SOURCE_ID, { type: 'geojson', data: collection });
      map.addLayer({
        id: OFFLINE_REGIONS_LAYER_ID,
        type: 'line',
        source: OFFLINE_REGIONS_SOURCE_ID,
        paint: {
          'line-color': OFFLINE_REGIONS_COLOR,
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    };

    map.on('style.load', applyOfflineRegions);
    if (map.isStyleLoaded()) applyOfflineRegions();

    return () => {
      map.off('style.load', applyOfflineRegions);
    };
  }, [apiKey, savedRegions]);

  // The mask hides what has no tiles, and the holes are the saved areas.
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    const outerRing = [
      [-180, -85.0511],
      [180, -85.0511],
      [180, 85.0511],
      [-180, 85.0511],
      [-180, -85.0511],
    ];

    // The holes must not cross or nest, so the saved rectangles dissolve into
    // disjoint pieces first.
    const holes = mergeToDisjointRectangles(savedRegions.map((region) => region.bounds));

    const maskGeometry =
      isOnline || savedRegions.length === 0
        ? null
        : {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: [
                    outerRing,
                    ...holes.map((hole) => [
                      [hole.west, hole.south],
                      [hole.east, hole.south],
                      [hole.east, hole.north],
                      [hole.west, hole.north],
                      [hole.west, hole.south],
                    ]),
                  ],
                },
              },
            ],
          };

    const applyOfflineMask = () => {
      const source = map.getSource(OFFLINE_MASK_SOURCE_ID) as GeoJSONSource | undefined;
      if (maskGeometry === null) {
        if (map.getLayer(OFFLINE_MASK_LAYER_ID)) {
          map.setLayoutProperty(OFFLINE_MASK_LAYER_ID, 'visibility', 'none');
        }
        return;
      }

      if (source) {
        source.setData(maskGeometry);
        map.setLayoutProperty(OFFLINE_MASK_LAYER_ID, 'visibility', 'visible');
        return;
      }

      map.addSource(OFFLINE_MASK_SOURCE_ID, { type: 'geojson', data: maskGeometry });
      // The mask sits above the basemap and below the app layers, so the
      // protected areas and the dashed region outlines stay visible.
      const layer = {
        id: OFFLINE_MASK_LAYER_ID,
        type: 'fill' as const,
        source: OFFLINE_MASK_SOURCE_ID,
        paint: {
          'fill-color': OFFLINE_MASK_COLOR,
          'fill-opacity': 1,
        },
      };
      // The boundaries layers may not exist yet, so the search falls through
      // to the region outline.
      const beforeId = [FILL_LAYER_ID, OFFLINE_REGIONS_LAYER_ID].find((id) => map.getLayer(id));
      if (beforeId === undefined) {
        map.addLayer(layer);
      } else {
        map.addLayer(layer, beforeId);
      }
    };

    map.on('style.load', applyOfflineMask);
    if (map.isStyleLoaded()) applyOfflineMask();

    return () => {
      map.off('style.load', applyOfflineMask);
    };
  }, [apiKey, isOnline, savedRegions]);

  // A tile miss fires a map error, so the badge count comes from the error event.
  // The counter flushes on a timer because one view change misses many tiles at once.
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    let flushTimer: number | null = null;

    const handleError = (event: { error?: { message?: string } }) => {
      if (onlineRef.current) return;
      if (!event.error?.message?.includes(OFFLINE_MISS_MARKER)) return;
      missingTilesRef.current += 1;
      if (flushTimer !== null) return;
      flushTimer = window.setTimeout(() => {
        flushTimer = null;
        setMissingTiles(missingTilesRef.current);
      }, MISSING_TILE_FLUSH_MS);
    };

    const handleMoveEnd = () => {
      missingTilesRef.current = 0;
      setMissingTiles(0);
    };

    map.on('error', handleError);
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('error', handleError);
      map.off('moveend', handleMoveEnd);
      if (flushTimer !== null) window.clearTimeout(flushTimer);
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className={`${BOX_CLASSES} flex items-center justify-center p-6`}>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E4EBE4]">
            <KeyRound className="h-8 w-8 text-[#356B43]" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#254431]">Map key not set</h3>
          <p className="mb-4 text-sm leading-relaxed text-[#7A8075]">
            Add{' '}
            <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 font-mono text-[#254431]">
              NEXT_PUBLIC_PROTOMAPS_API_KEY
            </code>{' '}
            to{' '}
            <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 font-mono text-[#254431]">
              webapp/.env.local
            </code>
            , then restart{' '}
            <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 font-mono text-[#254431]">
              npm run dev
            </code>
            . The server inlines the value at start, so a restart is necessary.
          </p>
          <p className="text-xs text-[#7A8075]">
            Get a key at{' '}
            <a
              href="https://maps.protomaps.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#356B43] underline"
            >
              maps.protomaps.com
            </a>
            . The variable is documented in <span className="font-mono">webapp/.env.example</span>.
          </p>
        </div>
      </div>
    );
  }

  // The map still works without the boundaries and tracks, so the states are notes
  // on top of the canvas rather than a replacement for it.
  const statusNotes = [
    boundariesError ?? (boundariesLoading ? 'Loading boundaries…' : null),
    gpxTracksError ?? null,
  ].filter((note): note is string => note !== null);

  return (
    <div className="relative">
      <div ref={containerRef} className={BOX_CLASSES} />
      {statusNotes.length > 0 && (
        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
          {statusNotes.map((note) => (
            <div
              key={note}
              className="rounded-full border border-[#E4EBE4] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#254431] shadow-sm"
            >
              {note}
            </div>
          ))}
        </div>
      )}
      {!saveMode && (
        <button
          type="button"
          onClick={() => setSaveMode(true)}
          className="pointer-events-auto absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-[#E4EBE4] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#254431] shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          Save offline area
        </button>
      )}
      {saveMode && map !== null && (
        <div className="absolute inset-0 z-10">
          <OfflineSavePanel
            map={map}
            styleUrl={styleUrl}
            savedRegions={savedRegions}
            onSaved={(region) => setSavedRegions((previous) => [...previous, region])}
            onRegionRemoved={(id) =>
              setSavedRegions((previous) => previous.filter((region) => region.id !== id))
            }
            onClose={() => setSaveMode(false)}
          />
        </div>
      )}
      {!isOnline && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-[#E4EBE4] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#254431] shadow-sm">
          <div>Offline map. Tiles outside saved areas are missing.</div>
          {missingTiles > 0 && (
            <div>
              {missingTiles} {missingTiles === 1 ? 'tile' : 'tiles'} missing in this view.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
