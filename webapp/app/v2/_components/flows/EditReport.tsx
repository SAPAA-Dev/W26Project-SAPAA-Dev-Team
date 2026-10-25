'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { FormQuestion, FormSection, ReportAnswersForEdit } from '@/lib/api/v1/types';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import type { DraftAnswer } from '@/app/v2/_components/flows/drafts';
import { btn, ErrorState, Sheet } from '@/app/v2/_components/flows/ui';
import { isAnswered, isOtherOption, QuestionCard } from '@/app/v2/sites/[slug]/inspect/Questions';

interface ReportRef {
  id: number;
  date: string | null;
  siteName: string;
}

/**
 * Edit the answers of a past report: its owner, or an admin (the server checks both). The save is a PUT to
 * /api/v1/reports/:id, which replaces every answer as the classic edit-report page does, including the
 * hide-from-other-stewards choice (US 1.0.3). Photos are not edited here.
 */
export function EditReportSheet({
  open,
  onClose,
  report,
  title,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  report: ReportRef;
  title: string;
  onSaved: () => void;
}) {
  const form = useApi(open ? 'form' : null, api.form);
  const stored = useApi(open ? `report-answers:${report.id}` : null, () => api.reportAnswers(report.id));
  const error = form.error ?? stored.error;
  return (
    <Sheet open={open} onClose={onClose} title="Edit answers" description={`${title}, ${report.siteName}`}>
      {error ? (
        <ErrorState
          title="The answers didn’t load"
          error={error}
          onRetry={() => {
            if (form.error) form.refetch();
            if (stored.error) stored.refetch();
          }}
        />
      ) : !form.data || !stored.data ? (
        <div aria-busy="true" className="flex flex-col gap-3 py-2">
          <span className="sr-only" role="status">
            Loading answers
          </span>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-28 animate-pulse rounded-[var(--radius-m)] bg-[var(--bg-sunken)]" />
          ))}
        </div>
      ) : (
        <AnswersForm
          key={report.id}
          sections={form.data}
          stored={stored.data}
          report={report}
          onCancel={onClose}
          onSaved={() => {
            invalidate(`report-answers:${report.id}`);
            invalidate('report');
            invalidate('site');
            invalidate('me');
            onSaved();
          }}
        />
      )}
    </Sheet>
  );
}

/** A stored answer in the shape the question card edits. */
function toDraft(q: FormQuestion, v: string | string[]): DraftAnswer {
  if (q.type === 'selectall') return Array.isArray(v) ? v : [v];
  if (q.type === 'agreement') return v === 'true' || (Array.isArray(v) && v[0] === 'true');
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

function AnswersForm({
  sections,
  stored,
  report,
  onCancel,
  onSaved,
}: {
  sections: FormSection[];
  stored: ReportAnswersForEdit;
  report: ReportRef;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const questions = sections.flatMap((s) => s.questions.filter((q) => q.type !== 'image').map((q) => ({ q, section: s.title })));
  const [values, setValues] = useState<Record<number, DraftAnswer>>(() =>
    Object.fromEntries(questions.flatMap(({ q }) => (stored.answers[q.id] === undefined ? [] : [[q.id, toDraft(q, stored.answers[q.id])]]))),
  );
  const [others, setOthers] = useState<Record<number, string>>(() =>
    Object.fromEntries(questions.flatMap(({ q }) => (stored.comments[q.id] ? [[q.id, stored.comments[q.id]]] : []))),
  );
  // Image questions are not drawn, but their hidden choice (and that of questions off the form) is sent back as it was.
  const [hidden, setHidden] = useState(() => new Set(stored.hidden));
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toLocaleDateString('en-CA');
  const shown = questions.filter(({ q }) => showAll || stored.answers[q.id] !== undefined);
  const unanswered = questions.length - shown.length;

  const save = async () => {
    setBusy(true);
    setError(null);
    const answers: Record<number, string | string[]> = {};
    const comments: Record<number, string> = {};
    for (const { q } of questions) {
      const v = values[q.id];
      if (v === undefined || !isAnswered(v)) continue;
      // A pick-one question takes one string; only select-all takes a list.
      answers[q.id] = typeof v === 'boolean' ? 'true' : Array.isArray(v) ? v : v.trim();
      const withOther = Array.isArray(v) ? v.some(isOtherOption) : typeof v === 'string' && isOtherOption(v);
      if (withOther && others[q.id]?.trim()) comments[q.id] = others[q.id].trim();
    }
    try {
      await api.updateReport(report.id, { answers, comments, hidden: [...hidden] });
      onSaved();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'The answers were not saved. Try again.');
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-col gap-3">
        {shown.map(({ q, section }, i) => {
          const head = i === 0 || shown[i - 1].section !== section ? section : null;
          return (
            <div key={q.id}>
              {head && <h3 className="mt-3 mb-2 text-[15px] font-bold text-[var(--ink-2)] first:mt-0">{head}</h3>}
              <QuestionCard
                q={q}
                value={values[q.id]}
                other={others[q.id] ?? ''}
                onChange={(v) => setValues((cur) => ({ ...cur, [q.id]: v }))}
                onOther={(v) => setOthers((cur) => ({ ...cur, [q.id]: v }))}
                photos={[]}
                onPhotos={() => {}}
                siteName={report.siteName}
                today={today}
                photographer=""
                autofilled={false}
                error={null}
                showErrors={false}
                hidden={hidden.has(q.id)}
                onHidden={(h) =>
                  setHidden((cur) => {
                    const next = new Set(cur);
                    if (h) next.add(q.id);
                    else next.delete(q.id);
                    return next;
                  })
                }
              />
            </div>
          );
        })}
      </div>
      {unanswered > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 min-h-11 text-[15px] font-semibold text-[var(--forest)] underline underline-offset-4"
        >
          Show {unanswered} unanswered {unanswered === 1 ? 'question' : 'questions'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-4 text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-[var(--line)] bg-[var(--surface)] px-5 pt-3 pb-1">
        <button type="button" onClick={onCancel} disabled={busy} className={`${btn.secondary} flex-1`}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={`${btn.primary} flex-1`}>
          {busy && <Loader2 size={18} aria-hidden className="animate-spin" />}
          Save answers
        </button>
      </div>
    </form>
  );
}
