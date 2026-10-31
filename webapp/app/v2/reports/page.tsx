'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo } from 'react';
import { ChevronRight, FilePen } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { Report } from '@/lib/api/v1/types';
import { useApi } from '@/app/v2/_lib/useApi';
import { useDrafts } from '@/app/v2/_components/flows/drafts';
import { AdminArchivedReports } from '@/app/v2/_components/admin/lazy';
import { formatDate, monthLabel, reportPerson, since } from '@/app/v2/_components/flows/format';
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  NaturalnessPill,
  PageHeader,
  SearchField,
  Segmented,
  btn,
  card,
  tabBarPadding,
  useNow,
  useUrlParam,
} from '@/app/v2/_components/flows/ui';

type Who = 'mine' | 'all';

export default function ReportsPage() {
  const reports = useApi('reports', api.reports);
  const me = useApi('me', api.me);
  const drafts = useDrafts(me.data?.userId);
  const now = useNow(drafts.length ? 30_000 : null);
  const [whoParam, setWho] = useUrlParam('who', 'mine');
  const [q, setQ] = useUrlParam('q');
  const who: Who = whoParam === 'all' ? 'all' : 'mine';

  const all = reports.data;
  // The search box shows each keystroke at once; filtering and redrawing the list follow at lower priority.
  const shownQ = useDeferredValue(q);
  const list = useMemo(() => {
    const term = shownQ.trim().toLowerCase();
    return (all ?? [])
      .filter((r) => who === 'all' || r.isOwn)
      .filter((r) => !term || [r.siteName, r.inspectionNo, reportPerson(r)].some((s) => s?.toLowerCase().includes(term)))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.id - a.id);
  }, [all, who, shownQ]);

  const groups = useMemo(() => {
    const out = new Map<string, Report[]>();
    for (const r of list) {
      const k = r.date?.slice(0, 7) ?? 'none';
      out.set(k, [...(out.get(k) ?? []), r]);
    }
    return [...out];
  }, [list]);

  const mineCount = all?.filter((r) => r.isOwn).length ?? 0;

  return (
    <>
      <PageHeader eyebrow={all ? `${all.length.toLocaleString('en-CA')} inspections on file` : reports.error ? null : undefined} title="Reports" action={<AdminArchivedReports />}>
        <div className="flex gap-2">
          <Segmented<Who>
            label="Whose reports"
            value={who}
            onChange={setWho}
            options={[
              ['mine', 'Yours'],
              ['all', 'All'],
            ]}
          />
          <SearchField label="Search reports" placeholder="Search reports" value={q} onChange={setQ} />
        </div>
      </PageHeader>

      <main className="mx-auto max-w-3xl px-4 pt-2 md:px-8" style={tabBarPadding}>
        {drafts.length > 0 && (
          <section aria-labelledby="drafts-h" className="mb-7">
            <h2 id="drafts-h" className="text-[15px] font-bold">
              Drafts on this device
            </h2>
            <ul className="mt-2 space-y-2">
              {drafts.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/v2/sites/${encodeURIComponent(d.slug)}/inspect`}
                    className={`${card} lift flex min-h-16 items-center gap-3 py-3 pr-3 pl-4 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-[var(--honey)]`}
                  >
                    <FilePen size={20} aria-hidden className="shrink-0 text-[var(--st-due-ink)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{d.siteName}</span>
                      <span className="block text-sm text-[var(--ink-2)]">
                        Section <span className="num">{Math.min(d.sectionIndex + 1, d.sectionCount)}</span> of{' '}
                        <span className="num">{d.sectionCount}</span>, saved {since(now - d.updatedAt)}
                      </span>
                    </span>
                    <span className="text-[15px] font-bold">Resume</span>
                    <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {reports.error ? (
          <ErrorState title="Reports did not load" error={reports.error} onRetry={reports.refetch} />
        ) : !all ? (
          <ListSkeleton label="Loading reports" />
        ) : list.length === 0 ? (
          q.trim() ? (
            <EmptyState title={`No reports match “${q.trim()}”`} body="Try a site name, a report number like 2026-118, or a steward’s name.">
              <button type="button" onClick={() => setQ('')} className={btn.secondary}>
                Clear search
              </button>
            </EmptyState>
          ) : who === 'mine' ? (
            <EmptyState title="You have not filed a report yet" body="Reports you submit appear here, newest first.">
              <Link href="/v2/sites" className={btn.primary}>
                Find a site to inspect
              </Link>
              <button type="button" onClick={() => setWho('all')} className={btn.secondary}>
                Show all reports
              </button>
            </EmptyState>
          ) : (
            <EmptyState title="No reports yet" body="Reports appear here once a steward submits an inspection." />
          )
        ) : (
          <>
            <p className="sr-only" role="status">
              {list.length} {list.length === 1 ? 'report' : 'reports'}
              {who === 'mine' ? ' of yours' : ''}
            </p>
            {who === 'mine' && (
              <p className="mb-1 text-sm text-[var(--ink-2)]">
                <span className="num font-semibold text-[var(--ink)]">{mineCount}</span> filed by you
              </p>
            )}
            {groups.map(([k, items]) => (
              // Below-the-fold months rise in as they scroll into view, and skip layout until near.
              <section key={k} aria-labelledby={`m-${k}`} className="reveal mt-5 [contain-intrinsic-size:auto_400px] [content-visibility:auto] first-of-type:mt-1">
                <div className="flex items-baseline justify-between py-2">
                  <h2 id={`m-${k}`} className="text-[15px] font-bold">
                    {k === 'none' ? 'No date' : monthLabel(k)}
                  </h2>
                  <span className="num text-[13px] text-[var(--ink-2)]">
                    {items.length} {items.length === 1 ? 'report' : 'reports'}
                  </span>
                </div>
                <ul className={`${card} divide-y divide-[var(--line)] overflow-hidden`}>
                  {items.map((r) => (
                    <li key={r.id}>
                      <ReportRow r={r} showPerson={who === 'all'} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>
    </>
  );
}

/** Date · number, as on the You page. On "Yours" every row is yours, so the person is left off. */
function ReportRow({ r, showPerson }: { r: Report; showPerson: boolean }) {
  const person = r.isOwn ? 'You' : reportPerson(r) ?? 'Unknown steward';
  return (
    <Link
      href={`/v2/reports/${r.id}`}
      className="press flex min-h-16 items-center gap-3 px-4 py-3 [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold">{r.siteName}</span>
        <span className="mt-0.5 flex flex-wrap gap-x-1.5 text-sm text-[var(--ink-2)]">
          <span className="whitespace-nowrap">{formatDate(r.date)}</span>
          <span className="num whitespace-nowrap">· {r.inspectionNo ?? `#${r.id}`}</span>
          {showPerson && <span className="min-w-0 truncate">· {person}</span>}
        </span>
      </span>
      <NaturalnessPill value={r.naturalness} />
      <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
    </Link>
  );
}
