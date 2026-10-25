'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { InspectionStatus, Me, SiteSummary } from '@/lib/api/v1/types';
import { applySiteQuery, STATUS_COLOR, STATUS_LABEL, type SiteQuery, type SortKey } from '../../_lib/siteQuery';
import { Sheet, useOpenKey } from '../flows/ui';
import { TNUM } from './ui';

const STATUSES: InspectionStatus[] = ['overdue', 'due', 'never', 'recent'];
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'urgency', label: 'Most urgent' },
  { key: 'name', label: 'Name' },
  { key: 'recent', label: 'Recently visited' },
];

type Filters = Pick<SiteQuery, 'status' | 'county' | 'sort' | 'boundary'>;

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

// Native checkbox/radio inside a pill: real form semantics, styled through :has().
const pill =
  'press flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold has-checked:border-transparent has-checked:bg-[var(--accent)] has-checked:text-[var(--on-accent)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--honey)]';
const legend = 'mb-2 text-[15px] font-bold';

interface Props {
  open: boolean;
  sites: SiteSummary[];
  me: Me | null;
  query: SiteQuery;
  onApply: (f: Filters) => void;
  onClose: () => void;
}

/** Mounted on first open, kept for the exit slide, and remounted on each open so staging starts from the URL. */
export default function FilterSheet(props: Props) {
  const key = useOpenKey(props.open);
  return key ? <Filters key={key} {...props} /> : null;
}

/** Changes are staged here and applied by "Show N sites", so the list never jumps behind the sheet. */
function Filters({ open, sites, me, query, onApply, onClose }: Props) {
  const [status, setStatus] = useState(query.status);
  const [county, setCounty] = useState(query.county);
  const [sort, setSort] = useState(query.sort);
  const [boundary, setBoundary] = useState(query.boundary);
  const [find, setFind] = useState('');

  const total = useMemo(
    () => applySiteQuery(sites, { ...query, status, county, sort, boundary }, me).length,
    [sites, query, status, county, sort, boundary, me],
  );
  const counties = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sites) m.set(s.county ?? 'Unknown', (m.get(s.county ?? 'Unknown') ?? 0) + 1);
    return [...m].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sites]);
  const f = find.trim().toLowerCase();
  const shownCounties = counties.filter(([c]) => c.toLowerCase().includes(f));

  return (
    <Sheet
      open={open}
      title="Filter sites"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setStatus([]);
              setCounty([]);
              setSort('urgency');
              setBoundary(undefined);
            }}
            className="press h-12 rounded-full px-4 text-[15px] font-semibold text-[var(--ink)] underline-offset-4 hover:underline"
          >
            Clear all
          </button>
          <button
            type="button"
            disabled={total === 0}
            onClick={() => {
              onApply({ status, county, sort, boundary });
              onClose();
            }}
            className={`press h-12 flex-1 rounded-full bg-[var(--accent)] text-[15px] font-bold text-[var(--on-accent)] disabled:opacity-45 ${TNUM}`}
          >
            {total === 0 ? 'No sites match' : `Show ${total} site${total === 1 ? '' : 's'}`}
          </button>
        </div>
      }
    >
      <fieldset>
        <legend className={legend}>Status</legend>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <label key={s} className={pill}>
              <input
                type="checkbox"
                className="sr-only"
                checked={status.includes(s)}
                onChange={() => setStatus((v) => toggle(v, s))}
              />
              <span aria-hidden className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className={legend}>Sort by</legend>
        <div className="flex flex-wrap gap-2">
          {SORTS.map((o) => (
            <label key={o.key} className={pill}>
              <input
                type="radio"
                name="site-sort"
                className="sr-only"
                checked={sort === o.key}
                onChange={() => setSort(o.key)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      {me?.role === 'admin' && (
        <fieldset className="mt-6">
          <legend className={legend}>Boundary</legend>
          <div className="flex flex-wrap gap-2">
            {([[undefined, 'Any'], ['with', 'Has a boundary'], ['without', 'No boundary']] as const).map(([v, label]) => (
              <label key={label} className={pill}>
                <input type="radio" name="site-boundary" className="sr-only" checked={boundary === v} onChange={() => setBoundary(v)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-6">
        <legend className={legend}>
          County{county.length > 0 && <span className="font-semibold text-[var(--ink-2)]"> · {county.length} selected</span>}
        </legend>
        <label className="flex h-12 items-center gap-2 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--honey)]">
          <Search aria-hidden size={18} className="shrink-0 text-[var(--ink-2)]" />
          <span className="sr-only">Search counties</span>
          <input
            type="text"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder="Search counties"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-base"
            style={{ outline: 'none' }}
          />
        </label>
        <ul className="mt-1">
          {shownCounties.map(([c, n]) => (
            <li key={c}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[var(--line)] py-2 text-base">
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-[var(--accent)]"
                  checked={county.includes(c)}
                  onChange={() => setCounty((v) => toggle(v, c))}
                />
                <span className="flex-1">{c}</span>
                <span className={`text-sm text-[var(--ink-2)] ${TNUM}`}>{n}</span>
              </label>
            </li>
          ))}
          {shownCounties.length === 0 && <li className="py-4 text-sm text-[var(--ink-2)]">No county matches “{find}”.</li>}
        </ul>
      </fieldset>
    </Sheet>
  );
}
