'use client';

import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Popup } from 'maplibre-gl';
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/map/enableMapLibreWorker';
import { Download, KeyRound } from 'lucide-react';
import { boundaryBounds } from '@/lib/map/boundaries';
import type { BoundaryFeature, BoundaryFeatureCollection } from '@/lib/map/boundaries';
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

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    retainOfflineProtocol();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: styleUrl,
      center: CENTER,
      zoom: ZOOM,
      maxBounds: MAX_BOUNDS,
      renderWorldCopies: false,
      transformRequest: makeTransformRequest(() => onlineRef.current),
    });
    mapRef.current = map;
    setMap(map);
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
    };

    // A source or a layer can be added only once the style has loaded. A style
    // swap drops them, so the same function also runs on style.load.
    map.on('style.load', applyBoundaries);

    if (map.isStyleLoaded()) {
      applyBoundaries();
    } else {
      map.once('load', applyBoundaries);
    }

    return () => {
      map.off('mousemove', FILL_LAYER_ID, handleMouseMove);
      map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave);
      map.off('click', FILL_LAYER_ID, handleClick);
      // The effect above clears the ref before it removes the map, so this runs only
      // while the map is still alive.
      map.off('style.load', applyBoundaries);
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
