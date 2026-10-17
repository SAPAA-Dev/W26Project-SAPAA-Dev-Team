'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, Download, Eye, EyeOff, Loader2, MoreHorizontal, PencilLine } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { FormQuestion, FormSection, Report } from '@/lib/api/v1/types';
import {
  archiveSiteInspectionReport,
  getDateOfVisitQuestionId,
  getFormResponseById,
  getQuestionResponseType,
  getSiteInspectionReportDeleteImpact,
  setFormResponseActive,
  updateSiteInspectionAnswers,
  type SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import type { DraftAnswer } from '@/app/v2/_components/flows/drafts';
import { btn, ErrorState, Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { isAnswered, QuestionCard } from '@/app/v2/sites/[slug]/inspect/Questions';
import { Confirm, errMsg, ImpactList, MenuRow, MenuRule, refreshSite, toast, useIsAdmin } from './shared';
import { PdfSheet } from './pdf';

type Panel = 'menu' | 'edit' | 'pdf' | 'archive';

/**
 * The admin row under a report in the site timeline: a Disabled tag when stewards cannot see the report,
 * and Manage (edit answers, disable or enable, PDF, archive), as on the classic admin site page.
 */
export default function AdminReportActions({ report }: { report: Report }) {
  const isAdmin = useIsAdmin();
  const trigger = useRef<HTMLButtonElement>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toggling, setToggling] = useState(false);
  if (!isAdmin) return null;

  const active = report.isActive !== false;
  const name = report.inspectionNo ? `Report ${report.inspectionNo}` : `Report from ${formatDate(report.date)}`;
  const close = () => {
    setPanel(null);
    // The sheets unmount; focus goes back to the button that opened them.
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const toggle = async () => {
    setToggling(true);
    try {
      await setFormResponseActive(report.id, !active);
      toast(active ? `${name} disabled. Stewards no longer see it.` : `${name} enabled.`);
      refreshSite(report.siteSlug);
      close();
    } catch (e) {
      toast(errMsg(e, 'The report did not change. Try again.'), 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className="flex min-h-11 items-center gap-2 border-t border-dashed border-[var(--line)] pr-1 pl-4">
        {!active && (
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--st-due-ink)]">
            <EyeOff size={14} aria-hidden />
            Disabled, hidden from stewards
          </span>
        )}
        <button
          ref={trigger}
          type="button"
          onClick={() => setPanel('menu')}
          aria-haspopup="dialog"
          aria-label={`Manage ${name.toLowerCase()}`}
          className="press ml-auto flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)]"
        >
          Manage
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>

      {panel && (
        <>
          <Sheet
            open={panel === 'menu'}
            onClose={close}
            title={name}
            description={`${report.siteName}, ${formatDate(report.date, 'long')}`}
          >
            <MenuRow icon={PencilLine} label="Edit answers" hint="Fix typos and wrong answers" onClick={() => setPanel('edit')} />
            <MenuRow
              icon={active ? EyeOff : Eye}
              label={active ? 'Disable report' : 'Enable report'}
              hint={active ? 'Hide it from stewards and site stats' : 'Show it to stewards again'}
              busy={toggling}
              onClick={toggle}
            />
            <MenuRow icon={Download} label="Export PDF" hint="This report only" onClick={() => setPanel('pdf')} />
            <MenuRule />
            <MenuRow
              icon={Archive}
              label="Archive report"
              hint="Take it out of the history. You can restore it."
              danger
              onClick={() => setPanel('archive')}
            />
          </Sheet>

          <EditAnswers open={panel === 'edit'} onClose={close} report={report} name={name} />
          <PdfSheet
            open={panel === 'pdf'}
            onClose={close}
            target={{ mode: 'single', responseId: report.id }}
            subject={`${name}, ${report.siteName}`}
          />
          <ArchiveReport
            open={panel === 'archive'}
            onClose={close}
            report={report}
            name={name}
            onDone={() => {
              setPanel(null);
              toast(`${name} archived. Restore it from Reports, Archived.`);
              refreshSite(report.siteSlug);
            }}
          />
        </>
      )}
    </>
  );
}

/* ---------- archive one report ---------- */

function ArchiveReport({
  open,
  onClose,
  report,
  name,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  report: Report;
  name: string;
  onDone: () => void;
}) {
  const [impact, setImpact] = useState<SiteInspectionReportDeleteImpact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    getSiteInspectionReportDeleteImpact(report.id).then(
      (i) => live && setImpact(i),
      (e) => live && setError(errMsg(e, 'The report details didn’t load. Close and try again.')),
    );
    return () => {
      live = false;
      setImpact(null);
      setError(null);
    };
  }, [open, report.id]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await archiveSiteInspectionReport(report.id);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'The report was not archived. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Confirm
      open={open}
      onClose={onClose}
      title={`Archive ${name.toLowerCase()}?`}
      description={`It leaves ${report.siteName}’s history and every list. Its answers and photos are kept until you restore it.`}
      confirmLabel={busy ? 'Archiving' : 'Archive report'}
      busy={busy}
      ready={!!impact}
      error={error}
      onConfirm={confirm}
    >
      <ImpactList
        loading={!impact && !error}
        rows={
          impact && [
            ['Answers kept', impact.answerCount],
            ['Photos kept', impact.attachmentCount],
          ]
        }
      />
    </Confirm>
  );
}

/* ---------- edit answers: the steward edit-report save path, drawn with the inspection's question cards ---------- */

type Raw = Record<string | number, string | string[]>;

function EditAnswers({ open, onClose, report, name }: { open: boolean; onClose: () => void; report: Report; name: string }) {
  const form = useApi(open ? 'form' : null, api.form);
  const raw = useApi(open ? `admin:answers:${report.id}` : null, () => getFormResponseById(report.id));
  const error = form.error ?? raw.error;
  return (
    <Sheet open={open} onClose={onClose} title="Edit answers" description={`${name}, ${report.siteName}`}>
      {error ? (
        <ErrorState
          title="The answers didn’t load"
          error={error}
          onRetry={() => {
            if (form.error) form.refetch();
            if (raw.error) raw.refetch();
          }}
        />
      ) : !form.data || !raw.data ? (
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
          raw={raw.data}
          siteName={report.siteName}
          onCancel={onClose}
          onSave={async (responses) => {
            const [types, dateId] = await Promise.all([getQuestionResponseType(), getDateOfVisitQuestionId()]);
            const typeOf = new Map(types.map((t) => [t.question_id, t]));
            const rows: {
              question_id: number;
              obs_value: string | null;
              obs_comm: string | null;
            }[] = [];
            for (const [key, answer] of Object.entries(responses)) {
              if (key.endsWith('_comm')) continue;
              const t = typeOf.get(Number(key));
              const isValue = Number(t?.obs_value) === 1;
              const isComm = Number(t?.obs_comm) === 1;
              for (const v of Array.isArray(answer) ? answer : [answer]) {
                const other = Array.isArray(answer) && v === 'Other';
                rows.push({
                  question_id: Number(key),
                  obs_value: isValue ? v : null,
                  obs_comm: other ? ((responses[`${key}_comm`] as string | undefined) ?? null) : isComm ? v : null,
                });
              }
            }
            const visit = dateId !== null ? responses[dateId] : undefined;
            const date = typeof visit === 'string' && visit ? visit : (report.date ?? new Date().toLocaleDateString('en-CA'));
            await updateSiteInspectionAnswers(report.id, rows, date);
            toast('Answers saved.');
            invalidate(`admin:answers:${report.id}`);
            refreshSite(report.siteSlug);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

/**
 * The same shapes as getFormResponseById and app/detail/[namesite]/edit-report: arrays for multi-answers
 * and "Other", "<id>_comm" for the Other text. Answers to questions no longer on the form are kept as they are.
 */
function AnswersForm({
  sections,
  raw,
  siteName,
  onCancel,
  onSave,
}: {
  sections: FormSection[];
  raw: Raw;
  siteName: string;
  onCancel: () => void;
  onSave: (responses: Raw) => Promise<void>;
}) {
  const questions = sections.flatMap((s) => s.questions.filter((q) => q.type !== 'image').map((q) => ({ q, section: s.title })));
  const [values, setValues] = useState<Record<number, DraftAnswer>>(() =>
    Object.fromEntries(questions.flatMap(({ q }) => (raw[q.id] === undefined ? [] : [[q.id, toDraft(q, raw[q.id])]]))),
  );
  const [others, setOthers] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      questions.flatMap(({ q }) => (typeof raw[`${q.id}_comm`] === 'string' ? [[q.id, raw[`${q.id}_comm`] as string]] : [])),
    ),
  );
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toLocaleDateString('en-CA');
  const answeredIds = new Set(
    Object.keys(raw)
      .filter((k) => !k.endsWith('_comm'))
      .map(Number),
  );
  const shown = questions.filter(({ q }) => showAll || answeredIds.has(q.id));
  const hidden = questions.length - shown.length;

  const save = async () => {
    setBusy(true);
    setError(null);
    // Start from the stored answers so questions no longer on the form survive the delete and reinsert.
    const out: Raw = {};
    for (const [k, v] of Object.entries(raw)) if (!k.endsWith('_comm') && !questions.some(({ q }) => String(q.id) === k)) out[k] = v;
    for (const { q } of questions) {
      const v = values[q.id];
      if (v === undefined || !isAnswered(v)) continue;
      out[q.id] = typeof v === 'boolean' ? 'true' : Array.isArray(v) ? v : v === 'Other' ? ['Other'] : v.trim();
      if (others[q.id]?.trim() && (Array.isArray(out[q.id]) ? (out[q.id] as string[]).includes('Other') : false))
        out[`${q.id}_comm`] = others[q.id].trim();
    }
    try {
      await onSave(out);
    } catch (e) {
      setError(errMsg(e, 'The answers were not saved. Try again.'));
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
                siteName={siteName}
                today={today}
                photographer=""
                autofilled={false}
                error={null}
                showErrors={false}
              />
            </div>
          );
        })}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 min-h-11 text-[15px] font-semibold text-[var(--forest)] underline underline-offset-4"
        >
          Show {hidden} unanswered {hidden === 1 ? 'question' : 'questions'}
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

/** A stored answer in the shape the question card edits. */
function toDraft(q: FormQuestion, v: string | string[]): DraftAnswer {
  if (q.type === 'selectall') return Array.isArray(v) ? v : [v];
  if (q.type === 'agreement') return v === 'true' || (Array.isArray(v) && v[0] === 'true');
  return Array.isArray(v) ? (v[0] ?? '') : v;
}
