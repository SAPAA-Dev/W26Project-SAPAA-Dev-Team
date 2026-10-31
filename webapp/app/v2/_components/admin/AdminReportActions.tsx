'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, Download, Eye, EyeOff, MoreHorizontal, PencilLine } from 'lucide-react';
import type { Report } from '@/lib/api/v1/types';
import {
  archiveSiteInspectionReport,
  getSiteInspectionReportDeleteImpact,
  setFormResponseActive,
  type SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';
import { Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { EditReportSheet } from '@/app/v2/_components/flows/EditReport';
import { Confirm, errMsg, ImpactList, MenuRow, MenuRule, refreshSite, toast, useIsAdmin } from './shared';
import { PdfSheet } from './pdf';

type Panel = 'menu' | 'edit' | 'pdf' | 'archive';

/**
 * The admin row under a report in the site timeline: a Disabled tag when stewards cannot see the report,
 * and Manage (edit answers, disable or enable, PDF, archive), as on the classic admin site page.
 */
export default function AdminReportActions({ report }: { report: Report }) {
  const isAdmin = useIsAdmin();
  const trigger = useRef<HTMLButtonElement>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toggling, setToggling] = useState(false);
  if (!isAdmin) return null;

  const active = report.isActive !== false;
  const name = report.inspectionNo ? `Report ${report.inspectionNo}` : `Report from ${formatDate(report.date)}`;
  const close = () => {
    setPanel(null);
    // The sheets unmount; focus goes back to the button that opened them.
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const toggle = async () => {
    setToggling(true);
    try {
      await setFormResponseActive(report.id, !active);
      toast(active ? `${name} disabled. Stewards no longer see it.` : `${name} enabled.`);
      refreshSite(report.siteSlug);
      close();
    } catch (e) {
      toast(errMsg(e, 'The report did not change. Try again.'), 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className="flex min-h-11 items-center gap-2 border-t border-dashed border-[var(--line)] pr-1 pl-4">
        {!active && (
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--st-due-ink)]">
            <EyeOff size={14} aria-hidden />
            Disabled, hidden from stewards
          </span>
        )}
        <button
          ref={trigger}
          type="button"
          onClick={() => setPanel('menu')}
          aria-haspopup="dialog"
          aria-label={`Manage ${name.toLowerCase()}`}
          className="press ml-auto flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)]"
        >
          Manage
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>

      {panel && (
        <>
          <Sheet
            open={panel === 'menu'}
            onClose={close}
            title={name}
            description={`${report.siteName}, ${formatDate(report.date, 'long')}`}
          >
            <MenuRow icon={PencilLine} label="Edit answers" hint="Fix typos and wrong answers" onClick={() => setPanel('edit')} />
            <MenuRow
              icon={active ? EyeOff : Eye}
              label={active ? 'Disable report' : 'Enable report'}
              hint={active ? 'Hide it from stewards and site stats' : 'Show it to stewards again'}
              busy={toggling}
              onClick={toggle}
            />
            <MenuRow icon={Download} label="Export PDF" hint="This report only" onClick={() => setPanel('pdf')} />
            <MenuRule />
            <MenuRow
              icon={Archive}
              label="Archive report"
              hint="Take it out of the history. You can restore it."
              danger
              onClick={() => setPanel('archive')}
            />
          </Sheet>

          {/* Saves through PUT /api/v1/reports/:id, so the hidden-answer choices survive an admin edit. */}
          <EditReportSheet
            open={panel === 'edit'}
            onClose={close}
            report={report}
            title={name}
            onSaved={() => {
              toast('Answers saved.');
              refreshSite(report.siteSlug);
              close();
            }}
          />
          <PdfSheet
            open={panel === 'pdf'}
            onClose={close}
            target={{ mode: 'single', responseId: report.id }}
            subject={`${name}, ${report.siteName}`}
          />
          <ArchiveReport
            open={panel === 'archive'}
            onClose={close}
            report={report}
            name={name}
            onDone={() => {
              setPanel(null);
              toast(`${name} archived. Restore it from Reports, Archived.`);
              refreshSite(report.siteSlug);
            }}
          />
        </>
      )}
    </>
  );
}

/* ---------- archive one report ---------- */

function ArchiveReport({
  open,
  onClose,
  report,
  name,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  report: Report;
  name: string;
  onDone: () => void;
}) {
  const [impact, setImpact] = useState<SiteInspectionReportDeleteImpact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    getSiteInspectionReportDeleteImpact(report.id).then(
      (i) => live && setImpact(i),
      (e) => live && setError(errMsg(e, 'The report details didn’t load. Close and try again.')),
    );
    return () => {
      live = false;
      setImpact(null);
      setError(null);
    };
  }, [open, report.id]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await archiveSiteInspectionReport(report.id);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'The report was not archived. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Confirm
      open={open}
      onClose={onClose}
      title={`Archive ${name.toLowerCase()}?`}
      description={`It leaves ${report.siteName}’s history and every list. Its answers and photos are kept until you restore it.`}
      confirmLabel={busy ? 'Archiving' : 'Archive report'}
      busy={busy}
      ready={!!impact}
      error={error}
      onConfirm={confirm}
    >
      <ImpactList
        loading={!impact && !error}
        rows={
          impact && [
            ['Answers kept', impact.answerCount],
            ['Photos kept', impact.attachmentCount],
          ]
        }
      />
    </Confirm>
  );
}
