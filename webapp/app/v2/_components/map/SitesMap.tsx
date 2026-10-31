'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import type { Map as MlMap } from 'maplibre-gl';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { CloudOff, RotateCw, Maximize2, Minimize2, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api/v1/client';
import { applySiteQuery, STATUS_LABEL, useSiteQuery } from '../../_lib/siteQuery';
import { useApi } from '../../_lib/useApi';
import MotionProvider from '../../_lib/MotionProvider';
import QueryBar, { SiteSort } from '../sites/QueryBar';
import SiteRow from '../sites/SiteRow';
import { TNUM } from '../sites/ui';
import { prefetchSite } from '../sites/useSites';
import type { Inset } from './MapCanvas';
import { CHROME, MapButtons, MapKey } from './MapControls';
import MapSheet, { useHeight } from './MapSheet';
import OfflineSavePanel from '@/components/map/OfflineSavePanel';
import { listRegions } from '@/lib/map/offline/tileCache';
import type { SavedRegion } from '@/lib/map/offline/tileCache';
import { STYLE_URL } from './mapStyle';
import SiteCard from './SiteCard';
import { KmlImportSheet } from '../admin/lazy';
import MapAreaFilters from '@/components/map/MapAreaFilters';
import MapSearchInput from '@/components/map/MapSearchInput';
import { boundaryFilterOptions, defaultMapStatuses, filterBoundaryFeatures, MAP_STATUS_OPTIONS, type BoundaryFilterSelection } from '@/lib/map/boundaryFilters';
import type { BoundaryFeature } from '@/lib/map/boundaries';

const SORT_NOTE = { urgency: 'most urgent first', name: 'A to Z', 'name-desc': 'Z to A', recent: 'recently visited first' } as const;

// MapLibre is most of the map's code. Loading it on its own lets the search, sheet and list paint at once;
// the canvas fills in behind them (preloadMap usually has it ready by then).
const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

const DESKTOP = '(min-width: 768px) and (min-height: 500px)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(DESKTOP);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const useDesktop = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => false);

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};
const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

/**
 * Trailhead map: the map is the page, the list rides in a bottom sheet (a left panel on md+).
 * Search, views, filters and the selection all live in the URL via useSiteQuery, shared with the list.
 */
export default function SitesMap() {
  return (
    <MotionProvider>
      <SitesMapView />
    </MotionProvider>
  );
}

function SitesMapView() {
  const { query, update } = useSiteQuery();
  const sites = useApi('sites:map', () => api.sites({ includeInactive: true }));
  const me = useApi('me', api.me);
  const areas = useApi('boundaries', api.boundaries);
  const tracks = useApi('tracks', api.tracks); // stewards and admins only; for anyone else the read is refused and no lines draw
  const [importOpen, setImportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [boundaryDetails, setBoundaryDetails] = useState<{ name: string; content: HTMLElement } | null>(null);
  const [areaSearch, setAreaSearch] = useState('');
  const [focusedArea, setFocusedArea] = useState<BoundaryFeature | null>(null);
  const [areaFilters, setAreaFilters] = useState<BoundaryFilterSelection>({ types: null, subtypes: null, counties: null, statuses: defaultMapStatuses() });
  const classicAreas = useMemo(() => (areas.data?.features ?? []).flatMap((feature): BoundaryFeature[] =>
    feature.properties.details ? [{ type: 'Feature', id: feature.id, properties: feature.properties.details, geometry: feature.geometry as BoundaryFeature['geometry'] }] : []
  ), [areas.data]);
  const areaOptions = useMemo(() => boundaryFilterOptions({ type: 'FeatureCollection', features: classicAreas }), [classicAreas]);
  const areaMatches = useMemo(() => filterBoundaryFeatures(classicAreas, areaSearch, areaFilters), [classicAreas, areaSearch, areaFilters]);
  const shownAreas = useMemo(() => {
    if (!areas.data) return undefined;
    const ids = new Set(areaMatches.map((area) => area.id));
    return { ...areas.data, features: areas.data.features.filter((area) => ids.has(area.id)) };
  }, [areas.data, areaMatches]);
  const desktop = useDesktop();
  const online = useOnline();
  // Areas saved for offline use (kept in this browser by lib/map/offline).
  const [regions, setRegions] = useState<SavedRegion[]>(() => listRegions());
  const [saving, setSaving] = useState(false);
  const reduce = useReducedMotion();

  const [map, setMap] = useState<MlMap | null>(null);
  const [offline, setOffline] = useState(false);
  const [missingTiles, setMissingTiles] = useState(0);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [cover, setCover] = useState(120);
  const chrome = useRef<HTMLDivElement>(null);
  const chromeH = useHeight(chrome, !desktop);
  const restoreFocus = useRef<{ slug: string | null } | null>(null);
  const previewFocus = useRef<HTMLElement | null>(null);
  const expandFocus = useRef<HTMLButtonElement | null>(null);
  const previousExpanded = useRef(expanded);

  // Filtering (and the map redraw it causes) runs behind typing; a selection change keeps the same array.
  const shownQuery = useDeferredValue(query);
  const hasAreaFilters = areaSearch.trim() !== '' || areaFilters.types !== null || areaFilters.subtypes !== null || areaFilters.counties !== null ||
    (areaFilters.statuses !== null && (!areaFilters.statuses.has('Active') || !areaFilters.statuses.has('No status')));
  const queriedSites = useMemo(() => sites.data ? applySiteQuery(sites.data, shownQuery, me.data ?? null) : null, [sites.data, shownQuery, me.data]);
  const matchedNames = useMemo(() => hasAreaFilters ? new Set(areaMatches.map((area) => area.properties.site_name)) : null, [hasAreaFilters, areaMatches]);
  const results = useMemo(() => {
    if (!queriedSites) return null;
    const matches = queriedSites.filter((site) => site.isActive !== false || areaFilters.statuses === null || areaFilters.statuses.has('Inactive'));
    return matchedNames ? matches.filter((site) => matchedNames.has(site.name)) : matches;
  }, [queriedSites, matchedNames, areaFilters.statuses]);
  const index = results?.findIndex((s) => s.slug === query.selected) ?? -1;
  const selected = index >= 0 ? results![index] : null;

  // A selected site's card leads to its page: start that page's reads now.
  const selectedSlug = selected?.slug;
  useEffect(() => {
    if (selectedSlug) prefetchSite(selectedSlug);
  }, [selectedSlug]);

  const select = (slug: string | null) => {
    setBoundaryDetails(null);
    if (slug) setExpanded(false);
    setFocusedArea(null);
    if (slug === query.selected) return;
    if (slug) setDir(1);
    update({ selected: slug });
  };
  const step = (d: 1 | -1) => {
    const next = results?.[index + d];
    if (!next) return;
    setDir(d);
    update({ selected: next.slug });
  };
  const close = (viaKeyboard: boolean) => {
    setBoundaryDetails(null);
    restoreFocus.current = viaKeyboard ? { slug: query.selected } : null;
    update({ selected: null });
  };
  const clearFilters = () => {
    setBoundaryDetails(null);
    setAreaSearch('');
    setAreaFilters({ types: null, subtypes: null, counties: null, statuses: defaultMapStatuses() });
    setFocusedArea(null);
    update({ q: '', view: 'all', status: [], county: [], boundary: undefined, selected: null });
  };

  // Closing the card by keyboard puts focus back on the row it came from.
  useEffect(() => {
    const target = restoreFocus.current;
    if (query.selected || !target) return;
    restoreFocus.current = null;
    const element = target.slug ? document.querySelector<HTMLElement>(`[data-slug="${CSS.escape(target.slug)}"] button`) : document.getElementById('site-search');
    element?.focus();
  }, [query.selected, boundaryDetails]);

  useEffect(() => {
    if (previousExpanded.current === expanded) return;
    previousExpanded.current = expanded;
    if (expanded || (!selectedSlug && !boundaryDetails)) expandFocus.current?.focus({ preventScroll: true });
  }, [expanded, selectedSlug, boundaryDetails]);

  useEffect(() => { previewFocus.current?.focus({ preventScroll: true }); }, [selectedSlug, boundaryDetails?.name]);

  const inset: Inset = expanded
    ? { top: 16, left: 16, right: 68, bottom: 16 }
    : desktop
    ? { top: 16, left: 404, right: 72, bottom: 96 }
    : { top: chromeH + 12, left: 16, right: 68, bottom: cover };

  // ---------------------------------------------------------------- shared pieces
  const n = results?.length ?? 0;
  const areaTools = (
    <div className="pointer-events-auto relative z-30 mt-2 grid grid-cols-2 items-center gap-2 rounded-xl bg-[var(--surface)] p-2 shadow-sm" aria-label="Protected area search and filters">
      <div className="relative col-span-2 min-w-0">
        <MapSearchInput
          value={areaSearch}
          onChange={(value) => { setFocusedArea(null); setAreaSearch(value); }}
          placeholder="Search protected areas"
          className="h-11 w-full rounded-lg border border-[var(--line)] px-3 text-sm"
          matches={areaMatches}
          onPick={(area) => { setBoundaryDetails(null); update({ selected: null }); setFocusedArea(area); }}
        />
      </div>
      {(hasAreaFilters || query.q || query.view !== 'all' || query.status.length > 0 || query.county.length > 0 || query.boundary || query.selected) && <button type="button" onClick={clearFilters} className="min-h-11 px-2 text-sm font-semibold">Clear all</button>}
      <MapAreaFilters
        types={areaOptions.types} subtypes={areaOptions.subtypes} counties={areaOptions.counties} statuses={MAP_STATUS_OPTIONS}
        selectedTypes={areaFilters.types} selectedSubtypes={areaFilters.subtypes} selectedCounties={areaFilters.counties} selectedStatuses={areaFilters.statuses}
        onTypesChange={(types) => { setFocusedArea(null); setAreaFilters((current) => ({ ...current, types })); }}
        onSubtypesChange={(subtypes) => { setFocusedArea(null); setAreaFilters((current) => ({ ...current, subtypes })); }}
        onCountiesChange={(counties) => { setFocusedArea(null); setAreaFilters((current) => ({ ...current, counties })); }}
        onStatusesChange={(statuses) => { setFocusedArea(null); setAreaFilters((current) => ({ ...current, statuses })); }}
      />
      {me.data?.role === 'admin' && (
        <button type="button" onClick={() => setImportOpen(true)} className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-sm font-semibold">
          Upload KML/KMZ
        </button>
      )}
    </div>
  );
  const header = (
    <p aria-live="polite" className={`truncate py-2 text-[15px] text-[var(--ink-2)] ${TNUM}`}>
      {sites.error ? (
        'Sites didn’t load'
      ) : results ? (
        <>
          <strong className="font-extrabold text-[var(--ink)]">
            {n} site{n === 1 ? '' : 's'},
          </strong>{' '}
          {SORT_NOTE[query.sort]}
        </>
      ) : (
        'Loading sites'
      )}
    </p>
  );

  const list = sites.error ? (
    <LoadError error={sites.error} onRetry={sites.refetch} />
  ) : !results ? (
    <ul aria-hidden className="divide-y divide-[var(--line)]">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex h-[86px] flex-col justify-center gap-2 px-4">
          <span className="h-3 w-20 animate-pulse rounded bg-[var(--bg-sunken)]" />
          <span className="h-4 w-2/3 animate-pulse rounded bg-[var(--bg-sunken)]" />
          <span className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-sunken)]" />
        </li>
      ))}
    </ul>
  ) : n === 0 ? (
    <div className="px-6 py-8 text-center">
      <p className="text-base font-bold">{query.q ? `No sites match “${query.q}”.` : 'No sites match these filters.'}</p>
      <p className="mt-1 text-sm text-[var(--ink-2)]">Try another name, or clear the filters to see every site.</p>
      <button
        type="button"
        onClick={clearFilters}
        className="press mt-4 h-11 rounded-full bg-[var(--forest)] px-5 text-[15px] font-bold text-[var(--birch)]"
      >
        Clear filters
      </button>
    </div>
  ) : (
    <ul className="divide-y divide-[var(--line)]">
      {results.map((s) => (
        <li
          key={s.id}
          data-slug={s.slug}
          onMouseEnter={() => setHoverId(s.id)}
          onMouseLeave={() => setHoverId((h) => (h === s.id ? null : h))}
        >
          <SiteRow site={s} onSelect={() => select(s.slug)} oneLine />
        </li>
      ))}
    </ul>
  );

  const card = selected && (
    <SiteCard site={selected} index={index} total={n} direction={dir} onStep={step} onClose={close} />
  );

  // Map-level problems: the sites still work, so these are notes, not walls.
  const notices = (
    <>
      {!STYLE_URL && (
        <Notice>Map key not set. Add NEXT_PUBLIC_PROTOMAPS_API_KEY in Vercel and deploy again.</Notice>
      )}
      {offline && (
        <Notice icon={<CloudOff size={16} aria-hidden />}>Basemap offline. Sites still show.</Notice>
      )}
      {!online && !offline && (
        <Notice icon={<CloudOff size={16} aria-hidden />}>Offline. The basemap only shows saved areas.</Notice>
      )}
      {!online && missingTiles > 0 && (
        <Notice>{missingTiles} map tiles missing from saved areas.</Notice>
      )}
      {areas.error && (
        <Notice
          action={
            <button type="button" onClick={areas.refetch} className="press flex h-11 items-center gap-1 px-3 font-bold text-[var(--honey)]">
              <RotateCw size={14} aria-hidden />
              Retry
            </button>
          }
        >
          Area outlines didn’t load.
        </Notice>
      )}
    </>
  );

  const canvas = (
    <>
      <MapCanvas
        sites={results ?? []}
        expanded={expanded}
        boundaries={shownAreas}
        focusedArea={focusedArea}
        tracks={tracks.data}
        online={online}
        regions={regions}
        selected={selected}
        hoverId={hoverId}
        inset={inset}
        onSelect={select}
        onReady={setMap}
        onOffline={() => setOffline(true)}
        onMissingTiles={setMissingTiles}
        onBoundaryDetails={(details) => { setBoundaryDetails(details); if (details) setExpanded(false); }}
      />
      {importOpen && <KmlImportSheet open onClose={() => setImportOpen(false)} />}
      {saving && map && STYLE_URL && (
        // The save-area panel (unchanged from the classic map) frames the part of the map to keep.
        <div className="pointer-events-none absolute inset-0 z-40">
          <OfflineSavePanel
            map={map}
            styleUrl={STYLE_URL}
            savedRegions={regions}
            onSaved={(region) => setRegions((r) => [...r, region])}
            onRegionRemoved={(id) => setRegions((r) => r.filter((x) => x.id !== id))}
            onClose={() => setSaving(false)}
          />
        </div>
      )}
    </>
  );

  const expandButton = <button ref={expandFocus} type="button" onClick={() => {
    if (!expanded) { setBoundaryDetails(null); setFocusedArea(null); update({ selected: null }); }
    setExpanded((value) => !value);
  }} aria-label={expanded ? 'Restore map controls' : 'Expand map'} aria-pressed={expanded} className={`press grid size-11 shrink-0 place-items-center rounded-full ${CHROME}`}>
    {expanded ? <Minimize2 size={20} aria-hidden /> : <Maximize2 size={20} aria-hidden />}
  </button>;
  const preview = selected ? <div className="px-5 pb-3" onKeyDown={(event) => {
    if (event.key === 'ArrowLeft' && index > 0) step(-1);
    if (event.key === 'ArrowRight' && index < n - 1) step(1);
  }}>
    <Link ref={(node) => { previewFocus.current = node; }} href={`/v2/sites/${encodeURIComponent(selected.slug)}`} className="flex min-h-11 items-center justify-between gap-2 text-base font-bold"><span className="line-clamp-2">{selected.name}</span><ChevronRight size={20} aria-hidden /></Link>
    <p className="text-sm text-[var(--ink-2)]">{STATUS_LABEL[selected.status]}{selected.county ? ` · ${selected.county}` : ''}</p>
  </div> : <h2 tabIndex={-1} ref={(node) => { previewFocus.current = node; }} className="px-5 pb-4 text-base font-bold">{boundaryDetails?.name}</h2>;
  const boundaryContent = boundaryDetails && <div className="px-4 pb-4" ref={(node) => {
    if (node && !node.contains(boundaryDetails.content)) node.replaceChildren(boundaryDetails.content);
  }} />;

  // ---------------------------------------------------------------- desktop: left panel
  if (desktop) {
    const slide = reduce ? 0 : 16;
    return (
      <div data-map-expanded={expanded} className="relative h-dvh w-full overflow-hidden bg-[var(--bg)]">
        {canvas}
        <div style={expanded ? { display: 'none' } : undefined} className="pointer-events-none absolute top-3 bottom-[92px] left-3 z-20 flex w-[380px] flex-col gap-3 xl:bottom-3">
          <div className="pointer-events-auto">
            <QueryBar onClearFilters={clearFilters} tone="floating" />
            {areaTools}
          </div>
          <section
            aria-label={selected ? 'Selected site' : 'Sites'}
            // A card panel hugs its content (shrinking to scroll on short screens); the list fills the column.
            className={`pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(18,42,28,0.18)] ${card ? 'flex-initial' : 'flex-1'}`}
          >
            {/* Remounted once the sites arrive: a deep link with ?sel= then opens straight on its card. Otherwise the
                skeleton's exit could start before the lazy motion features load, and "wait" would hold it forever. */}
            <AnimatePresence key={results ? 'ready' : 'loading'} mode="wait" initial={false}>
              {card ? (
                <m.div
                  key="card"
                  className="min-h-0 flex-1 overflow-y-auto pt-2"
                  initial={{ opacity: 0, x: slide }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slide }}
                  transition={{ duration: 0.18 }}
                >
                  {card}
                </m.div>
              ) : (
                <m.div
                  key="list"
                  className="flex min-h-0 flex-1 flex-col"
                  initial={{ opacity: 0, x: -slide }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slide }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-center gap-3 border-b border-[var(--line)] px-5">
                    <div className="min-w-0 flex-1">{header}</div>
                    <Image src="/images/sapaa-icon.png" alt="SAPAA" width={18} height={19} className="h-[19px] w-[18px] shrink-0" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{list}</div>
                </m.div>
              )}
            </AnimatePresence>
          </section>
        </div>
        <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-start gap-2">
          <div className="flex flex-col items-end gap-2 [&>*]:pointer-events-auto">
            {expandButton}
            <MapKey align="right" />
            {notices}
          </div>
          <MapButtons map={map} inset={inset} className="pointer-events-auto" onSaveOffline={() => setSaving(true)} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- phone: bottom sheet
  return (
    <div data-map-expanded={expanded} className="relative h-dvh w-full overflow-hidden bg-[var(--bg)]" style={expanded ? { '--nav-h': '0px' } as React.CSSProperties : undefined}>
      {canvas}
      <div ref={chrome} style={expanded ? { display: 'none' } : undefined} className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto">
          <QueryBar onClearFilters={clearFilters} tone="floating" compact={!toolsOpen} />
          {toolsOpen && areaTools}
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" aria-expanded={toolsOpen} onClick={() => setToolsOpen((value) => !value)} className={`press flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold ${CHROME}`}><SlidersHorizontal size={17} aria-hidden /><span className="sr-only">{toolsOpen ? 'Hide filters' : 'Filters'}</span></button>
            <SiteSort />
            <MapKey compact align="right" />
            {!expanded && expandButton}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 z-10 flex items-start justify-between gap-2 px-3" style={{ top: expanded ? 12 : chromeH + 8 }}>
        <div className="flex min-w-0 flex-col items-start gap-2 [&>*]:pointer-events-auto">
          {expanded && expandButton}
          {notices}
        </div>
        <MapButtons map={map} inset={inset} className="pointer-events-auto" onSaveOffline={() => setSaving(true)} />
      </div>
      {!expanded && <MapSheet key={selected?.slug ?? boundaryDetails?.name ?? 'list'} mode={card || boundaryDetails ? 'card' : 'list'} header={header} preview={preview} top={chromeH + 8} onCover={setCover} onDismissCard={close}>
        <m.div key={card || boundaryDetails ? 'card' : 'list'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {card || (boundaryDetails ? null : list)}
          {boundaryContent}
        </m.div>
      </MapSheet>}
    </div>
  );
}

function Notice({ icon, action, children }: { icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p role="status" className={`flex min-h-11 items-center gap-2 rounded-full pl-4 text-[13px] font-semibold ${action ? 'pr-1' : 'pr-4'} ${CHROME}`}>
      {icon}
      {children}
      {action}
    </p>
  );
}

function LoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const signedOut = error instanceof ApiError && error.status === 401;
  return (
    <div role="alert" className="px-6 py-8 text-center">
      <p className="text-base font-bold">{signedOut ? 'You are signed out.' : 'Sites didn’t load.'}</p>
      <p className="mt-1 text-sm text-[var(--ink-2)]">{error.message}</p>
      {signedOut ? (
        <Link
          href="/login"
          className="press mt-4 inline-flex h-11 items-center rounded-full bg-[var(--forest)] px-5 text-[15px] font-bold text-[var(--birch)]"
        >
          Sign in
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="press mt-4 h-11 rounded-full bg-[var(--forest)] px-5 text-[15px] font-bold text-[var(--birch)]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

