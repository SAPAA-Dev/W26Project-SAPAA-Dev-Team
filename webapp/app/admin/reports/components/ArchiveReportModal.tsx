'use client';

import { Archive, X } from 'lucide-react';
import type {
  FormResponse,
  SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';

interface ArchiveReportModalProps {
  report: FormResponse | null;
  siteName: string;
  impact: SiteInspectionReportDeleteImpact | null;
  loading: boolean;
  archiving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ArchiveReportModal({
  report,
  siteName,
  impact,
  loading,
  archiving,
  error,
  onCancel,
  onConfirm,
}: ArchiveReportModalProps) {
  if (!report) return null;

  // Use the counts only when they belong to the report in this dialog.
  const currentImpact = impact?.responseId === report.id ? impact : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-report-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <Archive className="h-6 w-6 text-amber-600" />
            <h2 id="archive-report-title" className="text-xl font-bold text-amber-800">
              Archive Site Inspection Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={archiving}
            aria-label="Close report archive confirmation"
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-gray-900">
            Archive <strong>{report.inspection_no ?? `Report #${report.id}`}</strong> for{' '}
            <strong>{siteName}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            The report will be hidden from normal report lists. Its answers and uploaded
            images will stay available for restoration.
          </p>

          {loading && (
            <p data-testid="archive-report-impact-loading" className="text-gray-600">
              Loading report details...
            </p>
          )}

          {currentImpact && (
            <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
              <p>{currentImpact.answerCount} answers will be preserved</p>
              <p>{currentImpact.attachmentCount} images will be preserved</p>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t p-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={archiving}
            className="rounded-xl border px-5 py-2.5 text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-archive-report"
            onClick={onConfirm}
            disabled={loading || archiving || !currentImpact}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-white disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
            {archiving ? 'Archiving...' : 'Archive Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
