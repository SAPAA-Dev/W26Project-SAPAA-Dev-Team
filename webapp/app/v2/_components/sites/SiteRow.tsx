'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { InspectionStatus, SiteSummary } from '@/lib/api/v1/types';
import { STATUS_COLOR, STATUS_INK, STATUS_LABEL } from '../../_lib/siteQuery';
import { since, siteHref } from './ui';
import { siteIntent } from './useSites';

/** Status dot + label. Colour is never the only signal. */
export function StatusTag({ status, className = '' }: { status: InspectionStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[13px] font-semibold leading-4 ${className}`}
      style={{ color: STATUS_INK[status] }}
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
        style={{ background: STATUS_COLOR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * "3 days ago · Parkland County · Natural Area": wraps between parts, never inside one (the separator rides
 * with the part after it). `oneLine` keeps it to a single line and lets the last part ellipsize.
 */
export function MetaLine({
  parts,
  oneLine = false,
  className = '',
}: {
  parts: (string | null | false | undefined)[];
  oneLine?: boolean;
  className?: string;
}) {
  const list = parts.filter(Boolean) as string[];
  return (
    <span className={`flex gap-x-1.5 ${oneLine ? 'overflow-hidden' : 'flex-wrap'} ${className}`}>
      {list.map((p, i) => (
        <span
          key={i}
          className={!oneLine ? 'max-w-full truncate' : i < list.length - 1 ? 'shrink-0 whitespace-nowrap' : 'min-w-0 truncate'}
        >
          {i ? `· ${p}` : p}
        </span>
      ))}
    </span>
  );
}

interface Props {
  site: SiteSummary;
  onSelect?: () => void;
  selected?: boolean;
  /** One-line meta (map sheet), so every row is the same height. */
  oneLine?: boolean;
}

/** Memoised: a filter change re-renders only the rows that are new, not all of them. */
export default memo(function SiteRow({ site, onSelect, selected, oneLine }: Props) {
  // Time first: it is what a steward scans for.
  const meta = [site.daysSince === null ? null : since(site.daysSince), site.county ?? 'County unknown', site.areaType];
  const label = `${site.name}, ${STATUS_LABEL[site.status]}, ${meta.filter(Boolean).join(', ')}`;
  // A full-width row only gives a hair under the thumb; the chevron leans toward where the row goes.
  const cls = `press group flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)] ${
    selected ? 'bg-[var(--bg-sunken)] shadow-[inset_3px_0_0_var(--accent)]' : ''
  }`;
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <StatusTag status={site.status} />
        <span className="mt-1 block text-base font-bold leading-[22px] text-[var(--ink)]">{site.name}</span>
        <MetaLine parts={meta} oneLine={oneLine} className="mt-0.5 text-sm leading-5 text-[var(--ink-2)]" />
      </span>
      <ChevronRight
        aria-hidden
        size={20}
        className="shrink-0 text-[var(--ink-2)] transition-transform duration-[var(--dur-2)] ease-[var(--ease-out)] group-hover:translate-x-0.5"
      />
    </>
  );

  if (onSelect)
    return (
      <button type="button" onClick={onSelect} aria-label={label} aria-pressed={selected} className={cls}>
        {body}
      </button>
    );
  return (
    <Link href={siteHref(site.slug)} aria-label={label} className={cls} {...siteIntent(site.slug)}>
      {body}
    </Link>
  );
});
