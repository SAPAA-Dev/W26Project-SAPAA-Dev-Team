'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  ClipboardPen,
  Clock,
  Navigation,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { InspectionStatus, SiteSummary } from '@/lib/api/v1/types';
import { STATUS_INK, STATUS_LABEL } from '../../_lib/siteQuery';
import { TNUM, fmtDate, sinceVisit } from '../sites/ui';
import { NaturalBar, naturalLabel } from '../site/Naturalness';

const STATUS_ICON: Record<InspectionStatus, typeof Clock> = {
  overdue: TriangleAlert,
  due: Clock,
  recent: CircleCheck,
  never: CircleDashed,
};

/** Heavy, slightly condensed display face: Avenir Next Condensed on Apple, Nunito Sans at wdth 82 elsewhere. */
const DISPLAY = {
  fontFamily: "'Avenir Next Condensed', var(--font-nunito), 'Avenir Next', system-ui, sans-serif",
  fontStretch: '82%',
} as const;

interface Props {
  site: SiteSummary;
  /** Position in the filtered list, for prev/next. */
  index: number;
  total: number;
  /** +1 after "next", -1 after "previous": the card slides the way the user moved. */
  direction: 1 | -1;
  onStep: (dir: 1 | -1) => void;
  onClose: (viaKeyboard: boolean) => void;
}

export default function SiteCard({ site, index, total, direction, onStep, onClose }: Props) {
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const [big, unit] = sinceVisit(site.daysSince);
  const Icon = STATUS_ICON[site.status];
  const ink = STATUS_INK[site.status];
  const last = site.lastInspection ? fmtDate(site.lastInspection) : null;
  const nat = site.avgNaturalness;
  const slug = encodeURIComponent(site.slug);
  const shift = reduce ? 0 : 28;

  // Opening the card moves focus to it, so screen readers announce the site.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);

  return (
    <div
      className="px-5 pb-5"
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose(true); }
        if ((e.target as HTMLElement).closest('input, textarea')) return;
        if (e.key === 'ArrowLeft' && index > 0) onStep(-1);
        if (e.key === 'ArrowRight' && index < total - 1) onStep(1);
      }}
    >
      {/* Stepper + close */}
      <div className="-mx-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={index <= 0}
          aria-label="Previous site"
          className="press grid size-11 place-items-center rounded-full text-[var(--ink)] hover:bg-[var(--bg-sunken)] disabled:opacity-35"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <span className={`min-w-14 ${TNUM} text-center text-[13px] font-semibold text-[var(--ink-2)]`}>
          {index + 1} of {total}
        </span>
        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={index >= total - 1}
          aria-label="Next site"
          className="press grid size-11 place-items-center rounded-full text-[var(--ink)] hover:bg-[var(--bg-sunken)] disabled:opacity-35"
        >
          <ChevronRight size={22} aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => onClose(e.detail === 0)}
          aria-label="Close and show the list"
          className="press ml-auto grid size-11 place-items-center rounded-full bg-[var(--bg-sunken)] text-[var(--ink)] hover:bg-[var(--line)]"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <m.div
          key={site.slug}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * shift, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: -d * shift, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-2 text-[27px] leading-[1.05] font-extrabold tracking-[-0.01em] text-[var(--ink)] outline-none"
            style={DISPLAY}
          >
            {site.name}
          </h2>
          <p className="mt-1 text-[14px] text-[var(--ink-2)]">
            {[site.areaType, site.county].filter(Boolean).join(' · ') || 'Area type not recorded'}
          </p>

          {/* The number a steward acts on */}
          <div className="mt-4 flex items-end justify-between gap-3 border-y border-[var(--line)] py-3">
            <p className="leading-none" style={{ color: ink }}>
              <span className={`block text-[52px] font-extrabold tracking-[-0.02em] ${TNUM}`} style={DISPLAY}>
                {big}
              </span>
              <span className="mt-1 block text-[14px] font-semibold">{unit}</span>
            </p>
            <p className="pb-0.5 text-right">
              <span className="inline-flex items-center gap-1.5 text-[14px] font-bold" style={{ color: ink }}>
                <Icon size={17} aria-hidden />
                {STATUS_LABEL[site.status]}
              </span>
              <span className="block text-[13px] text-[var(--ink-2)]">{last ? `Last visit ${last}` : 'No visit on record'}</span>
            </p>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
            <div>
              <dt className="text-[12px] font-semibold text-[var(--ink-2)]">Naturalness</dt>
              <dd className="mt-0.5 font-bold">
                {nat === null ? (
                  <span className="font-normal text-[var(--ink-2)]">Not rated yet</span>
                ) : (
                  <>
                    {naturalLabel(nat)}{' '}
                    <span className={`font-normal text-[var(--ink-2)] ${TNUM}`}>({nat.toFixed(1)} of 4)</span>
                    <span className="mt-1.5 flex">
                      <NaturalBar score={nat} />
                    </span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-[var(--ink-2)]">Steward</dt>
              <dd className="mt-0.5 font-bold">
                {site.steward?.name ?? <span className="font-normal text-[var(--ink-2)]">No steward yet</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-[var(--ink-2)]">Reports</dt>
              <dd className={`mt-0.5 font-bold ${TNUM}`}>{site.reportCount} filed</dd>
            </div>
            {site.hectares !== null && (
              <div>
                <dt className="text-[12px] font-semibold text-[var(--ink-2)]">Size</dt>
                <dd className={`mt-0.5 font-bold ${TNUM}`}>{Math.round(site.hectares).toLocaleString('en-CA')} ha</dd>
              </div>
            )}
          </dl>
        </m.div>
      </AnimatePresence>

      <div className="mt-5 space-y-2">
        <Link
          href={`/v2/sites/${slug}/inspect`}
          className="press flex h-[52px] items-center justify-center gap-2 rounded-[var(--radius-m)] bg-[var(--forest)] text-[16px] font-bold text-[var(--birch)] hover:bg-[var(--forest-2)]"
        >
          <ClipboardPen size={19} aria-hidden />
          Start inspection
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/v2/sites/${slug}`}
            className="press flex h-12 items-center justify-center rounded-[var(--radius-m)] border border-[var(--line)] text-[15px] font-bold text-[var(--ink)] hover:bg-[var(--bg-sunken)]"
          >
            Details
          </Link>
          {site.center ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${site.center[1]},${site.center[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex h-12 items-center justify-center gap-1.5 rounded-[var(--radius-m)] border border-[var(--line)] text-[15px] font-bold text-[var(--ink)] hover:bg-[var(--bg-sunken)]"
            >
              <Navigation size={16} aria-hidden />
              Directions
              <span className="sr-only">(opens Google Maps)</span>
            </a>
          ) : (
            <span className="flex h-12 items-center justify-center rounded-[var(--radius-m)] border border-dashed border-[var(--line)] text-[14px] text-[var(--ink-2)]">
              No location on file
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
