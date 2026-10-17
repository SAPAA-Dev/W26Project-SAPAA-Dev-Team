'use client';

import { useEffect, useId, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { btn, EmptyState, inputCls, Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { errMsg, plural, toast, Toggle } from './shared';

export type PdfTarget =
  { mode: 'single'; responseId: number } | { mode: 'site'; siteName: string } | { mode: 'multi-site'; siteNames: string[] };

const START = {
  includeImages: false,
  maxImagesPerInspection: 5,
  includeEmptyAnswers: false,
  includeCoverPage: true,
  includeNaturalnessSummary: true,
  sortOrder: 'newest' as 'newest' | 'oldest',
  pageSize: 'LETTER' as 'LETTER' | 'A4',
  dateFrom: '',
  dateTo: '',
};

/**
 * The existing /api/pdf job flow: POST starts a job, PdfJobWatcher (root layout) downloads it when done,
 * and the exports tray lists it. Question hiding and per-report picking stay in the classic modal.
 */
export function PdfSheet({ open, onClose, target, subject }: { open: boolean; onClose: () => void; target: PdfTarget; subject: string }) {
  const [o, setO] = useState(START);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const id = useId();
  const set = (patch: Partial<typeof START>) => setO((cur) => ({ ...cur, ...patch }));
  const badRange = !!(o.dateFrom && o.dateTo && o.dateFrom > o.dateTo);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const options = {
        ...o,
        dateFrom: o.dateFrom || undefined,
        dateTo: o.dateTo || undefined,
        selectedSections: 'all',
        hiddenQuestionIds: [],
      };
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, options }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `The export did not start (${res.status}).`);
      toast('Making the PDF. It downloads when it’s ready.');
      onClose();
    } catch (e) {
      setError(errMsg(e, 'The export did not start. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={() => !busy && onClose()}
      title="Export PDF"
      description={subject}
      footer={
        <button type="button" onClick={start} disabled={busy || badRange} className={`${btn.primary} w-full`}>
          {busy ? <Loader2 size={18} aria-hidden className="animate-spin" /> : <Download size={18} aria-hidden />}
          {busy ? 'Starting export' : 'Export PDF'}
        </button>
      }
    >
      <div className="divide-y divide-[var(--line)]">
        <Toggle
          label="Cover page"
          hint="Title page with a summary"
          checked={o.includeCoverPage}
          onChange={(v) => set({ includeCoverPage: v })}
        />
        <Toggle
          label="Naturalness summary"
          hint="Score table across the reports"
          checked={o.includeNaturalnessSummary}
          onChange={(v) => set({ includeNaturalnessSummary: v })}
        />
        <Toggle
          label="Photos"
          hint={o.includeImages ? `Up to ${o.maxImagesPerInspection} per report` : 'Text only, smaller file'}
          checked={o.includeImages}
          onChange={(v) => set({ includeImages: v })}
        />
      </div>

      <button
        type="button"
        aria-expanded={more}
        onClick={() => setMore((m) => !m)}
        className="mt-2 min-h-11 text-[15px] font-semibold text-[var(--forest)] underline underline-offset-4"
      >
        {more ? 'Fewer options' : 'Dates, order and paper size'}
      </button>

      {more && (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="text-[15px] font-semibold" htmlFor={`${id}-from`}>
            From
            <input
              id={`${id}-from`}
              type="date"
              value={o.dateFrom}
              max={o.dateTo || undefined}
              onChange={(e) => set({ dateFrom: e.target.value })}
              className={`${inputCls} mt-1.5 h-12`}
            />
          </label>
          <label className="text-[15px] font-semibold" htmlFor={`${id}-to`}>
            To
            <input
              id={`${id}-to`}
              type="date"
              value={o.dateTo}
              min={o.dateFrom || undefined}
              onChange={(e) => set({ dateTo: e.target.value })}
              className={`${inputCls} mt-1.5 h-12`}
            />
          </label>
          {badRange && <p className="col-span-2 text-sm font-semibold text-[var(--clay-ink)]">The start date is after the end date.</p>}
          <label className="text-[15px] font-semibold" htmlFor={`${id}-sort`}>
            Order
            <select
              id={`${id}-sort`}
              value={o.sortOrder}
              onChange={(e) => set({ sortOrder: e.target.value as 'newest' | 'oldest' })}
              className={`${inputCls} mt-1.5 h-12`}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <label className="text-[15px] font-semibold" htmlFor={`${id}-size`}>
            Paper
            <select
              id={`${id}-size`}
              value={o.pageSize}
              onChange={(e) => set({ pageSize: e.target.value as 'LETTER' | 'A4' })}
              className={`${inputCls} mt-1.5 h-12`}
            >
              <option value="LETTER">Letter</option>
              <option value="A4">A4</option>
            </select>
          </label>
          {o.includeImages && (
            <label className="text-[15px] font-semibold" htmlFor={`${id}-max`}>
              Photos per report
              <select
                id={`${id}-max`}
                value={o.maxImagesPerInspection}
                onChange={(e) => set({ maxImagesPerInspection: Number(e.target.value) })}
                className={`${inputCls} mt-1.5 h-12`}
              >
                {[1, 3, 5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="col-span-2">
            <Toggle
              label="Unanswered questions"
              hint="List questions left blank"
              checked={o.includeEmptyAnswers}
              onChange={(v) => set({ includeEmptyAnswers: v })}
            />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
    </Sheet>
  );
}

/* ---------- recent export jobs (the classic PdfExportsDropdown, as a sheet) ---------- */

interface Job {
  id: string;
  mode: string;
  status: string;
  created_at: string;
  request_payload: {
    siteName?: string;
    siteNames?: string[];
    responseId?: number;
  } | null;
}

const jobLabel = (j: Job) =>
  j.mode === 'site' && j.request_payload?.siteName
    ? j.request_payload.siteName
    : j.mode === 'multi-site'
      ? plural(j.request_payload?.siteNames?.length ?? 0, 'site')
      : 'One report';

export function ExportsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [failed, setFailed] = useState(false);
  const pending = jobs?.some((j) => j.status === 'pending' || j.status === 'processing');

  useEffect(() => {
    if (!open) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      const { data, error } = await createClient()
        .from('S26_pdf_jobs')
        .select('id, mode, status, created_at, request_payload')
        .order('created_at', { ascending: false })
        .limit(20);
      if (stop) return;
      setFailed(!!error);
      if (!error) setJobs((data ?? []) as Job[]);
      // Same 3 s cadence as PdfJobWatcher while a job is still running.
      if ((data ?? []).some((j: Job) => j.status === 'pending' || j.status === 'processing')) timer = setTimeout(load, 3000);
    };
    void load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [open]);

  const download = async (jobId: string) => {
    try {
      const res = await fetch(`/api/pdf/status/${jobId}`);
      const { downloadUrl } = await res.json();
      if (!downloadUrl) throw new Error();
      window.open(downloadUrl, '_blank', 'noopener');
    } catch {
      toast('That file is not available. Export it again.', 'error');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Recent exports"
      description={pending ? 'Updating while a PDF is being made.' : 'Your last 20 PDF exports.'}
    >
      {failed ? (
        <p role="alert" className="py-6 text-[15px] text-[var(--clay-ink)]">
          Exports didn’t load. Close this and try again.
        </p>
      ) : !jobs ? (
        <div aria-busy="true" className="flex flex-col gap-2 py-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-14 animate-pulse rounded-[var(--radius-m)] bg-[var(--bg-sunken)]" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No exports yet" body="PDFs you export from a site or the sites list show up here." />
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {jobs.map((j) => (
            <li key={j.id} className="flex min-h-16 items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{jobLabel(j)}</span>
                <span className="num block text-sm text-[var(--ink-2)]">
                  {formatDate(j.created_at)},{' '}
                  {new Date(j.created_at).toLocaleTimeString('en-CA', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </span>
              {j.status === 'complete' ? (
                <button type="button" onClick={() => download(j.id)} className={`${btn.secondary} min-h-11 px-4 text-[15px]`}>
                  <Download size={17} aria-hidden />
                  Download
                </button>
              ) : j.status === 'failed' ? (
                <span className="text-sm font-semibold text-[var(--clay-ink)]">Failed</span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-[var(--ink-2)]">
                  <Loader2 size={15} aria-hidden className="animate-spin" />
                  Making
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
