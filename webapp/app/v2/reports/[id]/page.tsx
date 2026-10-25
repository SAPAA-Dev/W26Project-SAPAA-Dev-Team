'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, PencilLine } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { Report } from '@/lib/api/v1/types';
import { useApi } from '@/app/v2/_lib/useApi';
import { formatDate, questionNumber, reportPerson, siteHref } from '@/app/v2/_components/flows/format';
import { EditReportSheet } from '@/app/v2/_components/flows/EditReport';
import { HiddenTag } from '@/app/v2/_components/flows/HiddenTag';
import PhotoHero from '@/app/v2/_components/sites/PhotoHero';
import { HEADING } from '@/app/v2/_components/sites/ui';
import { ErrorState, SectionTitle, btn, card, heroTitle, raised, tabBarPadding } from '@/app/v2/_components/flows/ui';

interface Row {
  question: string;
  values: string[];
  notes: string[];
  hidden: boolean;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Answers arrive one row per value (select-all questions repeat). Text answers come back in `comment`. */
function groupAnswers(report: Report) {
  const sections = new Map<string, Map<string, Row>>();
  for (const a of report.answers ?? []) {
    const rows = sections.get(a.section) ?? new Map<string, Row>();
    sections.set(a.section, rows);
    const row = rows.get(a.question) ?? { question: a.question, values: [], notes: [], hidden: false };
    rows.set(a.question, row);
    if (a.hidden) row.hidden = true;
    const main = a.value ?? a.comment;
    if (main) row.values.push(main === 'true' ? 'Agreed' : DATE_ONLY.test(main) ? formatDate(main, 'long') : main);
    if (a.value && a.comment && a.comment !== a.value) row.notes.push(a.comment);
  }
  return [...sections].map(([title, rows]) => ({ title: title || 'Other answers', rows: [...rows.values()] }));
}

export default function ReportDetailPage() {
  const router = useRouter();
  const id = Number(useParams<{ id: string }>().id);
  const valid = Number.isInteger(id) && id > 0;
  const report = useApi(valid ? `report:${id}` : null, () => api.report(id));
  const r = report.data;
  const isAdmin = useApi('me', api.me).data?.role === 'admin';
  const [editing, setEditing] = useState(false);
  const sections = useMemo(() => (r ? groupAnswers(r) : []), [r]);
  const back = () => (window.history.length > 1 ? router.back() : router.push('/v2/reports'));
  const person = r && reportPerson(r);

  return (
    <>
      <PhotoHero className="pb-16">
        <div className="mx-auto max-w-3xl px-5 pt-[max(12px,env(safe-area-inset-top))] md:px-8">
          <button type="button" onClick={back} aria-label="Back to reports" className={`${btn.onPhoto} -ml-1`}>
            <ArrowLeft size={22} aria-hidden />
          </button>
          {r ? (
            <div className="mt-10 md:mt-16">
              <p className="eyebrow">Inspection {r.inspectionNo ?? `#${r.id}`}</p>
              <h1 style={HEADING} className={heroTitle}>
                {r.siteName}
              </h1>
              <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[rgba(169,191,163,0.25)] pt-4 text-[var(--birch)] sm:grid-cols-3">
                <div>
                  <dt className="text-[13px] text-[var(--sage)]">Visited</dt>
                  <dd className="mt-0.5 font-semibold">{formatDate(r.date, 'long')}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-[var(--sage)]">Steward</dt>
                  <dd className="mt-0.5 font-semibold">
                    {r.submittedBy ? (
                      <Link href={`/v2/me?person=${r.submittedBy.id}`} className="underline underline-offset-2">
                        {r.isOwn ? 'You' : r.submittedBy.name}
                      </Link>
                    ) : (
                      person ?? 'Not recorded'
                    )}
                  </dd>
                </div>
                {r.naturalness && (
                  <div>
                    <dt className="text-[13px] text-[var(--sage)]">Naturalness</dt>
                    <dd className="mt-0.5 font-semibold">
                      {r.naturalness.label}
                      {r.naturalnessHidden && <HiddenTag />}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div aria-hidden className="mt-10 flex flex-col gap-3 md:mt-16">
              <span className="h-3 w-24 animate-pulse rounded bg-white/20" />
              <span className="h-9 w-3/4 animate-pulse rounded-lg bg-white/20" />
              <span className="mt-3 h-10 w-full animate-pulse rounded bg-white/15" />
            </div>
          )}
        </div>
      </PhotoHero>

      <main className="mx-auto max-w-3xl px-4 md:px-8" style={tabBarPadding}>
        {!valid ? (
          <div className="mt-6">
            <ErrorState title="This report does not exist" error={new Error('Check the link and try again.')} />
          </div>
        ) : report.error ? (
          <div className="mt-6">
            <ErrorState title="This report did not load" error={report.error} onRetry={report.refetch} />
          </div>
        ) : !r ? (
          <div aria-busy="true" className="relative z-10 -mt-12 animate-pulse space-y-3">
            <span className="sr-only" role="status">
              Loading the report
            </span>
            <div className={`h-16 ${card} ${raised}`} />
            <div className="h-64 rounded-[var(--radius-l)] bg-[var(--bg-sunken)]" />
          </div>
        ) : (
          <>
            <Link
              href={siteHref(r.siteSlug)}
              className={`${card} ${raised} lift relative z-10 -mt-12 flex min-h-16 items-center gap-3 px-4 py-3`}
            >
              <MapPin size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              <span className="flex-1 font-semibold">View site page</span>
              <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
            </Link>

            {/* The report's owner or an admin; the server checks it again. */}
            {(r.isOwn || isAdmin) && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={`${card} lift mt-3 flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left`}
              >
                <PencilLine size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                <span className="flex-1 font-semibold">Edit answers</span>
                <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              </button>
            )}

            {sections.length === 0 ? (
              <p className="mt-8 text-[16px] text-[var(--ink-2)]">No answers were recorded for this report.</p>
            ) : (
              sections.map((s) => (
                <section key={s.title} aria-labelledby={`s-${s.title}`} className="reveal mt-8">
                  <SectionTitle id={`s-${s.title}`}>{s.title}</SectionTitle>
                  <dl className={`${card} mt-2 divide-y divide-[var(--line)] overflow-hidden`}>
                    {s.rows.map((row) => {
                      const { text } = questionNumber(row.question);
                      return (
                        <div key={row.question} className="px-4 py-3.5">
                          <dt className="text-[14px] leading-snug text-[var(--ink-2)]">
                            {text}
                            {row.hidden && <HiddenTag />}
                          </dt>
                          <dd className="mt-1 text-[16px] leading-relaxed font-semibold whitespace-pre-line">
                            {row.values.length ? row.values.join(', ') : <span className="font-normal text-[var(--ink-2)]">Not answered</span>}
                          </dd>
                          {row.notes.map((n, i) => (
                            <dd key={i} className="mt-1 text-[15px] leading-relaxed whitespace-pre-line text-[var(--ink-2)]">
                              {n}
                            </dd>
                          ))}
                        </div>
                      );
                    })}
                  </dl>
                </section>
              ))
            )}
            <EditReportSheet
              open={editing}
              onClose={() => setEditing(false)}
              report={r}
              title={r.inspectionNo ? `Report ${r.inspectionNo}` : `Report from ${formatDate(r.date)}`}
              onSaved={() => setEditing(false)}
            />
          </>
        )}
      </main>
    </>
  );
}
