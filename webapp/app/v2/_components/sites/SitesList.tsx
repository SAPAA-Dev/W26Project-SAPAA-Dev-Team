'use client';

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ClipboardPen, Images, Map as MapIcon, Search } from 'lucide-react';
import { ApiError } from '@/lib/api/v1/client';
import type { SiteSummary } from '@/lib/api/v1/types';
import { ago, applySiteQuery, STATUS_INK, useSiteQuery } from '../../_lib/siteQuery';
import { canSpeculate, prefetchSite, siteIntent, useSites, whenIdle } from './useSites';
import { preloadMap } from '../map/preload';
import QueryBar from './QueryBar';
import { AdminSitesBar } from '../admin/lazy';
import SiteRow, { StatusTag } from './SiteRow';
import PhotoHero, { BrandMark } from './PhotoHero';
import QuickActions, { type QuickAction } from './QuickActions';
import Overview from './Overview';
import { Sheet, useOpenKey } from '../flows/ui';
import { BASE_QUERY, fmtDate, HEADING, shortCounty, sinceVisit, siteHref, TNUM } from './ui';

const SORT_NOTE = { urgency: 'most urgent first', name: 'A to Z', recent: 'recently visited first' } as const;
const inspectHref = (slug: string) => `${siteHref(slug)}/inspect`;
const listBox = 'mx-4 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)] md:mx-0';
const HERO = 'h-[300px] md:h-[340px]';
const HERO_INNER =
  'mx-auto flex h-full max-w-6xl flex-col px-5 pt-[max(16px,env(safe-area-inset-top))] pb-16 md:px-8 md:pt-6 md:pb-20';
const COLUMNS = 'mx-auto max-w-6xl md:grid md:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] md:gap-8 md:px-8';
const SECTION = 'mt-7 md:relative md:z-10 md:-mt-12 md:rounded-[var(--radius-l)] md:bg-[var(--bg)] md:px-5 md:pt-2';

/** Retry remounts the page body, so every useApi under it (list, query bar counts) fetches again. */
export default function SitesList() {
  const [attempt, setAttempt] = useState(0);
  return <SitesHome key={attempt} onRetry={() => setAttempt((n) => n + 1)} />;
}

function SitesHome({ onRetry }: { onRetry: () => void }) {
  const router = useRouter();
  const { query, update } = useSiteQuery();
  const { sites, me, meSettled, error } = useSites();
  const drafts = useDrafts();
  const [picking, setPicking] = useState(false);

  // The URL (and so the query) updates as soon as typing pauses; the list catches up at lower priority.
  const shownQuery = useDeferredValue(query);
  const results = useMemo(() => sites && applySiteQuery(sites, shownQuery, me), [sites, shownQuery, me]);
  const mine = useMemo(() => (sites && me ? applySiteQuery(sites, { ...BASE_QUERY, view: 'mine' }, me) : []), [sites, me]);
  const mineDue = mine.filter((s) => s.status !== 'recent');
  const ready = !!sites && meSettled;

  // Once the list has painted and the phone is idle: warm the likeliest next pages (your sites, else the
  // top of the list) and the map's code. Skipped when the phone asks to save data or is short on memory.
  const likely = (mine.length ? mine : (results ?? [])).slice(0, 3).map((s) => s.slug).join('\n');
  useEffect(() => {
    if (!ready || !canSpeculate()) return;
    return whenIdle(() => {
      for (const slug of likely ? likely.split('\n') : []) prefetchSite(slug, { photos: false });
      preloadMap();
    }, 4000);
  }, [ready, likely]);

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toList = () =>
    document.getElementById('sites-list')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
  const find = () => {
    toList();
    document.getElementById('site-search')?.focus({ preventScroll: true });
  };
  const inspect = () => (mineDue.length === 1 ? router.push(inspectHref(mineDue[0].slug)) : setPicking(true));
  const clearAll = () => update({ q: '', view: 'all', status: [], county: [], boundary: undefined });

  return (
    <main className="pb-[calc(var(--nav-clear)+40px)]">
      <PhotoHero className={HERO}>
        <div className={HERO_INNER}>
          <BrandMark />
          <div className="hero-drift mt-auto">
            {ready ? (
              <Headline sites={sites} mine={mine} mineDue={mineDue} role={me?.role} />
            ) : error ? (
              <h1 style={HEADING} className="text-[34px] leading-[1.05] font-bold text-[var(--birch)]">
                Sites
              </h1>
            ) : (
              <HeadlineSkeleton />
            )}
          </div>
        </div>
      </PhotoHero>

      <div className={COLUMNS}>
        <div>
          <div className="relative z-10 mx-4 -mt-12 md:mx-0">
            <QuickActions
              label="Quick actions"
              items={actions({ inspect, map: () => update({ mode: 'map' }), find, ready: !!sites })}
            />
          </div>

          {drafts.slice(0, 2).map((d) => (
            <DraftBanner key={d.slug} draft={d} />
          ))}

          {mine.length > 0 && (
            <section aria-labelledby="your-sites" className="reveal mt-7 px-4 md:px-0">
              <div className="flex min-h-11 items-center justify-between">
                <h2 id="your-sites" style={HEADING} className="text-lg font-bold">
                  Your sites
                </h2>
                {mine.length > 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      update({ view: 'mine' });
                      toList();
                    }}
                    className={`press h-11 px-1 text-sm font-semibold text-[var(--forest)] underline-offset-4 hover:underline ${TNUM}`}
                  >
                    See all {mine.length}
                  </button>
                )}
              </div>
              <ul className="mt-2 flex flex-col gap-3">
                {mine.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <SiteCard site={s} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div aria-hidden className="hairline-treeline reveal mx-4 mt-8 md:mx-0" />

          {sites && <Overview sites={sites} active={query.status} onPick={(status) => update({ status })} />}
        </div>

        <section id="sites-list" aria-labelledby="all-sites" className={SECTION}>
          <h2 id="all-sites" className="sr-only" style={HEADING}>
            All sites
          </h2>
          <StickyBar>
            <QueryBar tone="paper" />
          </StickyBar>
          <AdminSitesBar sites={results} />
          <p aria-live="polite" className={`px-5 pb-2 text-sm text-[var(--ink-2)] md:px-1 ${TNUM}`}>
            {results ? `${results.length} site${results.length === 1 ? '' : 's'}, ${SORT_NOTE[query.sort]}` : ' '}
          </p>

          {error ? (
            <LoadError error={error} onRetry={onRetry} />
          ) : !results ? (
            <RowsSkeleton />
          ) : results.length === 0 ? (
            <div className={`${listBox} px-6 py-10 text-center`}>
              <p className="text-base font-bold">{query.q ? `No sites match “${query.q}”.` : 'No sites match these filters.'}</p>
              <p className="mt-1 text-sm text-[var(--ink-2)]">Try another name, or clear the filters to see every site.</p>
              <button
                type="button"
                onClick={clearAll}
                className="press mt-4 h-11 rounded-full bg-[var(--forest)] px-5 text-[15px] font-bold text-[var(--birch)]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul
              className={`${listBox} divide-y divide-[var(--line)] [&>li:first-child>*]:rounded-t-[var(--radius-l)] [&>li:last-child>*]:rounded-b-[var(--radius-l)]`}
            >
              {results.map((s) => (
                <li key={s.id} className="cv-row">
                  <SiteRow site={s} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sites && <SitePicker open={picking} sites={sites} mine={mine} onClose={() => setPicking(false)} />}
    </main>
  );
}

const actions = ({ inspect, map, find, ready }: { inspect: () => void; map: () => void; find: () => void; ready: boolean }): QuickAction[] => [
  { label: 'Inspect', icon: ClipboardPen, onClick: inspect, primary: true, disabled: !ready },
  { label: 'Photos', icon: Images, href: '/v2/photos' },
  { label: 'Map', icon: MapIcon, onClick: map },
  { label: 'Find', icon: Search, onClick: find },
];

/** Two lines at the headline's own size, so 18ch measures the same as the real one. */
function HeadlineSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      <span className="h-3 w-28 animate-pulse rounded bg-white/20" />
      <span className="mt-3 h-[30px] w-full max-w-[18ch] animate-pulse rounded-lg bg-white/20 text-[34px]" />
      <span className="mt-1.5 h-[30px] w-[11ch] animate-pulse rounded-lg bg-white/20 text-[34px]" />
      <span className="mt-3 h-4 w-3/5 animate-pulse rounded bg-white/15" />
    </div>
  );
}

function RowsSkeleton() {
  return (
    <ul aria-hidden className={`${listBox} divide-y divide-[var(--line)]`}>
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="flex h-[86px] flex-col justify-center gap-2 px-4">
          <span className="h-3 w-20 animate-pulse rounded bg-[var(--bg-sunken)]" />
          <span className="h-4 w-2/3 animate-pulse rounded bg-[var(--bg-sunken)]" />
          <span className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-sunken)]" />
        </li>
      ))}
    </ul>
  );
}

/**
 * First paint before the URL query is readable (the page's Suspense fallback in a static build): the same
 * hero, actions and rows as the loading page, so hydration swaps in place instead of from blank.
 */
export function SitesSkeleton() {
  const noop = () => {};
  return (
    <main aria-busy="true" className="pb-[calc(var(--nav-clear)+40px)]">
      <PhotoHero className={HERO}>
        <div className={HERO_INNER}>
          <BrandMark />
          <div className="mt-auto">
            <HeadlineSkeleton />
          </div>
        </div>
      </PhotoHero>
      <div className={COLUMNS}>
        <div className="relative z-10 mx-4 -mt-12 md:mx-0">
          <QuickActions label="Quick actions" items={actions({ inspect: noop, map: noop, find: noop, ready: false })} />
        </div>
        <section aria-label="All sites" className={SECTION}>
          <div aria-hidden className="flex flex-col gap-2 px-4 py-3 md:px-0">
            <span className="h-13 rounded-full border border-[var(--line)] bg-[var(--surface)]" />
            <span className="h-11 w-3/4 animate-pulse rounded-full bg-[var(--bg-sunken)]" />
          </div>
          <p className="px-5 pb-2 text-sm text-[var(--ink-2)] md:px-1">&nbsp;</p>
          <RowsSkeleton />
        </section>
      </div>
    </main>
  );
}

/**
 * Sticky query bar. Once pinned it sits below the status bar (a paper strip covers the notch area above it)
 * and shows a hairline, so the list visibly slides under it. A 1px marker above it says when it is pinned.
 */
function StickyBar({ children }: { children: React.ReactNode }) {
  const marker = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const m = marker.current;
    const b = bar.current;
    if (!m || !b) return;
    const top = parseFloat(getComputedStyle(b).top) || 0;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < top + 1), {
      rootMargin: `${-Math.ceil(top) - 1}px 0px 0px 0px`,
    });
    io.observe(m);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={marker} aria-hidden className="-mb-px h-px" />
      <div
        ref={bar}
        data-stuck={stuck || undefined}
        className="sticky top-[env(safe-area-inset-top)] z-20 border-b border-transparent bg-[var(--bg)] px-4 py-3 transition-colors duration-[var(--dur-2)] before:absolute before:inset-x-0 before:bottom-full before:hidden before:h-[env(safe-area-inset-top)] before:bg-[var(--bg)] data-[stuck]:border-[var(--line)] data-[stuck]:before:block md:px-0"
      >
        {children}
      </div>
    </>
  );
}

function Headline({
  sites,
  mine,
  mineDue,
  role,
}: {
  sites: SiteSummary[];
  mine: SiteSummary[];
  mineDue: SiteSummary[];
  role?: 'steward' | 'admin';
}) {
  const need = sites.filter((s) => s.status !== 'recent');
  const overdue = need.filter((s) => s.status === 'overdue').length;
  const never = need.filter((s) => s.status === 'never').length;
  const top = mineDue[0];

  const eyebrow =
    role === 'admin' ? 'SAPAA admin' : mine[0]?.county ? `Steward · ${shortCounty(mine[0].county)}` : 'SAPAA stewards';
  const headline = mineDue.length
    ? mine.length === 1
      ? 'Your site is due.'
      : `${mineDue.length} of your sites ${mineDue.length === 1 ? 'is' : 'are'} due.`
    : need.length
      ? `${need.length} ${need.length === 1 ? 'site needs' : 'sites need'} a visit.`
      : 'Every site is up to date.';
  const sub = top
    ? top.daysSince === null
      ? `${top.name} has never been inspected.`
      : `${top.name} was last visited ${ago(top.daysSince)} ago.`
    : mine.length
      ? 'Your sites are up to date.'
      : need.length
        ? `${overdue} overdue, ${never} never inspected.`
        : 'Every report is current.';

  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1
        style={HEADING}
        className={`mt-2 max-w-[18ch] text-[34px] leading-[1.05] font-bold tracking-[-0.01em] text-[var(--birch)] [font-stretch:87.5%] md:text-5xl ${TNUM}`}
      >
        {headline}
      </h1>
      <p className="mt-2 max-w-prose text-[15px] text-[var(--sage)]">{sub}</p>
    </>
  );
}

/** TD account-card style: identity on top, the big days-since number below. */
function SiteCard({ site }: { site: SiteSummary }) {
  return (
    <Link
      href={siteHref(site.slug)}
      {...siteIntent(site.slug)}
      className="lift block rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(18,42,28,0.06)] hover:border-[var(--lichen)] active:bg-[var(--bg-sunken)]"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-base leading-snug font-bold">{site.name}</p>
          <p className="text-sm text-[var(--ink-2)]">{site.county ?? 'County unknown'}</p>
        </div>
        <ChevronRight aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--ink-2)]" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        {site.daysSince !== null ? (
          <p>
            <span
              className={`block text-[44px] leading-none font-bold tracking-[-0.02em] [font-stretch:87.5%] ${TNUM}`}
              style={{ color: STATUS_INK[site.status] }}
            >
              {sinceVisit(site.daysSince)[0]}
            </span>
            <span className="mt-1 block text-sm text-[var(--ink-2)]">{sinceVisit(site.daysSince)[1]}</span>
          </p>
        ) : (
          <p>
            <span className="block text-[22px] leading-[44px] font-bold">No visits yet</span>
            <span className="mt-1 block text-sm text-[var(--ink-2)]">No reports on file</span>
          </p>
        )}
        <StatusTag status={site.status} className="mb-0.5" />
      </div>
    </Link>
  );
}

function LoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const signedOut = error instanceof ApiError && error.status === 401;
  return (
    <div role="alert" className={`${listBox} px-6 py-8 text-center`}>
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

/* ---------- Drafts: the inspection flow saves `boreal-draft:<slug>` to localStorage ---------- */

interface Draft {
  slug: string;
  siteName: string;
  sectionIndex: number;
  sectionCount: number;
  updatedAt: string;
}

const DRAFT_PREFIX = 'boreal-draft:';

function readDrafts() {
  try {
    const out: [string, string | null][] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(DRAFT_PREFIX)) out.push([k.slice(DRAFT_PREFIX.length), localStorage.getItem(k)]);
    }
    return JSON.stringify(out);
  } catch {
    return '[]'; // storage blocked (private mode)
  }
}
const onStorage = (cb: () => void) => {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
};

function useDrafts(): Draft[] {
  const raw = useSyncExternalStore(onStorage, readDrafts, () => '[]');
  return useMemo(
    () =>
      (JSON.parse(raw) as [string, string | null][])
        .flatMap(([slug, v]) => {
          try {
            const d = JSON.parse(v ?? '');
            return d?.siteName ? [{ ...d, slug } as Draft] : [];
          } catch {
            return [];
          }
        })
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    [raw],
  );
}

function DraftBanner({ draft }: { draft: Draft }) {
  const count = Math.max(1, draft.sectionCount || 1);
  const done = Math.min(Math.max(draft.sectionIndex || 0, 0), count - 1); // sectionIndex is 0-based
  return (
    <section
      aria-label={`Unfinished inspection of ${draft.siteName}`}
      className="mx-4 mt-4 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)] p-4 md:mx-0"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--st-due-ink)]">Draft inspection</p>
          <p className="mt-0.5 text-base leading-snug font-bold">{draft.siteName}</p>
          <p className={`text-sm text-[var(--ink-2)] ${TNUM}`}>
            Section {done + 1} of {count}
            {draft.updatedAt && `, saved ${fmtDate(draft.updatedAt, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`}
          </p>
        </div>
        <Link
          href={inspectHref(draft.slug)}
          className="press inline-flex h-11 shrink-0 items-center rounded-full bg-[var(--forest)] px-5 text-[15px] font-bold text-[var(--birch)]"
        >
          Resume
        </Link>
      </div>
      <div
        role="progressbar"
        aria-label="Sections finished"
        aria-valuemin={0}
        aria-valuemax={count}
        aria-valuenow={done}
        className="mt-3 flex gap-1"
      >
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < done ? 'bg-[var(--forest)]' : i === done ? 'bg-[var(--honey)]' : 'bg-[var(--bg-sunken)]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/** Inspect with no single obvious site: pick one. Your sites first, then everything by urgency. */
function SitePicker({ open, sites, mine, onClose }: { open: boolean; sites: SiteSummary[]; mine: SiteSummary[]; onClose: () => void }) {
  // Mounted on first open and kept for the exit slide; the sheet remounts its body (a fresh search) each open.
  if (!useOpenKey(open)) return null;
  return (
    <Sheet open={open} onClose={onClose} title="Which site are you inspecting?">
      <PickerBody sites={sites} mine={mine} />
    </Sheet>
  );
}

/** Memoised: while the sheet sits closed, list re-renders (typing, filters) skip it. */
const PickerBody = memo(function PickerBody({ sites, mine }: { sites: SiteSummary[]; mine: SiteSummary[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const match = (s: SiteSummary) => !ql || s.name.toLowerCase().includes(ql) || (s.county ?? '').toLowerCase().includes(ql);
  const mineIds = new Set(mine.map((s) => s.id));
  const yours = mine.filter(match);
  const rest = applySiteQuery(sites, BASE_QUERY, null).filter((s) => !mineIds.has(s.id) && match(s));
  const go = (s: SiteSummary) => router.push(inspectHref(s.slug));
  const group = (title: string, list: SiteSummary[]) =>
    list.length > 0 && (
      <section className="mt-4">
        <h3 style={HEADING} className="mb-2 text-[15px] font-bold">
          {title}
        </h3>
        <ul className="divide-y divide-[var(--line)] rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)]">
          {list.map((s) => (
            <li key={s.id}>
              <SiteRow site={s} onSelect={() => go(s)} />
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <>
      <label className="flex h-12 items-center gap-2 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--honey)]">
        <Search aria-hidden size={18} className="shrink-0 text-[var(--ink-2)]" />
        <span className="sr-only">Search sites</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sites"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-base"
          style={{ outline: 'none' }}
        />
      </label>
      {group('Your sites', yours)}
      {group(yours.length ? 'Other sites' : 'All sites', rest)}
      {yours.length + rest.length === 0 && <p className="py-6 text-sm text-[var(--ink-2)]">No site matches “{q}”.</p>}
    </>
  );
});
