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
const CENTER: [number, number] = [-114.5, 54.5];
const ZOOM = 5.5;
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-122.0, 48.0],
  [-108.0, 60.5],
];

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

// The order matches the protected-area export. DESCRIPTION is not a column.
const POPUP_FIELDS: ReadonlyArray<{ label: string; key: string }> = [
  { label: 'NAME', key: 'name' },
  { label: 'FID', key: 'fid' },
  { label: 'TYPE', key: 'area_type' },
  { label: 'SUBTYPE', key: 'subtype' },
  { label: 'IUCN', key: 'iucn' },
  { label: 'OC_NO', key: 'oc_no' },
  { label: 'ACRES', key: 'acres' },
  { label: 'HECTARES', key: 'hectares' },
  { label: 'OC_DATE', key: 'oc_date' },
  { label: 'DATE_EST', key: 'date_est' },
  { label: 'OC_NAME', key: 'oc_name' },
];

/**
 * Builds the popup body from DOM nodes, not from an HTML string. The values come from
 * an imported file, and a node cannot carry markup.
 */
function createPopupContent(properties: unknown): HTMLElement {
  const container = document.createElement('div');

  const title = document.createElement('div');
  title.className = 'text-sm font-bold text-[#254431]';
  title.textContent = readProperty(properties, 'name') ?? 'Protected area';
  container.appendChild(title);

  const areaType = readProperty(properties, 'area_type');
  if (areaType !== null) {
    const subtitle = document.createElement('div');
    subtitle.className = 'text-xs text-[#7A8075]';
    subtitle.textContent = areaType;  // Suggestion: set this to County if we can get a hard link between protected areas to a site.
    container.appendChild(subtitle);
  }

  const fields = document.createElement('div');
  fields.className = 'mt-2';
  for (const field of POPUP_FIELDS) {
    const value = readProperty(properties, field.key);
    if (value === null) continue;

    const line = document.createElement('div');
    line.className = 'text-xs leading-5 text-[#254431]';
    line.dataset.field = field.label;

    const label = document.createElement('span');
    label.className = 'font-bold';
    label.textContent = `${field.label}:`;
    line.appendChild(label);
    line.appendChild(document.createTextNode(` ${value}`));
    fields.appendChild(line);
  }
  if (fields.childElementCount > 0) container.appendChild(fields);

  const notes = readProperty(properties, 'notes');
  if (notes !== null) {
    const notesBlock = document.createElement('div');
    notesBlock.className = 'mt-4';

    const heading = document.createElement('div');
    heading.className = 'text-xs font-bold text-[#254431]';
    heading.dataset.notesHeading = 'true';
    heading.textContent = 'NOTES';
    notesBlock.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'text-xs leading-5 text-[#254431] whitespace-pre-wrap';
    body.dataset.notesBody = 'true';
    body.textContent = notes;
    notesBlock.appendChild(body);

    container.appendChild(notesBlock);
  }

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
      center: CENTER,
      zoom: ZOOM,
      maxBounds: MAX_BOUNDS,
      renderWorldCopies: false,
    });
    mapRef.current = map;
    popupRef.current = new Popup({ closeButton: false, closeOnClick: true });

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
