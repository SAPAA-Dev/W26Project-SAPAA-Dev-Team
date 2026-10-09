'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Calendar,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import AdminNavBar from '../../AdminNavBar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PermanentDeleteReportModal from '../components/PermanentDeleteReportModal';
import {
  getArchivedSiteInspectionReports,
  getSiteInspectionReportDeleteImpact,
  permanentlyDeleteSiteInspectionReport,
  restoreSiteInspectionReport,
  type ArchivedSiteInspectionReport,
  type SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';

function formatDate(value: string | null): string {
  if (!value) return 'Date not recorded';
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export default function ArchivedReportsPage() {
  const [reports, setReports] = useState<ArchivedSiteInspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchivedSiteInspectionReport | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<SiteInspectionReportDeleteImpact | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadingDeleteImpact, setLoadingDeleteImpact] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getArchivedSiteInspectionReports()
      .then(setReports)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load archived reports');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      report.siteName?.toLowerCase().includes(query)
      || report.inspectionNo?.toLowerCase().includes(query)
      || report.submitterName?.toLowerCase().includes(query)
    );
  }, [reports, search]);

  const handleRestore = async (report: ArchivedSiteInspectionReport) => {
    setRestoringId(report.id);
    setActionMessage(null);
    try {
      await restoreSiteInspectionReport(report.id);
      // A restored report belongs on the normal report page, not this archive page.
      setReports((current) => current.filter((item) => item.id !== report.id));
    } catch (restoreError) {
      setActionMessage(
        restoreError instanceof Error ? restoreError.message : 'Failed to restore report'
      );
    } finally {
      setRestoringId(null);
    }
  };

  const handleOpenDelete = async (report: ArchivedSiteInspectionReport) => {
    setDeleteTarget(report);
    setDeleteImpact(null);
    setDeleteError(null);
    setLoadingDeleteImpact(true);
    try {
      // Load fresh counts so the dialog shows what this deletion will remove.
      setDeleteImpact(await getSiteInspectionReportDeleteImpact(report.id));
    } catch (impactError) {
      setDeleteError(
        impactError instanceof Error ? impactError.message : 'Failed to load report details'
      );
    } finally {
      setLoadingDeleteImpact(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    setActionMessage(null);
    try {
      const outcome = await permanentlyDeleteSiteInspectionReport(deleteTarget.id);
      setReports((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteImpact(null);
      if (!outcome.storageCleanupComplete) {
        // The report is gone, but an image file can remain if storage cleanup fails.
        setActionMessage(
          'The report was deleted, but some stored image files need manual cleanup.'
        );
      }
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error ? deleteFailure.message : 'Failed to permanently delete report'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteImpact(null);
    setDeleteError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#E4EBE4] border-t-[#356B43]" />
        <p className="font-medium text-[#7A8075]">Loading archived reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-700" />
          <h2 className="mb-2 text-2xl font-bold text-[#254431]">Unable to Load Archived Reports</h2>
          <p className="text-[#7A8075]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] px-4 py-4 text-white shadow-lg sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Link href="/reports" className="mb-4 flex items-center gap-1.5 text-[#86A98A] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Reports</span>
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Image src="/images/sapaa-icon-white.png" alt="SAPAA" width={140} height={140} className="h-16 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Admin: Archived Reports</h1>
                  <p className="text-[#E4EBE4]">Restore reports or permanently delete them</p>
                </div>
              </div>
              <div className="[&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:px-0 [&>nav]:py-0 [&>nav]:shadow-none">
                <AdminNavBar />
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A8075]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by site, report number, or steward"
              className="w-full rounded-xl border-2 border-[#E4EBE4] bg-white py-3 pl-12 pr-4 text-[#1E2520] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#356B43]"
            />
          </div>
          <p className="mb-6 font-medium text-[#7A8075]">
            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} archived
          </p>

          {actionMessage && <p role="alert" className="mb-4 text-sm text-red-700">{actionMessage}</p>}

          {filteredReports.length === 0 ? (
            <div className="py-16 text-center">
              <Archive className="mx-auto mb-4 h-12 w-12 text-[#7A8075]" />
              <h2 className="text-xl font-bold text-[#254431]">No archived reports</h2>
            </div>
          ) : (
            <ul className="divide-y divide-[#E4EBE4] rounded-2xl bg-white shadow-sm">
              {filteredReports.map((report) => (
                <li key={report.id} data-testid={`archived-report-row-${report.id}`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-[#254431]">
                      {report.inspectionNo ?? `Report #${report.id}`}
                    </p>
                    <p className="text-sm text-[#5B655D]">{report.siteName ?? 'Unknown site'} · {formatDate(report.inspectionDate ?? report.createdAt)}</p>
                    <p className="text-sm text-[#5B655D]">
                      Submitted by {report.submitterName ?? 'Unknown steward'}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#7A8075]">
                      <Calendar className="h-3 w-3" /> Archived {formatDate(report.archivedAt)}
                      {!report.isActive && ' · Was inactive'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid={`restore-report-button-${report.id}`}
                      onClick={() => void handleRestore(report)}
                      disabled={restoringId === report.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#F7F2EA] px-4 py-2 text-sm font-medium text-[#254431] disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {restoringId === report.id ? 'Restoring...' : 'Restore'}
                    </button>
                    <button
                      type="button"
                      data-testid={`permanent-delete-report-button-${report.id}`}
                      onClick={() => void handleOpenDelete(report)}
                      title="Permanently delete report"
                      className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      <PermanentDeleteReportModal
        report={deleteTarget}
        impact={deleteImpact}
        loading={loadingDeleteImpact}
        deleting={deleting}
        error={deleteError}
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </ProtectedRoute>
  );
}
