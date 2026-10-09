'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import {
  SiteDeleteImpact,
  SiteSummary,
} from '@/utils/supabase/queries';

interface PermanentDeleteSiteModalProps {
  site: SiteSummary | null;
  impact: SiteDeleteImpact | null;
  loading: boolean;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PermanentDeleteSiteModal({
  site,
  impact,
  loading,
  deleting,
  error,
  onCancel,
  onConfirm,
}: PermanentDeleteSiteModalProps) {
  if (!site) return null;

  // The impact can arrive for a different site when the dialog is reopened quickly.
  const currentImpact = impact?.siteId === site.id ? impact : null;

  const imageCount =
    (currentImpact?.attachmentCount ?? 0) +
    (currentImpact?.homepageImageCount ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permanent-delete-site-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-700" />
            <h2
              id="permanent-delete-site-title"
              className="text-xl font-bold text-red-800"
            >
              Permanently Delete Site
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Close permanent delete confirmation"
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-gray-900">
            Permanently delete <strong>{site.namesite}</strong>?
          </p>

          <p className="text-sm text-gray-600">
            Only the site record is removed. Its inspection reports, answers,
            and images stay in the database, disconnected from any site. This
            operation cannot be undone.
          </p>

          {loading && (
            <p data-testid="permanent-delete-impact-loading" className="text-gray-600">
              Loading connected records...
            </p>
          )}

          {currentImpact && (
            <div className="rounded-xl bg-red-50 p-4 text-red-900">
              <p>{currentImpact.inspectionCount} inspection reports</p>
              <p>{currentImpact.answerCount} answers</p>
              <p>{imageCount} images</p>
              <p>{currentImpact.siteStewardCount} steward assignments</p>
            </div>
          )}

          <p className="text-sm text-gray-600">
            Imported KML boundaries will not be changed.
          </p>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
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
            data-testid="confirm-permanent-delete-site"
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
