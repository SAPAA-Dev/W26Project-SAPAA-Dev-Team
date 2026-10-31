'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { InspectionStatus, SiteSummary } from '@/lib/api/v1/types';
import { STATUS_COLOR, STATUS_INK, STATUS_LABEL } from '../../_lib/siteQuery';
import { HEADING, since, siteHref, TNUM } from './ui';
import { siteIntent } from './useSites';

const ORDER: InspectionStatus[] = ['overdue', 'never', 'due', 'recent'];
const NEXT_UP = 4;

/**
 * Wide screens only: fills the column under the quick actions with the picture the headline summarises.
 * Each status row filters the list on the right; the sites below are the ones that most need a visit.
 */
export default function Overview({
  sites,
  active,
  onPick,
}: {
  sites: SiteSummary[];
  active: InspectionStatus[];
  onPick: (status: InspectionStatus[]) => void;
}) {
  const count = (s: InspectionStatus) => sites.filter((x) => x.status === s).length;
  const urgent = sites
    .filter((s) => s.status !== 'recent')
    .sort((a, b) => (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity))
    .slice(0, NEXT_UP);

  return (
    <div className="mt-6 hidden flex-col gap-4 md:flex">
      <section
        aria-labelledby="overview-status"
        className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)] p-4"
      >
        <h2 id="overview-status" style={HEADING} className="text-lg font-bold">
          Inspection status
        </h2>
        <ul className="mt-2 flex flex-col">
          {ORDER.map((s) => {
            const n = count(s);
            const on = active.length === 1 && active[0] === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={n === 0}
                  aria-pressed={on}
                  onClick={() => onPick(on ? [] : [s])}
                  className="press block w-full rounded-[var(--radius-m)] px-2 py-2 text-left hover:bg-[var(--bg)] disabled:cursor-default disabled:opacity-50 aria-pressed:bg-[var(--bg-sunken)]"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold" style={{ color: STATUS_INK[s] }}>
                      {STATUS_LABEL[s]}
                    </span>
                    <span className={`text-sm font-bold ${TNUM}`}>{n}</span>
                  </span>
                  <span aria-hidden className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${sites.length ? (n / sites.length) * 100 : 0}%`, background: STATUS_COLOR[s] }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {urgent.length > 0 && (
        <section
          aria-labelledby="overview-next"
          className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)] p-4"
        >
          <h2 id="overview-next" style={HEADING} className="text-lg font-bold">
            Needs a visit
          </h2>
          <ul className="mt-1 divide-y divide-[var(--line)]">
            {urgent.map((s) => (
              <li key={s.id}>
                <Link
                  href={siteHref(s.slug)}
                  {...siteIntent(s.slug)}
                  className="press flex items-center gap-2 py-3 hover:text-[var(--forest)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{s.name}</span>
                    <span className="block text-[13px]" style={{ color: STATUS_INK[s.status] }}>
                      {since(s.daysSince)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden size={18} className="shrink-0 text-[var(--ink-2)]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
