'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Map as MlMap, Popup } from 'maplibre-gl';
import type { GeoJSONSource, MapMouseEvent, PointLike, StyleSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/map/enableMapLibreWorker';
import './map.css';
import { releaseOfflineProtocol, retainOfflineProtocol } from '@/components/map/offlineProtocol';
import type { SavedRegion } from '@/lib/map/offline/tileCache';
import { makeOfflineTransform, offlineMask, regionOutlines } from './offline';
import type { BoundaryCollection, SiteSummary, TrackCollection } from '@/lib/api/v1/types';
import { STATUS_LABEL } from '../../_lib/siteQuery';
import {
  ALBERTA,
  C,
  LAYER,
  MAX_BOUNDS,
  OVERLAY_LAYERS,
  RANK,
  SRC,
  STYLE_URL,
  firstSymbolLayer,
  recolorBasemap,
} from './mapStyle';

export type Inset = { top: number; right: number; bottom: number; left: number };

interface Props {
  /** Filtered sites, already in list order. */
  sites: SiteSummary[];
  boundaries: BoundaryCollection | undefined;
  tracks?: TrackCollection;
  /** navigator.onLine. Offline, basemap requests are answered from the saved areas. */
  online: boolean;
  /** Areas saved for offline use (outlined, and the only places the basemap draws while offline). */
  regions: SavedRegion[];
  selected: SiteSummary | null;
  /** Site the pointer is over in the list, mirrored on its pin. */
  hoverId: number | null;
  /** Screen area covered by chrome, sheet or panel; the camera keeps sites out from under it. */
  inset: Inset;
  onSelect: (slug: string | null) => void;
  onReady: (map: MlMap) => void;
  /** The basemap failed and the map fell back to a plain background. */
  onOffline: () => void;
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

// Shown when the basemap cannot load (no signal in the field): sites still draw on plain ground.
const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': C.land } }],
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = () => window.matchMedia('(pointer: coarse)').matches;

/** Extra px a selected site sits above the middle of the uncovered area, so the card never crowds it. */
const SELECT_LIFT = 24;
/** On a phone the top inset includes the map-key row, which only covers the sides; a selection may sit under it. */
const KEY_ROW = 64;

/** Centre of the uncovered area, as an offset from the canvas centre. */
const offsetFor = (i: Inset): PointLike => [(i.left - i.right) / 2, (i.top - i.bottom) / 2];
const pad = (i: Inset, extra: number): Inset => ({
  top: i.top + extra,
  right: i.right + extra,
  bottom: i.bottom + extra,
  left: i.left + extra,
});

function boundsOf(sites: SiteSummary[]): [[number, number], [number, number]] | null {
  const pts = sites.flatMap((s) => (s.center ? [s.center] : []));
  if (!pts.length) return null;
  const lng = pts.map((p) => p[0]);
  const lat = pts.map((p) => p[1]);
  return [
    [Math.min(...lng), Math.min(...lat)],
    [Math.max(...lng), Math.max(...lat)],
  ];
}

// Unmount runs the effect that calls map.remove() before the selection/hover cleanups,
// so those cleanups must not touch a removed map (its style is gone).
const isRemoved = (m: MlMap) => !(m as unknown as { style?: unknown }).style;
// Effects can also re-run with a map that was just removed: React re-attaches effects (dev Strict Mode,
// or a boundary revealing again) after the create-once cleanup removed it and before the new one loads.
const usable = (m: MlMap | null): m is MlMap => m !== null && !isRemoved(m);

export default function MapCanvas({
  sites,
  boundaries,
  tracks,
  online,
  regions,
  selected,
  hoverId,
  inset,
  onSelect,
  onReady,
  onOffline,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MlMap | null>(null);
  // Bumps on every style load, so the data effects re-push into fresh sources.
  const [styleGen, setStyleGen] = useState(0);

  const select = useEffectEvent((slug: string | null) => onSelect(slug));
  const ready = useEffectEvent((m: MlMap) => onReady(m));
  const offline = useEffectEvent(() => onOffline());
  const currentInset = useEffectEvent(() => inset);
  // transformRequest reads this, so the map picks the offline path without being rebuilt.
  const onlineRef = useRef(online);

  // ---------------------------------------------------------------- create once
  useEffect(() => {
    if (!el.current) return;
    retainOfflineProtocol();
    const m = new MlMap({
      container: el.current,
      style: STYLE_URL,
      transformRequest: makeOfflineTransform(() => onlineRef.current),
      bounds: ALBERTA,
      maxBounds: MAX_BOUNDS,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    m.touchZoomRotate.disableRotation();

    let styled = false;
    let fellBack = false;
    m.on('style.load', () => {
      styled = true;
      recolorBasemap(m);
      const below = firstSymbolLayer(m);
      for (const id of Object.values(SRC)) m.addSource(id, { type: 'geojson', data: EMPTY });
      for (const { layer, belowLabels } of OVERLAY_LAYERS) {
        // The offline style has no glyphs, so it cannot draw text.
        if (layer.type === 'symbol' && !m.getStyle().glyphs) continue;
        m.addLayer(layer, belowLabels ? below : undefined);
      }
      setMap(m);
      setStyleGen((n) => n + 1);
      ready(m);
    });
    m.on('error', () => {
      if (styled || fellBack) return; // tile hiccups after load are MapLibre's to retry
      fellBack = true;
      offline();
      m.setStyle(OFFLINE_STYLE);
    });

    // ---- hit testing: a fingertip-sized box, nearest pin wins, then the polygon under it
    const pick = (e: MapMouseEvent, r: number) => {
      const { x, y } = e.point;
      const box: [PointLike, PointLike] = [
        [x - r, y - r],
        [x + r, y + r],
      ];
      const pins = m.getLayer(LAYER.pins) ? m.queryRenderedFeatures(box, { layers: [LAYER.pins] }) : [];
      let pin = pins[0];
      let best = Infinity;
      for (const f of pins) {
        const p = m.project((f.geometry as Point).coordinates as [number, number]);
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < best) [best, pin] = [d, f];
      }
      const area = !pin && m.getLayer(LAYER.boundaryFill)
        ? m.queryRenderedFeatures(e.point, { layers: [LAYER.boundaryFill] })[0]
        : undefined;
      return { pin, area };
    };

    m.on('click', (e) => {
      const { pin, area } = pick(e, coarse() ? 18 : 8);
      const slug = (pin ?? area)?.properties?.slug as string | undefined;
      select(slug || null);
    });

    // ---- hover (mouse only): grow the pin, tint the polygon, name it in a tooltip
    const tip = new Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom', offset: 14, className: 'boreal-tip' });
    let hovered: { source: string; id: string | number } | null = null;
    const setHover = (next: typeof hovered) => {
      if (hovered?.source === next?.source && hovered?.id === next?.id) return;
      if (hovered) m.setFeatureState(hovered, { hover: false });
      if (next) m.setFeatureState(next, { hover: true });
      hovered = next;
    };
    m.on('mousemove', (e) => {
      if (coarse()) return;
      const { pin, area } = pick(e, 6);
      const f = pin ?? area;
      if (!f || f.id === undefined) {
        setHover(null);
        tip.remove();
        m.getCanvas().style.cursor = '';
        return;
      }
      const linked = Boolean(f.properties.slug);
      setHover({ source: pin ? SRC.sites : SRC.boundaries, id: f.id });
      m.getCanvas().style.cursor = linked ? 'pointer' : '';
      const body = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = f.properties.name;
      const note = document.createElement('small');
      note.textContent = linked ? STATUS_LABEL[f.properties.st as keyof typeof STATUS_LABEL] : 'No SAPAA site linked';
      body.append(name, note);
      tip.setLngLat(pin ? ((pin.geometry as Point).coordinates as [number, number]) : e.lngLat).setDOMContent(body).addTo(m);
    });
    m.getCanvas().addEventListener('mouseleave', () => {
      setHover(null);
      tip.remove();
    });

    return () => {
      tip.remove();
      m.remove();
      releaseOfflineProtocol();
    };
  }, []);

  // ---------------------------------------------------------------- offline
  // In-flight and cached basemap requests only change path with a new style, so a change of connection
  // reloads it (diff: false drops our layers cleanly; style.load puts them back). This also brings the
  // basemap back when the plain offline fallback was showing.
  useEffect(() => {
    if (onlineRef.current === online) return;
    onlineRef.current = online;
    if (usable(map)) map.setStyle(STYLE_URL, { diff: false });
  }, [map, online]);

  useEffect(() => {
    if (!usable(map)) return;
    (map.getSource(SRC.offlineRegions) as GeoJSONSource | undefined)?.setData(regionOutlines(regions) as FeatureCollection);
    (map.getSource(SRC.offlineMask) as GeoJSONSource | undefined)?.setData(offlineMask(regions, online) as FeatureCollection);
  }, [map, styleGen, regions, online]);

  // ---------------------------------------------------------------- data
  useEffect(() => {
    if (!usable(map)) return;
    const data: FeatureCollection = {
      type: 'FeatureCollection',
      features: sites.flatMap((s): Feature[] =>
        s.center
          ? [
              {
                type: 'Feature',
                id: s.id,
                geometry: { type: 'Point', coordinates: s.center },
                properties: { slug: s.slug, name: s.name, st: s.status, rank: RANK[s.status] },
              },
            ]
          : [],
      ),
    };
    (map.getSource(SRC.sites) as GeoJSONSource | undefined)?.setData(data);
  }, [map, styleGen, sites]);

  // Same `st`/`slug` keys as the pins, so one set of paint expressions styles both.
  const areas = useMemo<FeatureCollection | null>(
    () =>
      boundaries
        ? {
            type: 'FeatureCollection',
            features: boundaries.features.map((f) => ({
              type: 'Feature',
              id: f.id,
              geometry: f.geometry as Geometry,
              properties: {
                name: f.properties.name,
                slug: f.properties.siteSlug ?? '',
                st: f.properties.status ?? 'none',
                color: f.properties.color ?? '',
              },
            })),
          }
        : null,
    [boundaries],
  );

  useEffect(() => {
    if (!usable(map) || !areas) return;
    (map.getSource(SRC.boundaries) as GeoJSONSource | undefined)?.setData(areas);
  }, [map, styleGen, areas]);

  // Uploaded GPX tracks (steward and admin only; a failed or refused read simply draws none).
  useEffect(() => {
    if (!usable(map)) return;
    (map.getSource(SRC.tracks) as GeoJSONSource | undefined)?.setData((tracks ?? EMPTY) as FeatureCollection);
  }, [map, styleGen, tracks]);

  // Areas follow the filter: linked areas of hidden sites disappear, unlinked areas stay as context.
  const slugs = useMemo(() => sites.map((s) => s.slug), [sites]);
  useEffect(() => {
    if (!usable(map)) return;
    const filter = ['any', ['==', ['get', 'st'], 'none'], ['in', ['get', 'slug'], ['literal', slugs]]] as const;
    for (const id of [LAYER.boundaryFill, LAYER.boundaryLine]) {
      if (map.getLayer(id)) map.setFilter(id, filter as never);
    }
  }, [map, styleGen, slugs]);

  // ---------------------------------------------------------------- selection
  const areaIdFor = (slug: string | undefined) => areas?.features.find((f) => f.properties?.slug === slug)?.id;
  const selectedAreaId = areaIdFor(selected?.slug);

  useEffect(() => {
    if (!usable(map) || !selected) return;
    const site = { source: SRC.sites, id: selected.id };
    const area = selectedAreaId !== undefined ? { source: SRC.boundaries, id: selectedAreaId } : null;
    map.setFeatureState(site, { selected: true });
    if (area) map.setFeatureState(area, { selected: true });
    if (map.getLayer(LAYER.halo)) map.setFilter(LAYER.halo, ['==', ['get', 'slug'], selected.slug]);
    return () => {
      if (isRemoved(map)) return;
      map.setFeatureState(site, { selected: false });
      if (area) map.setFeatureState(area, { selected: false });
      if (map.getLayer(LAYER.halo)) map.setFilter(LAYER.halo, ['==', ['get', 'slug'], '']);
    };
  }, [map, styleGen, selected, selectedAreaId]);

  // Fly to the selection, landing it in the middle of the uncovered map.
  const selectedSlug = selected?.slug;
  const selectedCenter = selected?.center;
  const flownTo = useRef<string | undefined>(undefined);
  const flownZoom = useRef(0);
  // The card is taller than the list peek it replaces, so the cover (inset.bottom) settles after the
  // selection; fly again when it changes so the site lands above the card.
  const cover = inset.bottom;
  useEffect(() => {
    if (!usable(map) || !selectedCenter) return;
    if (flownTo.current !== selectedSlug) {
      flownTo.current = selectedSlug;
      flownZoom.current = Math.min(Math.max(map.getZoom(), 8.8), 9.6);
    }
    const ins = currentInset();
    const [ox, oy] = offsetFor(ins.top > 100 ? { ...ins, top: ins.top - KEY_ROW } : ins) as [number, number];
    const camera = { center: selectedCenter, zoom: flownZoom.current, offset: [ox, oy - SELECT_LIFT] as PointLike };
    if (reducedMotion()) map.jumpTo(camera);
    else map.flyTo({ ...camera, duration: 1100, essential: false });
    // Re-fly when the selection or the cover changes, not when the selected object is re-fetched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedSlug, cover]);

  // ---------------------------------------------------------------- list hover
  useEffect(() => {
    if (!usable(map) || hoverId === null) return;
    const f = { source: SRC.sites, id: hoverId };
    map.setFeatureState(f, { hover: true });
    return () => {
      if (!isRemoved(map)) map.setFeatureState(f, { hover: false });
    };
  }, [map, styleGen, hoverId]);

  // ---------------------------------------------------------------- fit to the filter
  const fitKey = sites.map((s) => s.id).join(',');
  const fitted = useRef(false);
  const fit = useEffectEvent(() => {
    if (!usable(map) || selectedSlug) return; // a selection owns the camera
    const b = boundsOf(sites);
    if (!b) return;
    const first = !fitted.current;
    fitted.current = true;
    map.fitBounds(b, {
      padding: pad(currentInset(), 48),
      maxZoom: 10,
      duration: first || reducedMotion() ? 0 : 900,
    });
  });
  useEffect(() => {
    if (!usable(map)) return;
    // Typing in search changes the filter per keystroke; settle before moving the camera.
    const t = window.setTimeout(fit, fitted.current ? 350 : 0);
    return () => window.clearTimeout(t);
  }, [map, fitKey]);

  // MapLibre's CSS sets position:relative on its container, so position the wrapper, not the map div.
  return (
    <div className="absolute inset-0">
      <div ref={el} className="h-full w-full" aria-label="Map of SAPAA sites" role="region" />
    </div>
  );
}
