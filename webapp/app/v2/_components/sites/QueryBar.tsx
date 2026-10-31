'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, List, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react';
import { applySiteQuery, useSiteQuery, type SavedView, type SortKey } from '../../_lib/siteQuery';
import { useSites } from './useSites';
import FilterSheet from './FilterSheet';
import { TNUM } from './ui';
import { preloadMap } from '../map/preload';

const VIEWS: { key: SavedView; label: string }[] = [
  { key: 'all', label: 'All sites' },
  { key: 'mine', label: 'Yours' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'never', label: 'Never inspected' },
];

// Over the map every control sits on canopy. The controls only read tokens, so retinting is just new values.
const FLOATING = {
  '--surface': 'var(--canopy)',
  '--bg': 'var(--canopy)',
  '--bg-sunken': 'var(--forest)',
  '--ink': 'var(--birch)',
  '--ink-2': 'var(--sage)',
  '--line': 'rgba(169, 191, 163, 0.28)',
  '--accent': 'var(--honey)',
  '--on-accent': 'var(--canopy)',
} as CSSProperties;

export default function QueryBar({ tone, compact = false, onClearFilters }: { tone: 'paper' | 'floating'; compact?: boolean; onClearFilters?: () => void }) {
  const { query, update } = useSiteQuery();
  const { sites, me, meSettled } = useSites();
  const [filterOpen, setFilterOpen] = useState(false);

  // Typing stays local and reaches the URL after a pause, so a keystroke is not a navigation.
  const [text, setText] = useState(query.q);
  const [seenQ, setSeenQ] = useState(query.q);
  const [pushedQ, setPushedQ] = useState(query.q);
  if (query.q !== seenQ) {
    setSeenQ(query.q);
    if (query.q !== pushedQ) setText(query.q); // changed elsewhere: Clear filters, back button
  }
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const push = (v: string) => {
    clearTimeout(timer.current);
    setPushedQ(v);
    updateRef.current({ q: v });
  };
  const onType = (v: string) => {
    setText(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(v), 250);
  };

  // Until /me answers, keep a place for "Yours" (most people have sites), so the row doesn't reflow when it lands.
  const hasMine = !meSettled || (me?.assignedSiteIds.length ?? 0) > 0;
  const counts = useMemo(
    () =>
      sites &&
      (Object.fromEntries(
        VIEWS.map((v) => [v.key, applySiteQuery(sites, { ...query, view: v.key }, me).length]),
      ) as Record<SavedView, number>),
    [sites, me, query],
  );
  const filterCount = query.status.length + query.county.length + (query.boundary ? 1 : 0);

  const floating = tone === 'floating';
  const lift = floating ? 'shadow-[0_4px_14px_rgba(18,42,28,0.35)]' : '';
  // Chips scroll sideways, which clips anything outside the rail: theirs is a smaller shadow that fits its padding.
  const chipLift = floating ? 'shadow-[0_2px_6px_rgba(18,42,28,0.32)]' : '';
  const chip = (on: boolean) =>
    `press flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${
      on
        ? 'border-transparent bg-[var(--accent)] text-[var(--on-accent)]'
        : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg-sunken)]'
    } ${chipLift}`;

  return (
    <div style={floating ? FLOATING : undefined} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label
          className={`flex h-13 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] pr-1 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--honey)] ${lift}`}
        >
          <Search aria-hidden size={18} className="shrink-0 text-[var(--ink-2)]" />
          <span className="sr-only">Search sites</span>
          <input
            id="site-search"
            type="search"
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && push(text)}
            placeholder="Search sites"
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base [&::-webkit-search-cancel-button]:appearance-none"
            style={{ outline: 'none' }}
          />
          {text && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setText('');
                push('');
                document.getElementById('site-search')?.focus();
              }}
              className="press grid size-11 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </label>

        <div
          role="group"
          aria-label="Show sites as"
          className={`flex h-13 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] p-[3px] ${lift}`}
        >
          {(['list', 'map'] as const).map((m) => {
            const on = query.mode === m;
            const Icon = m === 'list' ? List : MapIcon;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => update({ mode: m })}
                // Reaching for Map starts its code download, so the switch lands on a ready map.
                {...(m === 'map' && { onPointerEnter: preloadMap, onPointerDown: preloadMap, onFocus: preloadMap })}
                className={`press flex items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${
                  on ? 'bg-[var(--accent)] text-[var(--on-accent)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon size={16} aria-hidden />
                <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>{m === 'list' ? 'List' : 'Map'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* One scrolling row: Filter first so it is never clipped, then the saved views. */}
      {!compact && <ChipRail padY={floating}>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-haspopup="dialog"
          className={chip(filterCount > 0)}
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filter
          {filterCount > 0 && <span className={`font-bold ${TNUM}`}>{filterCount}</span>}
        </button>
        <SiteSort />
        {VIEWS.filter((v) => v.key !== 'mine' || hasMine).map((v) => {
          const on = query.view === v.key;
          return (
            <button key={v.key} type="button" aria-pressed={on} onClick={() => update({ view: v.key })} className={chip(on)}>
              {v.label}
              {/* Holds two digits' room while counts load, so the chips don't shift when they arrive. */}
              <span className={`opacity-75 ${TNUM} ${counts ? '' : 'invisible'}`}>{counts ? counts[v.key] : '00'}</span>
            </button>
          );
        })}
      </ChipRail>}

      <FilterSheet
        open={filterOpen}
        sites={sites ?? []}
        me={me}
        query={query}
        onApply={(f) => update(f)}
        onClear={() => { clearTimeout(timer.current); setText(''); if (onClearFilters) onClearFilters(); else update({ q: '', view: 'all', status: [], county: [], boundary: undefined, selected: null }); }}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}

/**
 * Horizontal chip rail. The edge with more chips fades out (mask), and on devices that hover, a small chevron
 * button at that edge scrolls by most of a screen. Touch devices swipe; the fade alone says there is more.
 */
function ChipRail({ padY, children }: { padY: boolean; children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const start = el.scrollLeft > 2;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  }, []);

  // The rail resizes with the window; the track resizes as chips appear or their counts load.
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (rail.current) ro.observe(rail.current);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [measure]);

  const scroll = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: smooth ? 'smooth' : 'auto' });
  };

  const edge = (dir: 1 | -1) => {
    const Icon = dir < 0 ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        tabIndex={-1} // keyboard users tab through the chips, which scroll themselves into view
        onClick={() => scroll(dir)}
        aria-label={dir < 0 ? 'Scroll views left' : 'Scroll views right'}
        className={`press absolute inset-y-0 z-10 hidden w-11 place-items-center starting:opacity-0 [@media(hover:hover)]:grid ${
          dir < 0 ? 'left-0' : 'right-0'
        }`}
      >
        <span className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_8px_rgba(18,42,28,0.18)]">
          <Icon size={18} aria-hidden />
        </span>
      </button>
    );
  };

  return (
    <div className={`relative -mx-4 ${padY ? '-mb-1' : ''}`}>
      <div
        ref={rail}
        onScroll={measure}
        data-more-start={more.start || undefined}
        data-more-end={more.end || undefined}
        className="edge-fade overflow-x-auto overscroll-x-contain"
      >
        <div ref={track} className={`flex w-max gap-2 px-4 ${padY ? 'pt-1 pb-2' : ''}`}>
          {children}
        </div>
      </div>
      {more.start && edge(-1)}
      {more.end && edge(1)}
    </div>
  );
}

export function SiteSort() {
  const { query, update } = useSiteQuery();
  return <label className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-semibold text-[var(--ink)]">
    <span className="sr-only">Sort sites</span>
    <select aria-label="Sort sites" value={query.sort} onChange={(event) => update({ sort: event.target.value as SortKey })} className="max-w-36 bg-transparent py-2">
      <option value="name">Name (A–Z)</option><option value="name-desc">Name (Z–A)</option><option value="urgency">Most urgent</option><option value="recent">Recently visited</option>
    </select>
  </label>;
}
