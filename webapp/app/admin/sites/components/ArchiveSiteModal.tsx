'use client';

import { Archive, X } from 'lucide-react';
import {
  SiteDeleteImpact,
  SiteSummary,
} from '@/utils/supabase/queries';

interface ArchiveSiteModalProps {
  site: SiteSummary | null;
  impact: SiteDeleteImpact | null;
  loading: boolean;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ArchiveSiteModal({
  site,
  impact,
  loading,
  deleting,
  error,
  onCancel,
  onConfirm,
}: ArchiveSiteModalProps) {
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
        aria-labelledby="archive-site-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <Archive className="h-6 w-6 text-amber-600" />
            <h2
              id="archive-site-title"
              className="text-xl font-bold text-amber-800"
            >
              Archive Site
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Close archive confirmation"
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-gray-900">
            Archive <strong>{site.namesite}</strong>?
          </p>

          <p className="text-sm text-gray-600">
            The site will be hidden from the app. Its inspection reports,
            answers, images, and steward assignments are kept. An admin can
            restore it or permanently delete it from the archived sites list.
          </p>

          {loading && (
            <p data-testid="archive-site-impact-loading" className="text-gray-600">
              Loading connected records...
            </p>
          )}

          {currentImpact && (
            <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
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
            data-testid="confirm-archive-site"
            onClick={onConfirm}
            disabled={loading || deleting || !currentImpact}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-white disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
            {deleting ? 'Archiving...' : 'Archive Site'}
          </button>
        </div>
      </div>
    </div>
  );
}
