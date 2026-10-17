'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import {
  getArchivedSiteInspectionReports,
  getSiteInspectionReportDeleteImpact,
  permanentlyDeleteSiteInspectionReport,
  restoreSiteInspectionReport,
  type ArchivedSiteInspectionReport,
  type SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';
import { useApi } from '@/app/v2/_lib/useApi';
import { btn, EmptyState, ErrorState, ListSkeleton, Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { Confirm, errMsg, ImpactList, refreshSite, toast, useIsAdmin } from './shared';

const title = (r: ArchivedSiteInspectionReport) => (r.inspectionNo ? `Report ${r.inspectionNo}` : `Report #${r.id}`);

/**
 * The Archived view of the Reports tab (classic /admin/reports/archived): a header button for admins that
 * opens the archived reports, each with Restore and Delete for good.
 */
export default function AdminArchivedReports() {
  const isAdmin = useIsAdmin();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<ArchivedSiteInspectionReport | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const list = useApi(isAdmin ? 'admin:archived-reports' : null, getArchivedSiteInspectionReports);
  if (!isAdmin) return null;

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  const restore = async (r: ArchivedSiteInspectionReport) => {
    setBusy(r.id);
    try {
      await restoreSiteInspectionReport(r.id);
      toast(`${title(r)} restored to ${r.siteName ?? 'its site'}.`);
      refreshSite(r.siteName);
      list.refetch();
    } catch (e) {
      toast(errMsg(e, 'The report was not restored. Try again.'), 'error');
    } finally {
      setBusy(null);
    }
  };
  const n = list.data?.length;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`${btn.onPhoto} px-4`}
      >
        <Archive size={16} aria-hidden />
        Archived
        {n !== undefined && <span className="num text-[var(--sage)]">{n}</span>}
      </button>

      {open && (
        <>
          <Sheet
            open={!target}
            onClose={close}
            title="Archived reports"
            description="Out of every list and site history. Restore puts a report back where it was."
          >
            {list.error ? (
              <ErrorState title="Archived reports didn’t load" error={list.error} onRetry={list.refetch} />
            ) : !list.data ? (
              <ListSkeleton label="Loading archived reports" rows={4} />
            ) : list.data.length === 0 ? (
              <EmptyState title="No archived reports" body="Archive a report from its site page: Manage under the report." />
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {list.data.map((r) => (
                  <li key={r.id} className="py-3">
                    <p className="font-semibold">
                      {title(r)}
                      {!r.isActive && <span className="ml-2 text-sm font-semibold text-[var(--st-due-ink)]">Disabled</span>}
                    </p>
                    <p className="num text-sm text-[var(--ink-2)]">
                      {r.siteName ?? 'Deleted site'}, visited {formatDate(r.inspectionDate ?? r.createdAt)}
                      {r.submitterName && `, by ${r.submitterName}`}
                    </p>
                    <p className="num text-sm text-[var(--ink-2)]">Archived {formatDate(r.archivedAt)}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => restore(r)}
                        disabled={busy !== null || !r.siteName}
                        title={r.siteName ? undefined : 'Its site was deleted'}
                        className={`${btn.secondary} min-h-11 flex-1 px-3 text-[15px]`}
                      >
                        {busy === r.id ? <Loader2 size={16} aria-hidden className="animate-spin" /> : <RotateCcw size={16} aria-hidden />}
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setTarget(r)}
                        disabled={busy !== null}
                        className="press flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-m)] px-3 text-[15px] font-semibold text-[var(--clay-ink)] hover:bg-[var(--bg-sunken)]"
                      >
                        <Trash2 size={16} aria-hidden />
                        Delete for good
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>

          <DeleteReport
            report={target}
            onClose={() => setTarget(null)}
            onDone={(r, cleaned) => {
              setTarget(null);
              toast(
                cleaned ? `${title(r)} deleted for good.` : `${title(r)} deleted. Some photo files could not be removed from storage.`,
                cleaned ? 'ok' : 'error',
              );
              list.refetch();
            }}
          />
        </>
      )}
    </>
  );
}

function DeleteReport({
  report,
  onClose,
  onDone,
}: {
  report: ArchivedSiteInspectionReport | null;
  onClose: () => void;
  onDone: (r: ArchivedSiteInspectionReport, storageCleaned: boolean) => void;
}) {
  const [impact, setImpact] = useState<SiteInspectionReportDeleteImpact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = report?.id;

  useEffect(() => {
    if (id === undefined) return;
    let live = true;
    getSiteInspectionReportDeleteImpact(id).then(
      (i) => live && setImpact(i),
      (e) => live && setError(errMsg(e, 'The report details didn’t load. Close and try again.')),
    );
    return () => {
      live = false;
      setImpact(null);
      setError(null);
    };
  }, [id]);

  const confirm = async () => {
    if (!report) return;
    setBusy(true);
    setError(null);
    try {
      const out = await permanentlyDeleteSiteInspectionReport(report.id);
      onDone(report, out.storageCleanupComplete);
    } catch (e) {
      setError(errMsg(e, 'The report was not deleted. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Confirm
      open={!!report}
      onClose={onClose}
      title={`Delete ${report ? title(report).toLowerCase() : 'report'} for good?`}
      description="The report, its answers and its photo files are removed. This cannot be undone."
      confirmLabel={busy ? 'Deleting' : 'Delete for good'}
      busy={busy}
      ready={!!impact}
      error={error}
      onConfirm={confirm}
    >
      <ImpactList
        loading={!impact && !error}
        rows={
          impact && [
            ['Answers', impact.answerCount],
            ['Photos', impact.attachmentCount],
          ]
        }
      />
    </Confirm>
  );
}
