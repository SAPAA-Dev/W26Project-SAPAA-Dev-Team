'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { AlertCircle, Check, ChevronRight, ExternalLink, Phone, X } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import { useApi } from '@/app/v2/_lib/useApi';
import PhotoHero from '@/app/v2/_components/sites/PhotoHero';
import { HEADING } from '@/app/v2/_components/sites/ui';
import { Eyebrow, btn, card, heroTitle } from '@/app/v2/_components/flows/ui';
import { SEASON_GOAL, seasonVisits, siteHref } from '@/app/v2/_components/flows/format';

/** Thumb-zone action bar pinned to the bottom of the full-screen flow. `hint` is a line above the buttons. */
export function ActionBar({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg)]"
      style={{ paddingBottom: 'var(--safe-b)' }}
    >
      {hint && <div className="mx-auto max-w-3xl px-4 pt-2.5 text-center text-sm text-[var(--ink-2)] md:px-8">{hint}</div>}
      <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3 md:px-8">{children}</div>
    </div>
  );
}

/* ---------- step 0: before you go ---------- */

const CONTACTS = [
  {
    title: 'An emergency',
    detail: 'Or call your local RCMP or police detachment.',
    number: '911',
    tel: '911',
  },
  {
    title: 'Damage or illegal activity on public land',
    detail: 'Alberta’s line for public land and public safety.',
    number: '310-LAND',
    tel: '3105263',
    link: { href: 'https://www.alberta.ca/report-illegal-activity-call-310-land', label: 'About 310-LAND' },
  },
  {
    title: 'Poaching or a dangerous wildlife encounter',
    detail: 'Report A Poacher, open every day.',
    number: '1-800-642-3800',
    tel: '18006423800',
    link: { href: 'https://www.alberta.ca/report-poacher', label: 'Report online' },
  },
];

export function SafetyStep({ siteName, onStart, onCancel }: { siteName: string; onStart: () => void; onCancel: () => void }) {
  const [agree, setAgree] = useState(false);
  const pathname = usePathname();
  return (
    <div className="min-h-dvh" style={{ paddingBottom: 'calc(128px + var(--safe-b))' }}>
      <PhotoHero className="pb-8 text-[var(--birch)]">
        <div className="mx-auto max-w-3xl px-5 pt-[max(12px,env(safe-area-inset-top))] md:px-8">
          <button type="button" onClick={onCancel} aria-label="Close and go back to the site" className={`${btn.onPhoto} -ml-1`}>
            <X size={22} aria-hidden />
          </button>
          <div className="mt-10 md:mt-16">
            <Eyebrow>{siteName}</Eyebrow>
            <h1 style={HEADING} className={heroTitle}>
              Before you go
            </h1>
            <p className="mt-3 max-w-[36ch] text-[17px] leading-relaxed">
              This form records a site inspection. Nobody watches it in real time, so it is not the way to report an
              emergency.
            </p>
          </div>
        </div>
      </PhotoHero>

      <div className="mx-auto max-w-3xl px-4 pt-6 md:px-8">
        <h2 style={HEADING} className="text-lg font-bold">
          Call instead if you find
        </h2>
        <ul className={`mt-3 divide-y divide-[var(--line)] overflow-hidden ${card}`}>
          {CONTACTS.map((c) => (
            <li key={c.number}>
              <a
                href={`tel:${c.tel}`}
                aria-label={`${c.title}: call ${c.number}`}
                className="press flex min-h-16 items-start gap-3 px-4 pt-3.5 pb-3 [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--canopy)] text-[var(--honey)]">
                  <Phone size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] leading-snug font-semibold">{c.title}</span>
                  <span className="num block text-[17px] leading-snug font-bold">{c.number}</span>
                  <span className="mt-0.5 block text-sm text-[var(--ink-2)]">{c.detail}</span>
                </span>
              </a>
              {c.link && (
                <a
                  href={c.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 ml-[68px] inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline underline-offset-2"
                >
                  {c.link.label}
                  <ExternalLink size={14} aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ul>

        <label
          className={`mt-6 flex cursor-pointer gap-3 rounded-[var(--radius-l)] border bg-[var(--surface)] p-4 transition-colors ${
            agree ? 'border-[var(--accent)]' : 'border-[var(--line)]'
          }`}
        >
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            aria-label="I understand this form is not for emergencies, and I agree to the terms and conditions"
            className="mt-0.5 size-6 shrink-0 accent-[var(--forest)]"
          />
          <span className="text-[16px] leading-relaxed">
            I understand this form is for site inspections, not emergencies, and that I carry out this inspection on my
            own accord. I have read and agree to the{' '}
            <Link href={{ pathname: '/terms', query: { from: pathname } }} className="font-semibold underline underline-offset-2">
              terms and conditions
            </Link>
            .
          </span>
        </label>
      </div>

      <ActionBar hint={!agree && <p id="safety-hint">Tick the box to start.</p>}>
        <button type="button" onClick={onCancel} className={`${btn.secondary} flex-1`}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!agree}
          onClick={onStart}
          aria-describedby={agree ? undefined : 'safety-hint'}
          className={`${btn.primary} flex-[2]`}
        >
          Start inspection
        </button>
      </ActionBar>
    </div>
  );
}

/* ---------- last step: review ---------- */

export interface Issue {
  key: string;
  sectionIndex: number;
  questionId: number;
  title: string;
  section: string;
  message: string;
}

export function ReviewStep({
  issues,
  sections,
  answered,
  total,
  submitError,
  onJump,
}: {
  issues: Issue[];
  sections: { title: string; answered: number; total: number; left: number }[];
  answered: number;
  total: number;
  submitError: string | null;
  onJump: (sectionIndex: number, questionId?: number) => void;
}) {
  return (
    <>
      <p className="mt-2 text-[17px] text-[var(--ink-2)]">
        <span className="num font-bold text-[var(--ink)]">{answered}</span> of <span className="num">{total}</span> questions
        answered.
      </p>

      {issues.length > 0 ? (
        <section aria-labelledby="needs-h" className="mt-6">
          <h3 id="needs-h" className="flex items-center gap-2 text-[17px] font-bold">
            <AlertCircle size={20} aria-hidden className="text-[var(--clay-ink)]" />
            {issues.length === 1 ? '1 thing to finish' : `${issues.length} things to finish`}
          </h3>
          <ul className={`mt-3 divide-y divide-[var(--line)] overflow-hidden ${card}`}>
            {issues.map((i) => (
              <li key={i.key}>
                <button
                  type="button"
                  onClick={() => onJump(i.sectionIndex, i.questionId)}
                  className="press flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug font-semibold">{i.title}</span>
                    <span className="block text-sm text-[var(--clay-ink)]">{i.message}</span>
                    <span className="block text-sm text-[var(--ink-2)]">{i.section}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 flex items-center gap-3 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)] p-4 text-[16px] font-semibold">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--moss)] text-[var(--canopy)]">
            <Check size={18} strokeWidth={3} aria-hidden />
          </span>
          Every required question is answered. Your report is ready to submit.
        </p>
      )}

      <section aria-labelledby="sections-h" className="mt-8">
        <h3 id="sections-h" className="text-[17px] font-bold">
          Sections
        </h3>
        <ul className={`mt-3 divide-y divide-[var(--line)] overflow-hidden ${card}`}>
          {sections.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onJump(i)}
                className="press flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]"
              >
                <span className="min-w-0 flex-1 font-semibold">{s.title}</span>
                <span className="num text-sm text-[var(--ink-2)]">
                  {s.answered}/{s.total}
                </span>
                {s.left > 0 ? (
                  <span className="num text-sm font-semibold text-[var(--clay-ink)]">{s.left} left</span>
                ) : (
                  s.answered > 0 && <Check size={18} strokeWidth={3} aria-label="complete" className="text-[var(--st-recent-ink)]" />
                )}
                <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {submitError && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-[var(--radius-l)] border border-[var(--clay-ink)] bg-[var(--surface)] p-4 text-[15px] font-semibold text-[var(--clay-ink)]">
          <AlertCircle size={18} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            The report was not submitted. {submitError} Your answers are still saved on this device.
          </span>
        </p>
      )}
    </>
  );
}

/* ---------- after submit: the peak-end moment ---------- */

export function SuccessScreen({
  inspectionNo,
  reportId,
  siteName,
  slug,
}: {
  inspectionNo: string;
  reportId: number;
  siteName: string;
  slug: string;
}) {
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  // The list was invalidated on submit, so this read includes the new report.
  const reports = useApi('reports', api.reports);
  const visits = reports.data ? seasonVisits(reports.data, (r) => r.isOwn) : null;
  const shown = visits === null ? 0 : Math.min(visits, SEASON_GOAL);

  useEffect(() => heading.current?.focus(), []);

  const draw = (delay: number, duration: number) =>
    reduce ? { initial: false as const } : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay, duration, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <main
      className="flex min-h-dvh flex-col bg-[var(--canopy)] text-[var(--birch)]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'var(--safe-b)' }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <svg viewBox="0 0 96 96" className="size-24" aria-hidden fill="none">
          <circle cx="48" cy="48" r="44" stroke="var(--forest-2)" strokeWidth="4" />
          <m.circle cx="48" cy="48" r="44" stroke="var(--honey)" strokeWidth="4" strokeLinecap="round" transform="rotate(-90 48 48)" {...draw(0.1, 0.7)} />
          <m.path d="M29 49.5 41.5 62 67 35" stroke="var(--honey)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" {...draw(0.6, 0.35)} />
        </svg>
        <h1 ref={heading} tabIndex={-1} className="mt-8 text-[32px] leading-[1.1] font-bold tracking-[-0.01em] outline-none">
          Report <span className="num">{inspectionNo}</span> submitted
        </h1>
        <p className="mt-2 text-[18px] text-[var(--sage)]">{siteName}</p>

        {!reports.error && (
          <section aria-labelledby="season-h" className="mt-10 rounded-[var(--radius-l)] bg-[var(--forest)] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="season-h" className="text-[15px] font-semibold text-[var(--sage)]">
                Season goal
              </h2>
              <p className="num">
                <span className="text-[30px] leading-none font-bold [font-stretch:87.5%]">{visits ?? '–'}</span>
                <span className="text-[15px] text-[var(--sage)]"> of {SEASON_GOAL} visits</span>
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Visits this season"
              aria-valuemin={0}
              aria-valuemax={SEASON_GOAL}
              aria-valuenow={shown}
              className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--forest-2)]"
            >
              <m.div
                className="h-full origin-left rounded-full bg-[var(--honey)]"
                initial={reduce ? false : { scaleX: Math.max(0, shown - 1) / SEASON_GOAL }}
                animate={{ scaleX: shown / SEASON_GOAL }}
                transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-3 text-[15px] text-[var(--sage)]">
              {visits === null
                ? 'Counting this season’s visits…'
                : visits >= SEASON_GOAL
                  ? 'Goal reached. Thank you for looking after these places.'
                  : `${SEASON_GOAL - visits} more ${SEASON_GOAL - visits === 1 ? 'visit' : 'visits'} to reach this season’s goal.`}
            </p>
          </section>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-6 pb-6">
        <Link href={siteHref(slug)} className={btn.onDark}>
          <span className="truncate">Back to {siteName}</span>
        </Link>
        <Link href={`/v2/reports/${reportId}`} className={btn.onDarkQuiet}>
          View report
        </Link>
      </div>
    </main>
  );
}
