'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

const POLL_INTERVAL_MS = 2500;
const RESET_DELAY_MS = 5000;

type ExportState = 'idle' | 'exporting' | 'downloaded' | 'failed';

// A steward exports one SIR they submitted. The download itself is done by
// PdfJobWatcher in the root layout, which auto-downloads the user's completed jobs.
export default function SirPdfExportButton({ responseId }: { responseId: number }) {
  const [state, setState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setState('idle');
      setErrorMessage(null);
    }, RESET_DELAY_MS);
  };

  const pollStatus = async (jobId: string) => {
    try {
      const res = await fetch(`/api/pdf/status/${jobId}`);
      const body = await res.json();
      if (body.status === 'complete') {
        setState('downloaded');
        scheduleReset();
        return;
      }
      if (body.status === 'failed') {
        setState('failed');
        setErrorMessage(body.error || 'PDF export failed');
        scheduleReset();
        return;
      }
    } catch {
      // Keep polling on transient network errors.
    }
    pollTimer.current = setTimeout(() => pollStatus(jobId), POLL_INTERVAL_MS);
  };

  const handleExport = async () => {
    if (state === 'exporting') return;
    setState('exporting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          responseId,
          options: {
            includeImages: true,
            maxImagesPerInspection: 20,
            includeEmptyAnswers: false,
            includeCoverPage: true,
            includeNaturalnessSummary: true,
            selectedSections: 'all',
            hiddenQuestionIds: [],
            sortOrder: 'newest',
            pageSize: 'LETTER',
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to start export (${res.status})`);
      }

      const { jobId } = await res.json();
      pollStatus(jobId);
    } catch (err) {
      setState('failed');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start PDF export');
      scheduleReset();
    }
  };

  const label =
    state === 'exporting' ? 'Preparing…' : state === 'downloaded' ? 'Downloaded' : 'Export PDF';

  return (
    <div className="mx-4 flex flex-col">
      <button
        onClick={handleExport}
        disabled={state === 'exporting'}
        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        title="Export this report as a PDF"
        data-testid="export-pdf-button"
      >
        {state === 'exporting' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {label}
      </button>
      {state === 'failed' && errorMessage && (
        <span className="text-xs text-[#B91C1C] mt-1" data-testid="export-pdf-error">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
