'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

const POLL_INTERVAL_MS = 3000;

type ExportState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'failed'; message: string }
  | { phase: 'ready'; downloadUrl: string };

// 3.0.3: an Admin starts one export of every stored image, GPX file and finished PDF, then downloads the ZIP.
export default function ExportAllFilesButton() {
  const [state, setState] = useState<ExportState>({ phase: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    return () => {
      stopped.current = true;
      clearTimeout(timer.current);
    };
  }, []);

  async function poll(jobId: string) {
    try {
      const response = await fetch(`/api/export/status/${jobId}`);
      const body = await response.json();
      if (stopped.current) return;
      if (!response.ok) throw new Error(body.error ?? 'The export status could not be read.');
      if (body.status === 'complete' && body.downloadUrl) {
        setState({ phase: 'ready', downloadUrl: body.downloadUrl });
      } else if (body.status === 'failed') {
        setState({ phase: 'failed', message: body.error ?? 'The export failed. Try again.' });
      } else {
        timer.current = setTimeout(() => { void poll(jobId); }, POLL_INTERVAL_MS);
      }
    } catch (error) {
      if (!stopped.current) {
        setState({ phase: 'failed', message: error instanceof Error ? error.message : 'The export status could not be read.' });
      }
    }
  }

  async function start() {
    setState({ phase: 'running' });
    try {
      const response = await fetch('/api/export', { method: 'POST' });
      const body = await response.json();
      // 409: this admin already has an export running, so follow that one.
      if (response.status === 409 && body.jobId) {
        void poll(body.jobId);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? 'The export did not start.');
      // A new job is never ready at once, so the first check waits one interval.
      timer.current = setTimeout(() => { void poll(body.jobId); }, POLL_INTERVAL_MS);
    } catch (error) {
      setState({ phase: 'failed', message: error instanceof Error ? error.message : 'The export did not start.' });
    }
  }

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#E4EBE4] shadow-sm" data-testid="export-all-files">
      <h2 className="text-lg font-bold text-[#254431]">Export all files</h2>
      <p className="mt-1 text-sm text-[#5B655D]">
        Puts every stored image, GPX track and finished PDF export in one ZIP file for backup.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void start()}
          disabled={state.phase === 'running'}
          className="inline-flex items-center gap-2 rounded-xl bg-[#356B43] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {state.phase === 'running' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          {state.phase === 'running' ? 'Preparing the ZIP…' : 'Export all files'}
        </button>
        {state.phase === 'ready' && (
          <a href={state.downloadUrl} download className="font-semibold text-[#356B43] underline" data-testid="export-download">
            Download the ZIP
          </a>
        )}
      </div>
      {state.phase === 'running' && (
        <p role="status" className="mt-2 text-sm text-[#5B655D]">This can take a few minutes. Keep this page open.</p>
      )}
      {state.phase === 'failed' && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.message}</p>
      )}
    </section>
  );
}
