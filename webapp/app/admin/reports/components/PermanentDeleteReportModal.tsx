'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import type {
  ArchivedSiteInspectionReport,
  SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';

interface PermanentDeleteReportModalProps {
  report: ArchivedSiteInspectionReport | null;
  impact: SiteInspectionReportDeleteImpact | null;
  loading: boolean;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PermanentDeleteReportModal({
  report,
  impact,
  loading,
  deleting,
  error,
  onCancel,
  onConfirm,
}: PermanentDeleteReportModalProps) {
  if (!report) return null;

  // Use the counts only when they belong to the report in this dialog.
  const currentImpact = impact?.responseId === report.id ? impact : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permanent-delete-report-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-700" />
            <h2 id="permanent-delete-report-title" className="text-xl font-bold text-red-800">
              Permanently Delete Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Close permanent report deletion confirmation"
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-gray-900">
            Permanently delete{' '}
            <strong>{report.inspectionNo ?? `Report #${report.id}`}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            The report, its answers, its attachment records, and its uploaded image files
            will be removed. This operation cannot be undone.
          </p>

          {loading && (
            <p data-testid="permanent-delete-report-impact-loading" className="text-gray-600">
              Loading report details...
            </p>
          )}

          {currentImpact && (
            <div className="rounded-xl bg-red-50 p-4 text-red-900">
              <p>{currentImpact.answerCount} answers will be deleted</p>
              <p>{currentImpact.attachmentCount} images will be deleted</p>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t p-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border px-5 py-2.5 text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-permanent-delete-report"
            onClick={onConfirm}
            disabled={loading || deleting || !currentImpact}
            className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-white disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
