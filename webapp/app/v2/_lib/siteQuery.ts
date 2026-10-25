'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { InspectionStatus, Me, SiteSummary } from '@/lib/api/v1/types';

/**
 * One query drives both the list and the map. It lives in the URL, so switching
 * List <-> Map, going back, or sharing a link keeps search, filters, sort and selection.
 */
export type SavedView = 'all' | 'mine' | 'overdue' | 'never';
export type SortKey = 'urgency' | 'name' | 'recent';
export type ViewMode = 'list' | 'map';

export interface SiteQuery {
  mode: ViewMode;
  q: string;
  view: SavedView;
  status: InspectionStatus[];
  county: string[];
  sort: SortKey;
  selected: string | null; // site slug
  /** Admin filter: sites with or without a linked boundary (the old admin list's Linked / Unlinked). */
  boundary?: 'with' | 'without';
}

const LIST = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

export function useSiteQuery() {
  const params = useSearchParams();
  const pathname = usePathname();

  const query: SiteQuery = useMemo(
    () => ({
      mode: params.get('mode') === 'map' ? 'map' : 'list',
      q: params.get('q') ?? '',
      view: (params.get('view') as SavedView) ?? 'all',
      status: LIST(params.get('status')) as InspectionStatus[],
      county: LIST(params.get('county')),
      sort: (params.get('sort') as SortKey) ?? 'urgency',
      selected: params.get('sel'),
      boundary: ['with', 'without'].includes(params.get('boundary') ?? '') ? (params.get('boundary') as 'with' | 'without') : undefined,
    }),
    [params],
  );

  const update = useCallback(
    (patch: Partial<SiteQuery>) => {
      const next = { ...query, ...patch };
      const p = new URLSearchParams();
      if (next.mode !== 'list') p.set('mode', next.mode);
      if (next.q) p.set('q', next.q);
      if (next.view !== 'all') p.set('view', next.view);
      if (next.status.length) p.set('status', next.status.join(','));
      if (next.county.length) p.set('county', next.county.join(','));
      if (next.sort !== 'urgency') p.set('sort', next.sort);
      if (next.boundary) p.set('boundary', next.boundary);
      if (next.selected) p.set('sel', next.selected);
      const s = p.toString();
      // Shallow URL update: Next syncs useSearchParams without a server round trip.
      window.history.replaceState(null, '', s ? `${pathname}?${s}` : pathname);
    },
    [query, pathname],
  );

  return { query, update };
}

const URGENCY: Record<InspectionStatus, number> = { overdue: 0, never: 1, due: 2, recent: 3 };

// List, map, query-bar counts and the picker all ask for the same few results; each sites array keeps
// its own small memo, so a repeat (or a selection change, which leaves the filter alone) costs nothing
// and returns the same array, which keeps memoised children and the map's sources from redrawing.
const memo = new WeakMap<SiteSummary[], Map<string, SiteSummary[]>>();

/**
 * Pure filter + sort, shared by list and map so both always show the same sites.
 * The result is shared between callers: treat it as read-only.
 */
export function applySiteQuery(sites: SiteSummary[], query: SiteQuery, me: Me | null): SiteSummary[] {
  const key = JSON.stringify([query.q, query.view, query.status, query.county, query.sort, query.boundary, query.view === 'mine' ? me?.assignedSiteIds : 0]);
  let byKey = memo.get(sites);
  if (!byKey) memo.set(sites, (byKey = new Map()));
  let hit = byKey.get(key);
  if (!hit) {
    if (byKey.size > 50) byKey.clear(); // typed searches add keys; keep it small
    byKey.set(key, (hit = filterSites(sites, query, me)));
  }
  return hit;
}

function filterSites(sites: SiteSummary[], query: SiteQuery, me: Me | null): SiteSummary[] {
  const q = query.q.trim().toLowerCase();
  const mine = new Set(me?.assignedSiteIds ?? []);
  const out = sites.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) && !(s.county ?? '').toLowerCase().includes(q)) return false;
    if (query.view === 'mine' && !mine.has(s.id)) return false;
    if (query.view === 'overdue' && s.status !== 'overdue') return false;
    if (query.view === 'never' && s.status !== 'never') return false;
    if (query.status.length && !query.status.includes(s.status)) return false;
    if (query.county.length && !query.county.includes(s.county ?? 'Unknown')) return false;
    // center comes from the linked boundary's geometry, so no center means no boundary.
    if (query.boundary && (s.center !== null) !== (query.boundary === 'with')) return false;
    return true;
  });
  const byName = (a: SiteSummary, b: SiteSummary) => a.name.localeCompare(b.name);
  if (query.sort === 'name') return out.sort(byName);
  if (query.sort === 'recent')
    return out.sort((a, b) => (a.daysSince ?? Infinity) - (b.daysSince ?? Infinity) || byName(a, b));
  return out.sort(
    (a, b) => URGENCY[a.status] - URGENCY[b.status] || (b.daysSince ?? 0) - (a.daysSince ?? 0) || byName(a, b),
  );
}

export const STATUS_LABEL: Record<InspectionStatus, string> = {
  recent: 'Up to date',
  due: 'Due',
  overdue: 'Overdue',
  never: 'Never inspected',
};

export const STATUS_COLOR: Record<InspectionStatus, string> = {
  recent: 'var(--st-recent)',
  due: 'var(--st-due)',
  overdue: 'var(--st-overdue)',
  never: 'var(--st-never)',
};

/** Status colour for text on light surfaces (AA contrast). */
export const STATUS_INK: Record<InspectionStatus, string> = {
  recent: 'var(--st-recent-ink)',
  due: 'var(--st-due-ink)',
  overdue: 'var(--st-overdue-ink)',
  never: 'var(--st-never-ink)',
};

/** "26 months", "3 weeks", "today". */
export function ago(days: number | null): string {
  if (days === null) return 'never';
  if (days < 1) return 'today';
  if (days < 14) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  if (days < 730) return `${Math.round(days / 30.4)} months`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')} years`;
}
