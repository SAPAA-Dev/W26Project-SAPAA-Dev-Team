'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { ChevronDown } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { Report, ReportAnswer } from '@/lib/api/v1/types';
import { useApi } from '../../_lib/useApi';
import { fmtDate, HEADING, TNUM, toDate } from '../sites/ui';
import { NaturalBar, naturalColor } from './Naturalness';
import { MetaLine } from '../sites/SiteRow';
import { AdminReportActions } from '../admin/lazy';
import { HiddenTag } from '../flows/HiddenTag';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Questions the card already answers (date, steward) or that only repeat the site: skipped in answer lists. */
const FILLER = /\b(date of (the )?(visit|inspection)|steward'?s? name|name of (the )?(steward|site)|site name)\b/i;
const keep = (a: ReportAnswer) => (a.value || a.comment) && !FILLER.test(a.question);

/** "2025-09-14" as a date, any other answer as written. */
const answerText = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v);

/** Answers grouped by form section, in form order, skipping blanks and filler. */
function bySection(answers: ReportAnswer[]) {
  const m = new Map<string, ReportAnswer[]>();
  for (const a of answers) {
    if (!keep(a)) continue;
    m.set(a.section, [...(m.get(a.section) ?? []), a]);
  }
  return [...m];
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] px-5 py-8 text-center text-[15px] text-[var(--ink-2)]">
      {children}
    </p>
  );
}

export function Retry({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] px-5 py-6 text-center">
      <p className="text-[15px] font-bold">{what} didn’t load.</p>
      <button
        type="button"
        onClick={onRetry}
        className="press mt-3 h-11 rounded-full bg-[var(--forest)] px-5 text-[15px] font-bold text-[var(--birch)]"
      >
        Try again
      </button>
    </div>
  );
}

export function SkeletonCards({ n = 3 }: { n?: number }) {
  return (
    <ul aria-hidden className="flex flex-col gap-3">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="h-[104px] animate-pulse rounded-[var(--radius-m)] bg-[var(--bg-sunken)]" />
      ))}
    </ul>
  );
}

/* ---------------- Reports: a trunk timeline, newest first; each card expands to its answers ---------------- */

/** 16px spruce, tinted on the naturalness ramp (pale to deep forest); the card says it in words. Unrated: an outline sapling. */
function Spruce({ score }: { score: number | null }) {
  const color = naturalColor(score) ?? 'var(--lichen)';
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden style={{ color }}>
      <path
        d="M8 .8 11 5H9.6l2.8 4h-2l3.1 4h-11l3.1-4h-2l2.8-4H5z"
        fill={score === null ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={score === null ? 1.2 : 0}
        strokeLinejoin="round"
      />
      <path d="M7.25 13h1.5v2.4h-1.5z" fill="currentColor" />
    </svg>
  );
}

/** Newest first (undated last), grouped by year. */
function byYear(reports: Report[]) {
  const sorted = [...reports].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const out: { year: string; list: Report[] }[] = [];
  for (const r of sorted) {
    const year = r.date ? String(toDate(r.date).getFullYear()) : 'Undated';
    if (out.at(-1)?.year === year) out.at(-1)!.list.push(r);
    else out.push({ year, list: [r] });
  }
  return out;
}

export function ReportTimeline({ reports }: { reports: Report[] }) {
  if (!reports.length) return <Note>No reports yet. The first inspection starts this site’s history.</Note>;
  return (
    <div className="relative">
      {/* The trunk: a faint track, and over it a line that grows down as you read (CSS scroll timeline). */}
      <span aria-hidden className="absolute top-3.5 bottom-4 left-[10px] w-0.5 rounded-full bg-[var(--line)]">
        <span className="trunk-grow absolute inset-0 rounded-full bg-[var(--lichen)]" />
      </span>
      <ol>
        {byYear(reports).map(({ year, list }, yi, years) => (
          <li key={year} className="relative not-first:mt-2">
            <p className={`relative py-1.5 pl-8 text-[11px] leading-4 font-bold tracking-[0.14em] text-[var(--st-due-ink)] uppercase ${TNUM}`}>
              <span
                aria-hidden
                className="absolute top-1/2 left-[8px] size-1.5 -translate-y-1/2 rounded-full bg-[var(--honey)] ring-2 ring-[var(--bg)]"
              />
              {year}
            </p>
            <ol>
              {list.map((r, ri) => (
                <li key={r.id} className="relative pb-3 pl-8">
                  {/* The trunk ends at the last spruce: paper hides the rest of the line behind the last card. */}
                  {yi === years.length - 1 && ri === list.length - 1 && (
                    <span aria-hidden className="absolute top-[38px] bottom-0 left-0 w-[22px] bg-[var(--bg)]" />
                  )}
                  <span aria-hidden className="absolute top-[18px] left-0 grid h-5 w-[22px] place-items-center bg-[var(--bg)]">
                    <Spruce score={r.naturalness?.score ?? null} />
                  </span>
                  <ReportCard report={r} />
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const bodyId = useId();
  const card = useRef<HTMLElement>(null);
  const meta = [
    report.inspectionNo && `Inspection ${report.inspectionNo}`,
    (report.submittedBy || report.stewardName) &&
      `by ${report.isOwn ? 'you' : (report.submittedBy?.name ?? report.stewardName)}`,
  ];

  // Opening brings the answers into view: the scroll margins keep them clear of the phone CTA and tab bar.
  // 'nearest' leaves a card that already fits alone and pins a tall one by its top.
  useEffect(() => {
    if (open) card.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [open, reduce]);

  return (
    // Closed cards lift on hover to invite the click; an open one holds still while you read it.
    <article
      ref={card}
      className={`scroll-mt-4 scroll-mb-[calc(var(--nav-clear)+96px)] rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] md:scroll-mb-[calc(var(--nav-clear)+16px)] ${open ? '' : 'lift'}`}
    >
      <h3 style={HEADING}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-14 w-full items-start gap-3 rounded-[var(--radius-m)] p-4 text-left transition-colors duration-[var(--dur-2)] hover:bg-[var(--bg)]"
        >
          <span className="min-w-0 flex-1">
            <span className={`block text-base font-bold ${TNUM}`}>{fmtDate(report.date)}</span>
            <MetaLine parts={meta} className={`mt-0.5 text-sm font-normal text-[var(--ink-2)] ${TNUM}`} />
            {report.naturalness && (
              <span className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <NaturalBar score={report.naturalness.score} />
                {report.naturalness.label}
              </span>
            )}
          </span>
          <m.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
            className="mt-0.5 text-[var(--ink-2)]"
          >
            <ChevronDown size={20} />
          </m.span>
        </button>
      </h3>
      <AdminReportActions report={report} />
      {/* No height animation (layout work on cheap phones): the answers appear at full size and fade down 4px. */}
      {open && (
        <div
          id={bodyId}
          className="transition-[opacity,translate] duration-[var(--dur-3)] ease-[var(--ease-out)] starting:-translate-y-1 starting:opacity-0"
        >
          <Answers report={report} />
        </div>
      )}
    </article>
  );
}

function Answers({ report }: { report: Report }) {
  // The list endpoint may omit answers; fetch the full report only when a card opens.
  const full = useApi(report.answers ? null : `report:${report.id}`, () => api.report(report.id));
  const answers = report.answers ?? full.data?.answers;

  if (full.error)
    return (
      <p className="border-t border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-2)]">
        Answers didn’t load.{' '}
        <button type="button" onClick={full.refetch} className="h-11 font-semibold text-[var(--ink)] underline">
          Try again
        </button>
      </p>
    );
  if (!answers)
    return (
      <div aria-hidden className="flex flex-col gap-2 border-t border-[var(--line)] px-4 py-4">
        <span className="h-3 w-1/3 animate-pulse rounded bg-[var(--bg-sunken)]" />
        <span className="h-4 w-2/3 animate-pulse rounded bg-[var(--bg-sunken)]" />
        <span className="h-4 w-1/2 animate-pulse rounded bg-[var(--bg-sunken)]" />
      </div>
    );

  const groups = bySection(answers);
  return (
    <div className="border-t border-[var(--line)] px-4 pt-3 pb-4">
      {groups.length === 0 && <p className="text-sm text-[var(--ink-2)]">No answers recorded.</p>}
      {groups.map(([section, list]) => (
        <section key={section} className="mt-4 first:mt-0">
          <h4 style={HEADING} className="text-sm font-bold text-[var(--ink-2)]">
            {section}
          </h4>
          <dl className="mt-1.5 flex flex-col gap-2.5">
            {list.map((a, i) => (
              <div key={`${a.question}-${i}`}>
                <dt className="text-sm text-[var(--ink-2)]">
                  {a.question}
                  {a.hidden && <HiddenTag />}
                </dt>
                <dd className="text-[15px] break-words">{answerText((a.value ?? a.comment)!)}</dd>
                {a.value && a.comment && (
                  <dd className="mt-0.5 text-sm break-words text-[var(--ink-2)]">“{a.comment}”</dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/* ---------------- By question: every answer to one question, over time ---------------- */

interface Entry {
  id: number;
  date: string | null;
  value: string | null;
  comment: string | null;
  /** Older reports that gave this same answer in a row, folded into this entry. */
  same: number;
  since: string | null;
}

export function ByQuestion({ reports }: { slug: string; reports: Report[] }) {
  // /sites/:slug/reports returns every report with its answers in one read, so this is pure regrouping:
  // no request per report, no skeleton.
  const sections = useMemo(() => {
    const out = new Map<string, Map<string, Entry[]>>();
    // Admins also receive disabled reports; the comparison only uses what stewards see. Newest first, and a
    // run of identical answers folds into its newest entry ("Same in 4 reports since 2022").
    const active = reports.filter((x) => x.isActive !== false).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    for (const r of active)
      for (const a of r.answers ?? []) {
        if (!keep(a)) continue;
        const qs = out.get(a.section) ?? new Map<string, Entry[]>();
        const list = qs.get(a.question) ?? [];
        const prev = list.at(-1);
        if (prev && prev.value === a.value && prev.comment === a.comment) {
          prev.same += 1;
          prev.since = r.date;
        } else list.push({ id: r.id, date: r.date, value: a.value, comment: a.comment, same: 0, since: null });
        qs.set(a.question, list);
        out.set(a.section, qs);
      }
    return [...out].map(([s, qs]) => [s, [...qs]] as const);
  }, [reports]);

  if (!reports.length) return <Note>No answers yet. They appear here once the site has reports.</Note>;
  if (!sections.length) return <Note>These reports have no recorded answers.</Note>;

  return (
    <div className="flex flex-col gap-7">
      {sections.map(([section, questions]) => (
        <section key={section}>
          <h3 style={HEADING} className="text-base font-bold">
            {section}
          </h3>
          <ul className="mt-2 flex flex-col gap-3">
            {questions.map(([question, entries]) => (
              <li key={question} className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] p-4">
                <p className="text-[15px] leading-snug font-semibold">{question}</p>
                <ol className="mt-2 divide-y divide-[var(--line)]">
                  {entries.map((e) => (
                    <li key={e.id} className="flex gap-3 py-2 text-sm">
                      <span className={`w-[76px] shrink-0 text-[var(--ink-2)] ${TNUM}`}>
                        {fmtDate(e.date, { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="min-w-0 flex-1 break-words">
                        {answerText((e.value ?? e.comment)!)}
                        {e.value && e.comment && <span className="block text-[var(--ink-2)]">“{e.comment}”</span>}
                        {e.same > 0 && (
                          <span className={`block text-[var(--ink-2)] ${TNUM}`}>
                            Same in {e.same + 1} reports{e.since && ` since ${fmtDate(e.since, { month: 'short', year: 'numeric' })}`}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
