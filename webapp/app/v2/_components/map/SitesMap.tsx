'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import type { Map as MlMap } from 'maplibre-gl';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { CloudOff, RotateCw } from 'lucide-react';
import { api, ApiError } from '@/lib/api/v1/client';
import { applySiteQuery, useSiteQuery } from '../../_lib/siteQuery';
import { useApi } from '../../_lib/useApi';
import MotionProvider from '../../_lib/MotionProvider';
import QueryBar from '../sites/QueryBar';
import SiteRow from '../sites/SiteRow';
import { TNUM } from '../sites/ui';
import { prefetchSite } from '../sites/useSites';
import type { Inset } from './MapCanvas';
import { CHROME, MapButtons, MapKey } from './MapControls';
import MapSheet, { useHeight } from './MapSheet';
import SiteCard from './SiteCard';

const SORT_NOTE = { urgency: 'most urgent first', name: 'A to Z', recent: 'recently visited first' } as const;

// MapLibre is most of the map's code. Loading it on its own lets the search, sheet and list paint at once;
// the canvas fills in behind them (preloadMap usually has it ready by then).
const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

const DESKTOP = '(min-width: 768px)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(DESKTOP);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const useDesktop = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => false);

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
  const sites = useApi('sites', api.sites);
  const me = useApi('me', api.me);
  const areas = useApi('boundaries', api.boundaries);
  const desktop = useDesktop();
  const reduce = useReducedMotion();

  const [map, setMap] = useState<MlMap | null>(null);
  const [offline, setOffline] = useState(false);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [cover, setCover] = useState(120);
  const chrome = useRef<HTMLDivElement>(null);
  const chromeH = useHeight(chrome);
  const restoreFocus = useRef<string | null>(null);

  // Filtering (and the map redraw it causes) runs behind typing; a selection change keeps the same array.
  const shownQuery = useDeferredValue(query);
  const results = useMemo(
    () => (sites.data ? applySiteQuery(sites.data, shownQuery, me.data ?? null) : null),
    [sites.data, shownQuery, me.data],
  );
  const index = results?.findIndex((s) => s.slug === query.selected) ?? -1;
  const selected = index >= 0 ? results![index] : null;

  // A selected site's card leads to its page: start that page's reads now.
  const selectedSlug = selected?.slug;
  useEffect(() => {
    if (selectedSlug) prefetchSite(selectedSlug);
  }, [selectedSlug]);

  const select = (slug: string | null) => {
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
    restoreFocus.current = viaKeyboard ? query.selected : null;
    update({ selected: null });
  };
  const clearFilters = () => update({ q: '', view: 'all', status: [], county: [], boundary: undefined, selected: null });

  // Closing the card by keyboard puts focus back on the row it came from.
  useEffect(() => {
    const slug = restoreFocus.current;
    if (query.selected || !slug) return;
    restoreFocus.current = null;
    document.querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"] button`)?.focus();
  }, [query.selected]);

  const inset: Inset = desktop
    ? { top: 16, left: 404, right: 72, bottom: 96 }
    : { top: chromeH + 72, left: 16, right: 68, bottom: cover };

  // ---------------------------------------------------------------- shared pieces
  const n = results?.length ?? 0;
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
      {offline && (
        <Notice icon={<CloudOff size={16} aria-hidden />}>Basemap offline. Sites still show.</Notice>
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
    <MapCanvas
      sites={results ?? []}
      boundaries={areas.data}
      selected={selected}
      hoverId={hoverId}
      inset={inset}
      onSelect={select}
      onReady={setMap}
      onOffline={() => setOffline(true)}
    />
  );

  // ---------------------------------------------------------------- desktop: left panel
  if (desktop) {
    const slide = reduce ? 0 : 16;
    return (
      <div className="relative h-dvh w-full overflow-hidden bg-[var(--bg)]">
        {canvas}
        <div className="pointer-events-none absolute top-3 bottom-[92px] left-3 z-20 flex w-[380px] flex-col gap-3 xl:bottom-3">
          <div className="pointer-events-auto">
            <QueryBar tone="floating" />
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
            <MapKey align="right" />
            {notices}
          </div>
          <MapButtons map={map} inset={inset} className="pointer-events-auto" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- phone: bottom sheet
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--bg)]">
      {canvas}
      <div
        ref={chrome}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-[max(12px,env(safe-area-inset-top))]"
      >
        <div className="pointer-events-auto">
          <QueryBar tone="floating" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 z-10 flex items-start justify-between gap-2 px-4"
        style={{ top: chromeH + 8 }}
      >
        <div className="flex min-w-0 flex-col items-start gap-2 [&>*]:pointer-events-auto">
          <MapKey />
          {notices}
        </div>
        <MapButtons map={map} inset={inset} className="pointer-events-auto" />
      </div>
      <MapSheet
        mode={card ? 'card' : 'list'}
        header={header}
        top={chromeH + 8}
        onCover={setCover}
        onDismissCard={() => close(false)}
      >
        <m.div key={card ? `card` : 'list'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {card || list}
        </m.div>
      </MapSheet>
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

