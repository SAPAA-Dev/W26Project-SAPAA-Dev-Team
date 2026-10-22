'use client';

import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, Popup } from 'maplibre-gl';
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/map/enableMapLibreWorker';
import { KeyRound } from 'lucide-react';
import { boundaryBounds } from '@/lib/map/boundaries';
import type { BoundaryFeature, BoundaryFeatureCollection } from '@/lib/map/boundaries';

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

const FILL_COLOR = '#356B43';
const OUTLINE_COLOR = '#254431';

// The hover state is a boolean on the feature, so the map repaints one polygon
// instead of every polygon.
const HOVERED: ['boolean', ['feature-state', 'hover'], boolean] = [
  'boolean',
  ['feature-state', 'hover'],
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
}

function readProperty(properties: unknown, key: string): string | null {
  if (properties === null || typeof properties !== 'object') return null;
  const value = (properties as Record<string, unknown>)[key];
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() !== '' ? value : null;
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

function createBoundarySection(properties: unknown): HTMLElement {
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

  return section;
}

/**
 * Builds the popup body from DOM nodes, not from an HTML string. The values come from
 * an imported file, and a node cannot carry markup.
 *
 * The card keeps the linked site and the protected-area boundary apart: the site name
 * comes from sites_pa.namesite, and the boundary name comes from protected_areas.
 */
function createPopupContent(properties: unknown): HTMLElement {
  const container = document.createElement('div');
  container.className =
    'max-h-[70vh] w-[min(320px,80vw)] overflow-y-auto bg-white font-sans';

  container.appendChild(createSiteSection(properties));
  container.appendChild(createBoundarySection(properties));

  return container;
}

export default function SiteMap({
  boundaries,
  boundariesLoading,
  boundariesError,
  focusedArea,
}: SiteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const hoveredFeatureRef = useRef<string | number | null>(null);
  const apiKey = readApiKey();

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: `${STYLE_URL}?key=${encodeURIComponent(apiKey)}`,
      // MapLibre fits these bounds when it builds the map. A fixed zoom cannot show
      // the full province on every container height.
      bounds: ALBERTA_BOUNDS,
      fitBoundsOptions: { padding: VIEW_PADDING },
      renderWorldCopies: false,
    });
    mapRef.current = map;
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
      observer.disconnect();
      // map.remove() also drops every source, layer and listener on the map, so
      // there is nothing else to detach here.
      map.remove();
    };
  }, [apiKey]);

  // The boundaries arrive after the map exists, so the data lives in its own effect.
  // The first set builds the source and the layers; a later set only replaces the data,
  // which keeps the pan, the zoom and the WebGL context.
  useEffect(() => {
    const map = mapRef.current;
    if (!apiKey || map === null) return;

    const applyBoundaries = () => {
      if (!boundaries) return;

      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        const hovered = hoveredFeatureRef.current;
        if (hovered !== null) {
          map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: false });
          hoveredFeatureRef.current = null;
        }
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
        source.setData(boundaries);
        return;
      }

      if (boundaries.features.length === 0) return;

      map.addSource(SOURCE_ID, { type: 'geojson', data: boundaries, generateId: true });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': FILL_COLOR,
          'fill-opacity': ['case', HOVERED, 0.45, 0.25],
        },
      });

      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': OUTLINE_COLOR,
          'line-width': ['case', HOVERED, 3, 2],
        },
      });

      const clearHover = () => {
        const hovered = hoveredFeatureRef.current;
        if (hovered === null) return;
        map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: false });
        hoveredFeatureRef.current = null;
      };

      const handleMouseMove = (event: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';

        const feature = event.features?.[0];
        // generateId puts an id on every feature, so the hover state can name one.
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
        popup
          .setLngLat(event.lngLat)
          .setDOMContent(createPopupContent(feature.properties))
          .addTo(map);
      };

      map.on('mousemove', FILL_LAYER_ID, handleMouseMove);
      map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave);
      map.on('click', FILL_LAYER_ID, handleClick);
    };

    // A source or a layer can be added only once the style has loaded.
    if (map.isStyleLoaded()) {
      applyBoundaries();
      return;
    }

    map.once('load', applyBoundaries);

    return () => {
      // The effect above clears the ref before it removes the map, so this runs only
      // while the map is still alive.
      if (mapRef.current !== null) mapRef.current.off('load', applyBoundaries);
    };
  }, [apiKey, boundaries]);

  // The camera can move before the style loads, so this effect does not wait for it.
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !focusedArea) return;
    const bounds = boundaryBounds(focusedArea.geometry);
    if (bounds !== null) map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
  }, [apiKey, focusedArea]);

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

  // The map still works without the boundaries, so the two states are a note on top
  // of the canvas rather than a replacement for it.
  const status = boundariesError ?? (boundariesLoading ? 'Loading boundaries…' : null);

  return (
    <div className="relative">
      <div ref={containerRef} className={BOX_CLASSES} />
      {status !== null && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-[#E4EBE4] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#254431] shadow-sm">
          {status}
        </div>
      )}
    </div>
  );
}
