'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { btn, EmptyState, Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { plural, toast } from './shared';
import PdfExportModal from '@/components/PdfExportModal';
import { getFormResponsesBySiteAdmin } from '@/utils/supabase/queries';
import { useApi } from '@/app/v2/_lib/useApi';

export type PdfTarget =
  { mode: 'single'; responseId: number } | { mode: 'site'; siteName: string } | { mode: 'multi-site'; siteNames: string[] };

export function PdfSheet({ open, onClose, target }: { open: boolean; onClose: () => void; target: PdfTarget; subject: string }) {
  const reports = useApi(open && target.mode === 'site' ? `admin:pdf-reports:${target.siteName}` : null,
    () => target.mode === 'site' ? getFormResponsesBySiteAdmin(target.siteName) : Promise.resolve([]));
  return <PdfExportModal open={open} onClose={onClose} {...target} inspections={reports.data ?? []} />;
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
